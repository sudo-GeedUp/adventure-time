// Verified proxy for OpenAI chat completions.
//
// The app must never hold the OpenAI key: anything shipped in an Expo bundle is
// readable by anyone who downloads the app. The key lives here as a Worker secret
// and requests are only forwarded for callers holding a valid Firebase ID token.

const JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const ALLOWED_MODELS = new Set(["gpt-4o-mini"]);
const MAX_TOKENS_CAP = 1200;
const MAX_BODY_BYTES = 8 * 1024 * 1024;

let jwksCache = { keys: null, expiresAt: 0 };

function b64urlToBytes(input) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, "="));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function b64urlToJson(input) {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(input)));
}

async function getJwks(now) {
  if (jwksCache.keys && now < jwksCache.expiresAt) return jwksCache.keys;

  const res = await fetch(JWKS_URL);
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
  const { keys } = await res.json();

  // Respect Google's rotation window rather than caching indefinitely.
  const cacheControl = res.headers.get("cache-control") || "";
  const maxAge = Number(/max-age=(\d+)/.exec(cacheControl)?.[1] ?? 3600);

  jwksCache = { keys, expiresAt: now + maxAge * 1000 };
  return keys;
}

// Returns the token's `sub` (Firebase UID) or throws.
async function verifyFirebaseToken(token, projectId) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("malformed token");
  const [rawHeader, rawPayload, rawSignature] = parts;

  const header = b64urlToJson(rawHeader);
  if (header.alg !== "RS256") throw new Error("unexpected alg");

  const now = Date.now();
  const keys = await getJwks(now);
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("unknown key id");

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    b64urlToBytes(rawSignature),
    new TextEncoder().encode(`${rawHeader}.${rawPayload}`),
  );
  if (!valid) throw new Error("bad signature");

  const payload = b64urlToJson(rawPayload);
  const seconds = Math.floor(now / 1000);
  const skew = 60;

  if (payload.aud !== projectId) throw new Error("wrong audience");
  if (payload.iss !== `https://securetoken.google.com/${projectId}`)
    throw new Error("wrong issuer");
  if (typeof payload.sub !== "string" || !payload.sub)
    throw new Error("missing subject");
  if (payload.exp <= seconds - skew) throw new Error("expired");
  if (payload.iat > seconds + skew) throw new Error("issued in the future");

  return payload.sub;
}

// RevenueCat is the only trustworthy source of subscription state — the app's
// own isPremium flag lives in AsyncStorage, where the device owner controls it.
// customer_id is the Firebase uid (see SubscriptionContext.tsx).
//
// This endpoint reports the entitlement's internal id ("entl..."), never its
// lookup key, so REVENUECAT_ENTITLEMENT_ID must hold the internal one.
async function hasPremiumEntitlement(uid, env) {
  const url =
    `https://api.revenuecat.com/v2/projects/${env.REVENUECAT_PROJECT_ID}` +
    `/customers/${encodeURIComponent(uid)}/active_entitlements`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.REVENUECAT_API_KEY}` },
  });
  if (res.status === 404) return false; // no customer record yet
  if (!res.ok) throw new Error(`RevenueCat ${res.status}`);

  const { items } = await res.json();

  return (items || []).some(
    (item) =>
      item.entitlement_id === env.REVENUECAT_ENTITLEMENT_ID &&
      // Null expiry means a lifetime grant.
      (!item.expires_at || item.expires_at > Date.now()),
  );
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return json(405, { error: "POST only" });

    const missing = [
      "OPENAI_API_KEY",
      "FIREBASE_PROJECT_ID",
      "REVENUECAT_API_KEY",
      "REVENUECAT_PROJECT_ID",
      "REVENUECAT_ENTITLEMENT_ID",
    ].filter((name) => !env[name]);
    if (missing.length) {
      console.error(`Worker misconfigured; missing: ${missing.join(", ")}`);
      return json(500, { error: "Server misconfigured" });
    }

    const auth = request.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return json(401, { error: "Missing bearer token" });
    }

    let uid;
    try {
      uid = await verifyFirebaseToken(auth.slice(7), env.FIREBASE_PROJECT_ID);
    } catch (error) {
      console.error("Token rejected:", error.message);
      return json(401, { error: "Invalid or expired session" });
    }

    try {
      if (!(await hasPremiumEntitlement(uid, env))) {
        return json(403, { error: "AI features require a subscription." });
      }
    } catch (error) {
      // Fail closed: an entitlement lookup we can't complete is not a pass.
      console.error("Entitlement check failed:", error.message);
      return json(503, { error: "Unable to verify subscription. Try again." });
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES)
      return json(413, { error: "Body too large" });

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return json(400, { error: "Invalid JSON" });
    }

    // Clamp what a caller can ask for, so a stolen session can't run up an
    // arbitrary bill by switching to an expensive model or a huge completion.
    if (!ALLOWED_MODELS.has(body.model)) {
      return json(400, { error: "Unsupported model" });
    }
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return json(400, { error: "Missing messages" });
    }
    body.max_tokens = Math.min(Number(body.max_tokens) || 500, MAX_TOKENS_CAP);
    body.stream = false;

    const upstream = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      // Upstream errors can quote the key or account details; log, don't forward.
      console.error(`OpenAI ${upstream.status} for uid ${uid}`);
      const status = upstream.status === 429 ? 429 : 502;
      return json(status, {
        error:
          status === 429
            ? "Too many requests. Please wait a moment."
            : "AI service unavailable",
      });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
