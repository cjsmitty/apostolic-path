import type { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

// Symbol for storing mutable church context on request
const kChurchContext = Symbol('churchContext');

interface ChurchContext {
  churchId: string;
  churchName?: string;
  subscription?: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    [kChurchContext]: ChurchContext;
    churchContext: ChurchContext;
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
  // Use symbol-based storage for the mutable value
  app.decorateRequest(kChurchContext, null);
  
  // Use getter/setter pattern for the public property
  app.decorateRequest('churchContext', {
    getter(this: FastifyRequest) {
      return this[kChurchContext] ?? {
        churchId: '',
        churchName: undefined,
        subscription: undefined,
      };
    },
    setter(this: FastifyRequest, value: ChurchContext) {
      this[kChurchContext] = value;
    },
  });

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
