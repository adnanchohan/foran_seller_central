import type { ApiErrorPayload } from "@foran/contracts";

export function formatErrorPayload(
  code: string,
  message: string,
  requestId: string,
  details?: unknown,
): ApiErrorPayload {
  return {
    error: {
      code,
      message,
      requestId,
      ...(details !== undefined ? { details } : {}),
    },
  };
}
