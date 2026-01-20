import type { FastifyInstance } from 'fastify';

export const healthRoutes = async (app: FastifyInstance) => {
  app.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            version: { type: 'string' },
          },
        },
      },
    },
    handler: async () => ({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    }),
  });
};
