import type { UserRole } from '@apostolic-path/shared';
import { canAssignRole } from '@apostolic-path/shared';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { UserService } from '../services/user.service.js';
import { zodToJsonSchema } from '../utils/zod-to-json.js';

const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  phone: z.string().optional(),
  role: z.enum(['admin', 'pastor', 'teacher', 'member', 'student']),
});

const updateUserSchema = createUserSchema.partial().omit({ email: true });

export const userRoutes = async (app: FastifyInstance) => {
  const userService = new UserService();

  // Get current user profile
  app.get('/me', {
    schema: {
      description: 'Get current user profile',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate],
    handler: async (request, reply) => {
      const userId = request.user.userId;
      const user = await userService.getById(userId);

      return { success: true, data: user };
    },
  });

  // List all users in church
  app.get('/', {
    schema: {
      description: 'List all users in church',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          role: { type: 'string' },
          limit: { type: 'number', default: 50 },
          cursor: { type: 'string' },
        },
      },
    },
    preHandler: [app.authenticate, app.requirePermission('user:list')],
    handler: async (request, reply) => {
      const churchId = request.churchContext.churchId;
      const { role, limit, cursor } = request.query as {
        role?: string;
        limit?: number;
        cursor?: string;
      };

      const result = await userService.listByChurch(churchId, { role, limit, cursor });

      return { success: true, data: result.items, nextCursor: result.nextCursor };
    },
  });

  // Create new user
  app.post('/', {
    schema: {
      description: 'Create a new user',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      body: zodToJsonSchema(createUserSchema),
    },
    preHandler: [app.authenticate, app.requirePermission('user:create')],
    handler: async (request, reply) => {
      const churchId = request.churchContext.churchId;
      const currentUserRole = request.user.role as UserRole;
      const data = createUserSchema.parse(request.body);

      // Check if current user can assign the requested role
      if (!canAssignRole(currentUserRole, data.role as UserRole)) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `You cannot assign the role "${data.role}". Your role does not have sufficient permissions.`,
          },
        });
      }

      const user = await userService.create({ ...data, churchId, isActive: true });

      return reply.status(201).send({ success: true, data: user });
    },
  });

  // Get user by ID
  app.get('/:id', {
    schema: {
      description: 'Get user by ID',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
    preHandler: [app.authenticate],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const churchId = request.churchContext.churchId;

      const user = await userService.getById(id);

      if (!user || user.churchId !== churchId) {
        return reply.status(404).send({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        });
      }

      return { success: true, data: user };
    },
  });

  // Update user
  app.patch('/:id', {
    schema: {
      description: 'Update user',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: zodToJsonSchema(updateUserSchema),
    },
    preHandler: [app.authenticate, app.requirePermission('user:update')],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const churchId = request.churchContext.churchId;
      const currentUserRole = request.user.role as UserRole;
      const data = updateUserSchema.parse(request.body);

      // If role is being updated, check if current user can assign the new role
      if (data.role && !canAssignRole(currentUserRole, data.role as UserRole)) {
        return reply.status(403).send({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `You cannot assign the role "${data.role}". Your role does not have sufficient permissions.`,
          },
        });
      }

      const user = await userService.update(id, churchId, data);

      return { success: true, data: user };
    },
  });
};
