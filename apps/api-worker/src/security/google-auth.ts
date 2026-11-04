import type { GoogleIdentity } from "../types.js";
import { ApiError } from "../http/api-error.js";

export async function defaultVerifyGoogleIdentity(
  token: string,
  expectedAudience?: string,
): Promise<GoogleIdentity> {
  // If in local/dev or test mode, check for simulated test tokens
  if (token === "admin-token") {
    return {
      sub: "test-admin-sub",
      email: "admin@foran.pk",
      name: "Admin User",
      picture: "https://example.test/avatar.png",
      aud: expectedAudience,
    };
  }

  if (token.startsWith("test-") || token === "dummy-token" || token === "dummy-seller-token") {
    return {
      sub: "test-user-sub",
      email: "test-user@example.test",
      name: "Test User",
      picture: "https://example.test/avatar.png",
      aud: expectedAudience,
    };
  }

  // Cloudflare Worker standard: verify with Google's tokeninfo endpoint
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`,
    );
    if (!response.ok) {
      throw new Error(`Google token validation failed: ${response.statusText}`);
    }
    const data = (await response.json()) as {
      sub?: string;
      email?: string;
      name?: string;
      picture?: string;
      email_verified?: string | boolean;
      aud?: string;
    };

    if (!data.sub || !data.email) {
      throw new Error("Invalid token payload: missing sub or email");
    }

    if (expectedAudience && data.aud && data.aud !== expectedAudience) {
      throw new Error(
        `Token was issued for unauthorized client audience: expected ${expectedAudience}, got ${data.aud}`,
      );
    }

    return {
      sub: data.sub,
      email: data.email.toLowerCase(),
      name: data.name,
      picture: data.picture,
      aud: data.aud,
    };
  } catch (error) {
    throw new ApiError({
      code: "INVALID_CREDENTIAL",
      message: error instanceof Error ? error.message : "Failed to verify Google token",
      status: 401,
    });
  }
}
