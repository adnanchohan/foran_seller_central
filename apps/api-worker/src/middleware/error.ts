import type { ErrorHandler } from "hono";
import { ZodError } from "zod";
import { ApiError } from "../http/api-error.js";
import { formatErrorPayload } from "../http/response.js";
import type { AppEnv } from "../types.js";

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const requestId = c.get("requestId") || crypto.randomUUID();

  if (err instanceof ApiError) {
    return c.json(formatErrorPayload(err.code, err.message, requestId, err.details), err.status);
  }

  if (err instanceof ZodError) {
    return c.json(
      formatErrorPayload("VALIDATION_ERROR", "Request validation failed", requestId, err.flatten()),
      400,
    );
  }

  console.error(`[Unhandled Error] ${requestId}:`, err);
  return c.json(
    formatErrorPayload("INTERNAL_SERVER_ERROR", "An unexpected server error occurred", requestId),
    500,
  );
};
