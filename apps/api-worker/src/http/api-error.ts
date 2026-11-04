import type { ContentfulStatusCode } from "hono/utils/http-status";

export interface ApiErrorOptions {
  code: string;
  message: string;
  status: ContentfulStatusCode;
  details?: unknown;
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: ContentfulStatusCode;
  public readonly details?: unknown;

  constructor(options: ApiErrorOptions) {
    super(options.message);
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}
