import { Trail } from "@/utils/trails";
import { WeatherService } from "@/utils/firebase";

interface GuideContext {
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  currentTrail?: Trail;
  weather?: any;
  vehicleType?: string;
  experienceLevel?: string;
  recentActivities?: string[];
  userPreferences?: {
    difficulty?: string;
    terrain?: string;
    distance?: string;
  };
}

interface GuideMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GuideSuggestion {
  type: "trail" | "safety" | "tip" | "warning" | "recommendation";
  title: string;
  message: string;
  priority: "low" | "medium" | "high" | "critical";
  actionable?: boolean;
  action?: {
    label: string;
    type: "navigate" | "call" | "share" | "view";
    data?: any;
  };
}

class AIGuideService {
  private apiKey: string | null = null;
  private conversationHistory: GuideMessage[] = [];
  private context: GuideContext = {};
  private systemPrompt: string;
  private apiUrl = "https://api.openai.com/v1/chat/completions";

  constructor() {
    this.initializeAPI();
    this.systemPrompt = this.createSystemPrompt();
  }

  private initializeAPI() {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

    if (!apiKey) {
      console.warn(
        "OpenAI API key not configured. AI Guide will not be available."
      );
      return;
    }

    this.apiKey = apiKey;
  }

  private createSystemPrompt(): string {
    return `You are "Trail Buddy", an expert off-road adventure guide and safety advisor for the Adventure Time app. Your role is to help users:

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
  }

  isAvailable(): boolean {
    return this.apiKey !== null;
  }

  updateContext(context: Partial<GuideContext>) {
    this.context = { ...this.context, ...context };
  }

  getContext(): GuideContext {
    return this.context;
  }

  clearConversation() {
    this.conversationHistory = [];
  }

  async chat(userMessage: string): Promise<string> {
    if (!this.apiKey) {
      return "I'm sorry, but I'm not available right now. Please check your internet connection and try again.";
    }

    try {
      // Add user message to history
      this.conversationHistory.push({
        role: "user",
        content: userMessage,
      });

      // Build context-aware messages
      const messages: GuideMessage[] = [
        {
          role: "system",
          content: this.systemPrompt,
        },
        {
          role: "system",
          content: this.buildContextMessage(),
        },
        ...this.conversationHistory.slice(-10), // Keep last 10 messages for context
      ];

      // Call OpenAI API
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage =
        data.choices[0]?.message?.content ||
        "I'm having trouble responding right now. Please try again.";

      // Add assistant response to history
      this.conversationHistory.push({
        role: "assistant",
        content: assistantMessage,
      });

      // Cap conversation history to prevent unbounded memory growth
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return assistantMessage;
    } catch (error: any) {
      console.error("AI Guide chat error:", error);

      if (
        error.message?.includes("rate limit") ||
        error.message?.includes("429")
      ) {
        return "I'm getting too many requests right now. Please wait a moment and try again.";
      }

      return "I encountered an error. Please try asking your question again.";
    }
  }

  private buildContextMessage(): string {
    const contextParts: string[] = ["**Current Context:**"];

    if (this.context.userLocation) {
      contextParts.push(
        `📍 Location: ${this.context.userLocation.latitude.toFixed(
          4
        )}, ${this.context.userLocation.longitude.toFixed(4)}`
      );
    }

    if (this.context.currentTrail) {
      const trail = this.context.currentTrail;
      contextParts.push(`🛤️ Current Trail: ${trail.name}`);
      contextParts.push(`   - Difficulty: ${trail.difficulty}`);
      contextParts.push(`   - Distance: ${trail.distance} miles`);
      if (trail.features) {
        contextParts.push(`   - Features: ${trail.features.join(", ")}`);
      }
    }

    if (this.context.weather) {
      const w = this.context.weather;
      contextParts.push(`🌤️ Weather: ${w.condition}, ${w.temperature}°F`);
      contextParts.push(`   - Humidity: ${w.humidity}%`);
      contextParts.push(`   - Wind: ${w.windSpeed} mph`);
    }

    if (this.context.vehicleType) {
      contextParts.push(`🚙 Vehicle: ${this.context.vehicleType}`);
    }

    if (this.context.experienceLevel) {
      contextParts.push(`👤 Experience: ${this.context.experienceLevel}`);
    }

    if (this.context.userPreferences) {
      const prefs = this.context.userPreferences;
      const prefsList: string[] = [];
      if (prefs.difficulty) prefsList.push(`Difficulty: ${prefs.difficulty}`);
      if (prefs.terrain) prefsList.push(`Terrain: ${prefs.terrain}`);
      if (prefs.distance) prefsList.push(`Distance: ${prefs.distance}`);
      if (prefsList.length > 0) {
        contextParts.push(`⚙️ Preferences: ${prefsList.join(", ")}`);
      }
    }

    return contextParts.join("\n");
  }

  async getSmartSuggestions(): Promise<GuideSuggestion[]> {
    if (!this.apiKey) return [];

    try {
      const prompt = `Based on the current context, provide 3-5 smart suggestions for the user. 
      
${this.buildContextMessage()}

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

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: this.systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.8,
          max_tokens: 800,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) throw new Error("API error");
      const data = await response.json();

      const content = data.choices[0]?.message?.content;
      if (!content) return [];

      const parsed = JSON.parse(content);
      return parsed.suggestions || parsed || [];
    } catch (error) {
      console.error("Error getting smart suggestions:", error);
      return [];
    }
  }

  async getTrailRecommendations(
    trails: Trail[],
    limit: number = 3
  ): Promise<Trail[]> {
    if (!this.apiKey || trails.length === 0) return trails.slice(0, limit);

    try {
      const trailsInfo = trails
        .map((t, i) => `${i + 1}. ${t.name} - ${t.difficulty}, ${t.distance}mi`)
        .join("\n");

      const prompt = `Based on the user's context and these available trails, recommend the top ${limit} trails that would be best suited for them. Return only the trail numbers (e.g., "1,3,5").

${this.buildContextMessage()}

Available Trails:
${trailsInfo}

Return format: Just comma-separated numbers, no explanation.`;

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: this.systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 50,
        }),
      });

      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim();
      if (!content) return trails.slice(0, limit);

      const indices = content
        .split(",")
        .map((n: string) => parseInt(n.trim()) - 1)
        .filter((i: number) => i >= 0 && i < trails.length);

      return indices.map((i: number) => trails[i]).slice(0, limit);
    } catch (error) {
      console.error("Error getting trail recommendations:", error);
      return trails.slice(0, limit);
    }
  }

  async analyzeTrailSafety(trail: Trail): Promise<{
    safetyScore: number;
    warnings: string[];
    recommendations: string[];
  }> {
    if (!this.apiKey) {
      return {
        safetyScore: 7,
        warnings: [],
        recommendations: ["Check weather conditions before starting"],
      };
    }

    try {
      const prompt = `Analyze the safety of this trail for the current user and conditions:

Trail: ${trail.name}
Difficulty: ${trail.difficulty}
Distance: ${trail.distance} miles
Features: ${trail.features?.join(", ") || "None listed"}

${this.buildContextMessage()}

Provide a safety analysis in JSON format:
{
  "safetyScore": 1-10,
  "warnings": ["warning1", "warning2"],
  "recommendations": ["rec1", "rec2"]
}`;

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: this.systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.6,
          max_tokens: 400,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      if (!content) throw new Error("No response");

      return JSON.parse(content);
    } catch (error) {
      console.error("Error analyzing trail safety:", error);
      return {
        safetyScore: 7,
        warnings: ["Unable to analyze safety at this time"],
        recommendations: ["Proceed with caution and check conditions"],
      };
    }
  }

  async getQuickTip(): Promise<string> {
    if (!this.apiKey) {
      return "💡 Always let someone know your route and expected return time before heading out.";
    }

    try {
      const prompt = `Provide one quick, actionable off-road tip relevant to the current context. Keep it under 100 characters and start with an emoji.

${this.buildContextMessage()}`;

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: this.systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.9,
          max_tokens: 50,
        }),
      });

      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      return (
        data.choices[0]?.message?.content?.trim() ||
        "💡 Stay safe and have fun on the trails!"
      );
    } catch (error) {
      console.error("Error getting quick tip:", error);
      return "💡 Always carry emergency supplies and a first aid kit.";
    }
  }

  async getEmergencyGuidance(situation: string): Promise<string> {
    if (!this.apiKey) {
      return `Emergency Guidance:
1. Stay calm and assess the situation
2. Call 911 if there's immediate danger
3. Share your location with emergency contacts
4. Stay with your vehicle if possible
5. Use emergency supplies

If you need immediate help, call 911.`;
    }

    try {
      const prompt = `Provide emergency guidance for this situation: "${situation}"

${this.buildContextMessage()}

Give clear, step-by-step instructions prioritizing safety. Include when to call 911.`;

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                this.systemPrompt +
                "\n\nIMPORTANT: This is an emergency situation. Prioritize safety and provide clear, actionable steps.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 600,
        }),
      });

      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      return (
        data.choices[0]?.message?.content ||
        "Please call 911 for emergency assistance."
      );
    } catch (error) {
      console.error("Error getting emergency guidance:", error);
      return "Please call 911 immediately if you are in danger.";
    }
  }

  async generateTripPlan(
    destination: string,
    duration: string,
    preferences: string[]
  ): Promise<string> {
    if (!this.apiKey) {
      return "I'm unable to generate a trip plan right now. Please try again later.";
    }

    try {
      const prompt = `Create a detailed trip plan:

Destination: ${destination}
Duration: ${duration}
Preferences: ${preferences.join(", ")}

${this.buildContextMessage()}

Include:
- Recommended trails
- Timing and schedule
- Equipment checklist
- Safety considerations
- Points of interest`;

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: this.systemPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      return (
        data.choices[0]?.message?.content ||
        "Unable to generate trip plan at this time."
      );
    } catch (error) {
      console.error("Error generating trip plan:", error);
      return "Unable to generate trip plan. Please try again.";
    }
  }
}

export const aiGuideService = new AIGuideService();
export type { GuideContext, GuideSuggestion, GuideMessage };
