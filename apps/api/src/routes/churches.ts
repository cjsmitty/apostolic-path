import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ChurchService } from '../services/church.service.js';
import { zodToJsonSchema } from '../utils/zod-to-json.js';

const createChurchSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string().default('USA'),
  }),
  pastorName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
});

const updateChurchSchema = createChurchSchema.partial();

export const churchRoutes = async (app: FastifyInstance) => {
  const churchService = new ChurchService();

  // Get current church (from auth context)
  app.get('/me', {
    schema: {
      description: 'Get current church details',
      tags: ['Churches'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object', additionalProperties: true },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'object', additionalProperties: true },
          },
        },
      },
    },
    preHandler: [app.authenticate],
    handler: async (request, reply) => {
      const { churchId } = request.user;
      
      console.log('=== GET /churches/me ===');
      console.log('churchId from request.user:', churchId);
      
      // Get raw item from DynamoDB directly
      const { docClient, Keys, TABLE_NAMES } = await import('@apostolic-path/database');
      const { GetCommand } = await import('@aws-sdk/lib-dynamodb');
      
      const key = Keys.church(churchId);
      console.log('DynamoDB Key:', JSON.stringify(key));
      console.log('Table:', TABLE_NAMES.MAIN);
      
      const result = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAMES.MAIN,
          Key: key,
        })
      );

      console.log('DynamoDB Result.Item:', JSON.stringify(result.Item, null, 2));

      if (!result.Item || !result.Item.id) {
        console.log('No item found or no id - returning 404');
        reply.code(404);
        return reply.send({
          success: false,
          error: { 
            code: 'CHURCH_NOT_FOUND', 
            message: `Church not found for ID: ${churchId}`,
            debug: { key: Keys.church(churchId), hasItem: !!result.Item }
          },
        });
      }

      // Return the raw item - skip mapToChurch for now
      return { 
        success: true, 
        data: {
          id: result.Item.id,
          name: result.Item.name,
          slug: result.Item.slug,
          address: result.Item.address,
          pastorId: result.Item.pastorId,
          pastorName: result.Item.pastorName,
          phone: result.Item.phone,
          email: result.Item.email,
          settings: result.Item.settings,
          subscription: result.Item.subscription,
          createdAt: result.Item.createdAt,
          updatedAt: result.Item.updatedAt,
        }
      };
    },
  });

  // Update current church
  app.patch('/me', {
    schema: {
      description: 'Update current church details',
      tags: ['Churches'],
      security: [{ bearerAuth: [] }],
      body: zodToJsonSchema(updateChurchSchema),
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('church:manage-settings')],
    handler: async (request, reply) => {
      const { churchId } = request.user;
      const data = updateChurchSchema.parse(request.body);
      const church = await churchService.update(churchId, data);

      return { success: true, data: church };
    },
  });

  // Get church statistics
  app.get('/me/stats', {
    schema: {
      description: 'Get church discipleship statistics',
      tags: ['Churches'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalStudents: { type: 'number' },
                activeStudies: { type: 'number' },
                completedJourneys: { type: 'number' },
                baptismsThisMonth: { type: 'number' },
                holyGhostThisMonth: { type: 'number' },
              },
            },
          },
        },
      },
    },
    preHandler: [app.authenticate],
    handler: async (request, reply) => {
      const { churchId } = request.user;
      const stats = await churchService.getStats(churchId);

      return { success: true, data: stats };
    },
  });
};
