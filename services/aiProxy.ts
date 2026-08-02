import { getFirebaseServices } from "@/config/firebase";

// The OpenAI key is never shipped in the bundle — see worker/README.md.
// This URL is safe to inline: the proxy rejects anything without a valid
// Firebase ID token.
const PROXY_URL = process.env.EXPO_PUBLIC_AI_PROXY_URL;

export function isAIProxyConfigured(): boolean {
  return Boolean(PROXY_URL);
}

export async function callAIProxy(payload: object): Promise<any> {
  if (!PROXY_URL) {
    console.error("EXPO_PUBLIC_AI_PROXY_URL is not set; AI is unavailable.");
    throw new Error(
      "AI features are temporarily unavailable. Please try again later.",
    );
  }

  const { auth } = getFirebaseServices();
  const user = auth?.currentUser;

  if (!user) {
    throw new Error("Please sign in to use AI features.");
  }

  const response = await fetch(PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await user.getIdToken()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response
      .json()
      .then((body) => body?.error)
      .catch(() => null);
    throw new Error(message || `AI service error: ${response.status}`);
  }

  return response.json();
}
