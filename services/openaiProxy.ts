import { authService } from "@/services/authService";

const OPENAI_PROXY_URL = process.env.EXPO_PUBLIC_OPENAI_PROXY_URL || "";

export class OpenAIProxyError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function isOpenAIProxyConfigured(): boolean {
  return OPENAI_PROXY_URL.length > 0;
}

export async function requestOpenAIProxy<T>(
  body: Record<string, unknown>,
): Promise<T> {
  if (!OPENAI_PROXY_URL) {
    throw new OpenAIProxyError(
      503,
      "not_configured",
      "AI service is not configured.",
    );
  }

  const user = authService.getCurrentUser();
  if (!user) {
    throw new OpenAIProxyError(
      401,
      "unauthenticated",
      "Please sign in to use AI features.",
    );
  }

  const idToken = await user.getIdToken();
  const response = await fetch(OPENAI_PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  let responseBody: { error?: string; message?: string } & T;
  try {
    responseBody = await response.json();
  } catch {
    throw new OpenAIProxyError(
      response.status,
      "invalid_response",
      "AI service returned an invalid response.",
    );
  }

  if (!response.ok) {
    throw new OpenAIProxyError(
      response.status,
      responseBody.error || "proxy_error",
      responseBody.message || "AI service unavailable.",
    );
  }

  return responseBody;
}
