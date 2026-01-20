import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyRequest {
    churchContext: {
      churchId: string;
      churchName?: string;
      subscription?: string;
    };
  }
}

/**
 * Church Context Plugin
 *
 * Extracts church context from the authenticated user's JWT
 * and makes it available on all requests. This enforces
 * multi-tenant data isolation.
 */
export const churchContextPlugin = fp(async (app: FastifyInstance) => {
  app.decorateRequest('churchContext', null);

  app.addHook('preHandler', async (request: FastifyRequest) => {
    // Only set church context for authenticated requests
    if (request.user?.churchId) {
      request.churchContext = {
        churchId: request.user.churchId,
        // Additional context can be loaded from cache/db if needed
      };
    }
  });
});
