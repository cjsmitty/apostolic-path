import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { ZodError } from 'zod';

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const errorHandler = fp(async (app: FastifyInstance) => {
  app.setErrorHandler(
    (error: FastifyError | ZodError | Error, request: FastifyRequest, reply: FastifyReply) => {
      const response: ApiError = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      };

      // Handle Zod validation errors
      if (error instanceof ZodError) {
        response.error = {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        };
        return reply.status(400).send(response);
      }

      // Handle Fastify errors
      if ('statusCode' in error && error.statusCode) {
        response.error = {
          code: error.code || 'REQUEST_ERROR',
          message: error.message,
        };
        return reply.status(error.statusCode).send(response);
      }

      // Log unexpected errors
      request.log.error(error, 'Unhandled error');

      // Don't expose internal error details in production
      if (process.env.NODE_ENV === 'development') {
        response.error.details = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      }

      return reply.status(500).send(response);
    }
  );
});
