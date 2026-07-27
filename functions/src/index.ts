import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import {
  MAX_RECOVERY_IMAGE_BASE64_BYTES,
  MAX_REQUEST_BODY_BYTES,
  MAX_REQUESTS_PER_DAY,
  MAX_REQUESTS_PER_WINDOW,
  OPENAI_MODEL,
  PREMIUM_ENTITLEMENT_ID,
  RATE_LIMIT_WINDOW_MS,
  RECOVERY_MAX_TOKENS,
  REVENUECAT_API_URL,
} from "./config.js";

if (getApps().length === 0) {
  initializeApp();
}

const openAiApiKey = defineSecret("OPENAI_API_KEY");
const revenueCatApiKey = defineSecret("REVENUECAT_API_KEY");

const db = getFirestore();

type GuideMessage = {
  role: "user" | "assistant";
  content: string;
};

type GuideContext = {
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  currentTrail?: {
    name: string;
    difficulty: string;
    distance: number;
    features?: string[];
  };
  weather?: {
    condition: string;
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
  vehicleType?: string;
  experienceLevel?: string;
  userPreferences?: {
    difficulty?: string;
    terrain?: string;
    distance?: string;
  };
};

type RecoveryAnalysis = {
  situation: string;
  severity: "low" | "moderate" | "high" | "critical";
  recommendations: string[];
  requiredEquipment: string[];
  safetyWarnings: string[];
  estimatedDifficulty: string;
};

type ProxyRequest =
  | {
      operation: "recovery";
      imageBase64: string;
    }
  | {
      operation: "chat";
      conversationHistory: GuideMessage[];
      context: GuideContext;
    }
  | {
      operation: "getSmartSuggestions";
      context: GuideContext;
    }
  | {
      operation: "getQuickTip";
      context: GuideContext;
    };

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function sendError(
  res: { status: (code: number) => any; json: (body: any) => any },
  error: unknown,
) {
  if (error instanceof HttpError) {
    res
      .status(error.status)
      .json({ error: error.code, message: error.message });
    return;
  }

  logger.error("openai_proxy_unhandled_error", {
    error: error instanceof Error ? error.message : "unknown",
  });
  res
    .status(500)
    .json({ error: "internal", message: "AI service unavailable." });
}

function getBearerToken(authorization: string | undefined): string {
  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(
      401,
      "unauthenticated",
      "A Firebase ID token is required.",
    );
  }
  return authorization.slice("Bearer ".length).trim();
}

async function authenticateUser(authorization: string | undefined) {
  let decodedToken;
  try {
    decodedToken = await getAuth().verifyIdToken(getBearerToken(authorization));
  } catch {
    throw new HttpError(
      401,
      "unauthenticated",
      "The Firebase ID token is invalid.",
    );
  }
  const provider = decodedToken.firebase?.sign_in_provider;

  if (!provider || provider === "anonymous") {
    throw new HttpError(
      403,
      "premium_required",
      "A premium account is required.",
    );
  }

  return decodedToken;
}

async function hasPremiumEntitlement(uid: string): Promise<boolean> {
  const apiKey = revenueCatApiKey.value();
  if (!apiKey) {
    throw new HttpError(
      500,
      "configuration",
      "RevenueCat entitlement verification is unavailable.",
    );
  }

  const response = await fetch(
    `${REVENUECAT_API_URL}/${encodeURIComponent(uid)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    },
  );

  if (!response.ok) {
    throw new HttpError(
      502,
      "entitlement_unavailable",
      "Premium status could not be verified.",
    );
  }

  const data = (await response.json()) as {
    subscriber?: {
      entitlements?: Record<string, { expires_date?: string | null }>;
    };
  };
  const entitlement = data.subscriber?.entitlements?.[PREMIUM_ENTITLEMENT_ID];
  if (!entitlement) return false;

  return (
    entitlement.expires_date === null ||
    (typeof entitlement.expires_date === "string" &&
      new Date(entitlement.expires_date).getTime() > Date.now())
  );
}

async function consumeQuota(uid: string): Promise<void> {
  const usageRef = db.collection("aiUsage").doc(uid);
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(usageRef);
    const data = snapshot.exists ? (snapshot.data() ?? {}) : {};
    const recentRequestTimestamps = Array.isArray(data.recentRequestTimestamps)
      ? data.recentRequestTimestamps.filter(
          (timestamp): timestamp is number =>
            typeof timestamp === "number" &&
            timestamp > now - RATE_LIMIT_WINDOW_MS,
        )
      : [];
    const dailyCount =
      data.day === day && typeof data.dailyCount === "number"
        ? data.dailyCount
        : 0;

    if (recentRequestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      throw new HttpError(
        429,
        "rate_limited",
        "Too many AI requests. Please try again in a moment.",
      );
    }
    if (dailyCount >= MAX_REQUESTS_PER_DAY) {
      throw new HttpError(
        429,
        "daily_quota_exceeded",
        "Daily AI limit reached. Please try again tomorrow.",
      );
    }

    transaction.set(
      usageRef,
      {
        day,
        dailyCount: dailyCount + 1,
        recentRequestTimestamps: [...recentRequestTimestamps, now],
        updatedAt: now,
      },
      { merge: true },
    );
  });
}

function requireObject(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "invalid_request", `${name} is required.`);
  }
  return value as Record<string, unknown>;
}

function requireString(
  value: unknown,
  name: string,
  maxLength = 100_000,
): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > maxLength
  ) {
    throw new HttpError(400, "invalid_request", `${name} is invalid.`);
  }
  return value;
}

function parseRequest(body: unknown): ProxyRequest {
  const request = requireObject(body, "Request");
  const operation = requireString(request.operation, "operation", 40);

  if (operation === "recovery") {
    const imageBase64 = requireString(request.imageBase64, "imageBase64");
    if (imageBase64.length > MAX_RECOVERY_IMAGE_BASE64_BYTES) {
      throw new HttpError(
        413,
        "request_too_large",
        "The recovery image is too large.",
      );
    }
    return { operation, imageBase64 };
  }

  if (
    operation === "chat" ||
    operation === "getSmartSuggestions" ||
    operation === "getQuickTip"
  ) {
    const context = requireObject(request.context, "context") as GuideContext;
    if (operation === "chat") {
      if (
        !Array.isArray(request.conversationHistory) ||
        request.conversationHistory.length > 10
      ) {
        throw new HttpError(
          400,
          "invalid_request",
          "conversationHistory is invalid.",
        );
      }
      const conversationHistory = request.conversationHistory.map((message) => {
        const parsed = requireObject(message, "conversationHistory item");
        const role = parsed.role;
        if (role !== "user" && role !== "assistant") {
          throw new HttpError(
            400,
            "invalid_request",
            "conversationHistory role is invalid.",
          );
        }
        return {
          role,
          content: requireString(
            parsed.content,
            "conversationHistory content",
            4_000,
          ),
        } as GuideMessage;
      });
      return { operation, conversationHistory, context };
    }
    return { operation, context };
  }

  throw new HttpError(400, "invalid_request", "Unsupported AI operation.");
}

function buildContextMessage(context: GuideContext): string {
  const contextParts: string[] = ["**Current Context:**"];
  if (
    context.userLocation &&
    typeof context.userLocation.latitude === "number" &&
    typeof context.userLocation.longitude === "number"
  ) {
    contextParts.push(
      `📍 Location: ${context.userLocation.latitude.toFixed(4)}, ${context.userLocation.longitude.toFixed(4)}`,
    );
  }
  if (context.currentTrail) {
    contextParts.push(`🛤️ Current Trail: ${context.currentTrail.name}`);
    contextParts.push(`   - Difficulty: ${context.currentTrail.difficulty}`);
    contextParts.push(`   - Distance: ${context.currentTrail.distance} miles`);
    if (Array.isArray(context.currentTrail.features)) {
      contextParts.push(
        `   - Features: ${context.currentTrail.features.join(", ")}`,
      );
    }
  }
  if (context.weather && typeof context.weather === "object") {
    contextParts.push(
      `🌤️ Weather: ${context.weather.condition}, ${context.weather.temperature}°F`,
    );
    contextParts.push(`   - Humidity: ${context.weather.humidity}%`);
    contextParts.push(`   - Wind: ${context.weather.windSpeed} mph`);
  }
  if (context.vehicleType)
    contextParts.push(`🚙 Vehicle: ${context.vehicleType}`);
  if (context.experienceLevel)
    contextParts.push(`👤 Experience: ${context.experienceLevel}`);
  if (context.userPreferences) {
    const preferences: string[] = [];
    if (context.userPreferences.difficulty)
      preferences.push(`Difficulty: ${context.userPreferences.difficulty}`);
    if (context.userPreferences.terrain)
      preferences.push(`Terrain: ${context.userPreferences.terrain}`);
    if (context.userPreferences.distance)
      preferences.push(`Distance: ${context.userPreferences.distance}`);
    if (preferences.length > 0)
      contextParts.push(`⚙️ Preferences: ${preferences.join(", ")}`);
  }
  return contextParts.join("\n");
}

const systemPrompt = `You are "Trail Buddy", an expert off-road adventure guide and safety advisor for the Adventure Time app. Your role is to help users:

**Core Responsibilities:**
1. Recommend trails based on user preferences, vehicle capabilities, and experience level
2. Provide real-time safety advice and warnings
3. Offer technical guidance for off-road driving
4. Share local knowledge about trails, terrain, and conditions
5. Help with trip planning and preparation
6. Provide emergency assistance guidance

**Personality:**
- Friendly, encouraging, and supportive
- Safety-conscious but not overly cautious
- Knowledgeable about off-roading, vehicles, and outdoor activities
- Uses appropriate off-road terminology
- Occasionally uses emojis to be engaging (🚙 🏔️ ⚠️ 🧭)

**Communication Style:**
- Keep responses concise and actionable
- Use bullet points for lists
- Prioritize safety information
- Be encouraging for beginners
- Provide technical details when asked
- Always consider current conditions (weather, location, time)

**Safety First:**
- Always emphasize safety precautions
- Warn about dangerous conditions
- Recommend proper equipment
- Suggest turning back if conditions are unsafe
- Provide emergency contact information when relevant

**Context Awareness:**
You have access to:
- User's current location
- Current trail information
- Weather conditions
- Vehicle type and specifications
- User's experience level
- Recent activities and preferences

Use this context to provide personalized, relevant advice.

**Response Format:**
- Start with the most important information
- Use clear, simple language
- Include actionable steps when appropriate
- End with a question or suggestion to continue the conversation`;

const recoverySystemPrompt = `You are an expert off-road vehicle recovery specialist. Analyze images of stuck or disabled vehicles and provide detailed recovery recommendations.

Your response must be in JSON format with this exact structure:
{
  "situation": "Brief description of what you see",
  "severity": "low|moderate|high|critical",
  "recommendations": ["Step 1", "Step 2", "Step 3"],
  "requiredEquipment": ["Equipment item 1", "Equipment item 2"],
  "safetyWarnings": ["Warning 1", "Warning 2"],
  "estimatedDifficulty": "Easy|Moderate|Difficult|Expert"
}

Focus on:
- Vehicle position and angle
- Terrain type (mud, sand, rock, snow)
- Obstacles and hazards
- Best recovery approach
- Safety considerations`;

async function callOpenAI(body: Record<string, unknown>): Promise<any> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAiApiKey.value()}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new HttpError(
        429,
        "rate_limited",
        "OpenAI is busy. Please try again later.",
      );
    }
    throw new HttpError(502, "upstream_error", "AI service unavailable.");
  }
  return response.json();
}

function parseJsonContent(content: unknown): unknown {
  if (typeof content !== "string" || content.trim().length === 0) {
    throw new HttpError(
      502,
      "invalid_upstream_response",
      "AI returned no response.",
    );
  }
  const cleaned = content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new HttpError(
      502,
      "invalid_upstream_response",
      "AI returned an invalid response.",
    );
  }
}

async function performOperation(
  request: ProxyRequest,
): Promise<Record<string, unknown>> {
  if (request.operation === "recovery") {
    const data = await callOpenAI({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: recoverySystemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this off-road recovery situation and provide detailed recommendations.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${request.imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: RECOVERY_MAX_TOKENS,
      temperature: 0.7,
    });
    const analysis = parseJsonContent(
      data.choices?.[0]?.message?.content,
    ) as RecoveryAnalysis;
    if (
      !analysis.situation ||
      !analysis.severity ||
      !Array.isArray(analysis.recommendations) ||
      !Array.isArray(analysis.requiredEquipment) ||
      !Array.isArray(analysis.safetyWarnings)
    ) {
      throw new HttpError(
        502,
        "invalid_upstream_response",
        "AI returned an invalid response.",
      );
    }
    return { analysis };
  }

  const contextMessage = buildContextMessage(request.context);
  if (request.operation === "chat") {
    const data = await callOpenAI({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "system", content: contextMessage },
        ...request.conversationHistory,
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    return {
      text:
        data.choices?.[0]?.message?.content ||
        "I'm having trouble responding right now. Please try again.",
    };
  }

  if (request.operation === "getSmartSuggestions") {
    const prompt = `Based on the current context, provide 3-5 smart suggestions for the user.

${contextMessage}

Format your response as a JSON array of suggestions with this structure:
[
  {
    "type": "trail|safety|tip|warning|recommendation",
    "title": "Short title",
    "message": "Brief message (1-2 sentences)",
    "priority": "low|medium|high|critical"
  }
]

Focus on actionable, relevant suggestions based on current conditions.`;
    const data = await callOpenAI({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });
    const parsed = parseJsonContent(data.choices?.[0]?.message?.content);
    const suggestions = Array.isArray(parsed)
      ? parsed
      : (parsed as { suggestions?: unknown })?.suggestions;
    return { suggestions: Array.isArray(suggestions) ? suggestions : [] };
  }

  const prompt = `Provide one quick, actionable off-road tip relevant to the current context. Keep it under 100 characters and start with an emoji.

${contextMessage}`;
  const data = await callOpenAI({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0.9,
    max_tokens: 50,
  });
  return {
    text:
      data.choices?.[0]?.message?.content?.trim() ||
      "💡 Stay safe and have fun on the trails!",
  };
}

export const openaiProxy = onRequest(
  {
    region: "us-central1",
    cors: true,
    timeoutSeconds: 150,
    memory: "512MiB",
    secrets: [openAiApiKey, revenueCatApiKey],
  },
  async (req, res) => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res
        .status(405)
        .json({ error: "method_not_allowed", message: "Use POST." });
      return;
    }

    const startedAt = Date.now();
    let uid = "unknown";
    let operation = "unknown";
    let outcome = "error";

    try {
      const contentLength = Number(req.headers["content-length"] || 0);
      if (contentLength > MAX_REQUEST_BODY_BYTES) {
        throw new HttpError(
          413,
          "request_too_large",
          "The request body is too large.",
        );
      }
      const request = parseRequest(req.body);
      operation = request.operation;
      if (
        Buffer.byteLength(JSON.stringify(req.body), "utf8") >
        MAX_REQUEST_BODY_BYTES
      ) {
        throw new HttpError(
          413,
          "request_too_large",
          "The request body is too large.",
        );
      }

      const decodedToken = await authenticateUser(req.headers.authorization);
      uid = decodedToken.uid;
      if (!(await hasPremiumEntitlement(uid))) {
        throw new HttpError(
          403,
          "premium_required",
          "A premium subscription is required.",
        );
      }
      await consumeQuota(uid);

      const result = await performOperation(request);
      outcome = "success";
      res.status(200).json(result);
    } catch (error) {
      outcome = error instanceof HttpError ? error.code : "error";
      sendError(res, error);
    } finally {
      logger.info("openai_proxy_request", {
        uid,
        operation,
        latencyMs: Date.now() - startedAt,
        outcome,
      });
    }
  },
);
