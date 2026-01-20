import type { z } from 'zod';

/**
 * Converts a Zod schema to JSON Schema for Fastify validation
 * This is a simplified version - in production use @fastify/type-provider-zod
 */
export function zodToJsonSchema(schema: z.ZodTypeAny): object {
  // This is a placeholder - in the real app, use zod-to-json-schema package
  // For now, we return a permissive schema and rely on Zod validation in handlers
  return {
    type: 'object',
    additionalProperties: true,
  };
}
