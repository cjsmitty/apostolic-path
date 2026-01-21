import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuthError, AuthService } from '../services/auth.service.js';
import { ChurchService } from '../services/church.service.js';
import { zodToJsonSchema } from '../utils/zod-to-json.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  churchId: z.string(),
  role: z.enum(['platform_admin', 'admin', 'pastor', 'teacher', 'member', 'student']).optional(),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(100),
});

const switchChurchSchema = z.object({
  churchId: z.string(),
});

export const authRoutes = async (app: FastifyInstance) => {
  const authService = new AuthService();
  const churchService = new ChurchService();

  // Register new user
  app.post('/register', {
    schema: {
      description: 'Register a new user account',
      tags: ['Auth'],
      body: zodToJsonSchema(registerSchema),
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: { type: 'object', additionalProperties: true },
                token: { type: 'string' },
                expiresIn: { type: 'string' },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'object', additionalProperties: true },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const data = registerSchema.parse(request.body);
        const result = await authService.register(data);

        return reply.status(201).send({ success: true, data: result });
      } catch (error) {
        if (error instanceof AuthError) {
          reply.code(400);
          return reply.send({
            success: false,
            error: { code: error.code, message: error.message },
          });
        }
        throw error;
      }
    },
  });

  // Login
  app.post('/login', {
    schema: {
      description: 'Login with email and password',
      tags: ['Auth'],
      body: zodToJsonSchema(loginSchema),
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: { type: 'object', additionalProperties: true },
                token: { type: 'string' },
                expiresIn: { type: 'string' },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'object', additionalProperties: true },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'object', additionalProperties: true },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const data = loginSchema.parse(request.body);
        const result = await authService.login(data);

        return { success: true, data: result };
      } catch (error) {
        if (error instanceof AuthError) {
          const status = error.code === 'INVALID_CREDENTIALS' ? 401 : 400;
          reply.code(status);
          return reply.send({
            success: false,
            error: { code: error.code, message: error.message },
          });
        }
        throw error;
      }
    },
  });

  // Get current user (protected route)
  app.get('/me', {
    schema: {
      description: 'Get current authenticated user',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate],
    handler: async (request, reply) => {
      const { email, churchId } = request.user;
      // Use email lookup since user may be accessing from a different church context
      // (e.g., platform admin switched to a specific church)
      const user = await authService.getUserByEmail(email);

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        });
      }

      // Return the user with the current church context
      return { success: true, data: { ...user, currentChurchId: churchId } };
    },
  });

  // Change password (protected route)
  app.post('/change-password', {
    schema: {
      description: 'Change user password',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      body: zodToJsonSchema(changePasswordSchema),
    },
    preHandler: [app.authenticate],
    handler: async (request, reply) => {
      try {
        const { userId, churchId } = request.user;
        const data = changePasswordSchema.parse(request.body);

        await authService.changePassword(
          userId,
          churchId,
          data.currentPassword,
          data.newPassword
        );

        return { success: true, message: 'Password changed successfully' };
      } catch (error) {
        if (error instanceof AuthError) {
          return reply.code(400).send({
            success: false,
            error: { code: error.code, message: error.message },
          });
        }
        throw error;
      }
    },
  });

  // Verify token (utility endpoint)
  app.get('/verify', {
    schema: {
      description: 'Verify if the current token is valid',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate],
    handler: async (request, reply) => {
      return {
        success: true,
        data: {
          valid: true,
          user: request.user,
        },
      };
    },
  });

  // Get all churches the current user has access to
  app.get('/me/churches', {
    schema: {
      description: 'Get all churches the current user can access',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object', additionalProperties: true } },
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
      const { email } = request.user;
      // Use email lookup since user may be in a different church context
      const user = await authService.getUserByEmail(email);

      if (!user) {
        reply.code(404);
        return reply.send({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        });
      }

      // Platform admins can access all churches
      if (user.role === 'platform_admin') {
        const churches = await churchService.listAll();
        return { success: true, data: churches };
      }

      // Get all churches the user has access to
      const churchIds = user.churchIds || [user.churchId];
      const churches = await Promise.all(
        churchIds.map(id => churchService.getById(id))
      );

      return { success: true, data: churches.filter(Boolean) };
    },
  });

  // Switch to a different church context
  app.post('/switch-church', {
    schema: {
      description: 'Switch to a different church context',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      body: zodToJsonSchema(switchChurchSchema),
    },
    preHandler: [app.authenticate],
    handler: async (request, reply) => {
      const { email } = request.user;
      const { churchId: targetChurchId } = switchChurchSchema.parse(request.body);

      // Use email lookup since user may be in a different church context
      const user = await authService.getUserByEmail(email);
      if (!user) {
        return reply.code(404).send({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        });
      }

      // Check if user has access to target church
      const allowedChurchIds = user.role === 'platform_admin'
        ? null // Platform admins can access any church
        : (user.churchIds || [user.churchId]);

      if (allowedChurchIds && !allowedChurchIds.includes(targetChurchId)) {
        return reply.code(403).send({
          success: false,
          error: { code: 'ACCESS_DENIED', message: 'You do not have access to this church' },
        });
      }

      // Generate a new token with the new church context
      const newToken = authService.generateToken(user.id, targetChurchId, user.role, user.email);

      return { success: true, data: { token: newToken } };
    },
  });
};
