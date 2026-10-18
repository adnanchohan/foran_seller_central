import type { ErrorRequestHandler, RequestHandler } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../lib/AppError.js';

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new AppError(404, `Route not found: ${request.method} ${request.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(422).json({
      error: {
        message: 'Validation failed.',
        details: error.flatten(),
      },
    });
    return;
  }

  if (error instanceof MulterError) {
    response.status(422).json({ error: { message: error.message } });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      error: { message: error.message, details: error.details },
    });
    return;
  }

  console.error(error);
  response.status(500).json({ error: { message: 'An unexpected server error occurred.' } });
};
