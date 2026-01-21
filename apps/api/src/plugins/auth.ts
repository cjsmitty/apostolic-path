import type { Permission, UserRole } from '@apostolic-path/shared';
import { hasPermission, isPlatformAdmin } from '@apostolic-path/shared';
import fastifyJwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { config } from '../config/index.js';

// Define the user payload type
export interface JwtPayload {
  userId: string;
  email: string;
  churchId: string;
  role: UserRole;
  churchIds?: string[]; // All churches user has access to
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (
      roles: UserRole[]
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requirePermission: (
      permissions: Permission | Permission[]
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    isPlatformAdmin: (request: FastifyRequest) => boolean;
    canAccessChurch: (request: FastifyRequest, churchId: string) => boolean;
  }
  
  interface FastifyRequest {
    isPlatformAdmin: boolean;
  }
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  // Register JWT plugin
  await app.register(fastifyJwt, {
    secret: config.jwt.secret,
  });

  // Authenticate decorator
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      
      const userRole = request.user?.role as UserRole;
      
      // Check if user is platform admin
      request.isPlatformAdmin = isPlatformAdmin(userRole);
      
      // Set church context after successful authentication
      if (request.user?.churchId) {
        request.churchContext = {
          churchId: request.user.churchId,
        };
      }
    } catch (err) {
      reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }
  });

  // Helper to check if user is platform admin
  app.decorate('isPlatformAdmin', (request: FastifyRequest): boolean => {
    return request.isPlatformAdmin ?? false;
  });

  // Helper to check if user can access a specific church
  app.decorate('canAccessChurch', (request: FastifyRequest, churchId: string): boolean => {
    // Platform admin can access any church
    if (request.isPlatformAdmin) {
      return true;
    }
    
    // Check current church context
    if (request.user?.churchId === churchId) {
      return true;
    }
    
    // Check if user has access to multiple churches
    if (request.user?.churchIds?.includes(churchId)) {
      return true;
    }
    
    return false;
  });

  // Role-based access control decorator
  app.decorate(
    'requireRole',
    (roles: UserRole[]) => async (request: FastifyRequest, reply: FastifyReply) => {
      const userRole = request.user?.role as UserRole;

      // Platform admin always passes role checks
      if (isPlatformAdmin(userRole)) {
        return;
      }

      if (!userRole || !roles.includes(userRole)) {
        reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
        });
      }
    }
  );

  // Permission-based access control decorator
  app.decorate(
    'requirePermission',
    (permissions: Permission | Permission[]) => async (request: FastifyRequest, reply: FastifyReply) => {
      const userRole = request.user?.role as UserRole;

      if (!userRole) {
        reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
        });
        return;
      }

      // Platform admin always passes permission checks
      if (isPlatformAdmin(userRole)) {
        return;
      }

      const permissionList = Array.isArray(permissions) ? permissions : [permissions];
      const hasRequiredPermission = permissionList.some((perm) => hasPermission(userRole, perm));

      if (!hasRequiredPermission) {
        reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
        });
      }
    }
  );
});
