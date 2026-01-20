/**
 * Permissions Middleware Plugin
 *
 * Provides fine-grained authorization checks based on the RBAC system.
 * Handles resource ownership, scoped access, and permission checks.
 */

import type { Permission, UserRole } from '@apostolic-path/shared';
import {
    hasPermission,
    isLeader,
    isManager,
    isPlatformAdmin,
    ROLE_HIERARCHY,
} from '@apostolic-path/shared';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyRequest {
    // Resource ownership context (set by route handlers)
    resourceContext?: {
      ownerId?: string;
      teacherId?: string;
      studentId?: string;
      churchId?: string;
    };
  }

  interface FastifyInstance {
    // Check if user can access a student (considering teacher assignments)
    canAccessStudent: (
      request: FastifyRequest,
      studentId: string,
      teacherId?: string
    ) => Promise<boolean>;
    
    // Check if user can access a study (considering teacher assignments)
    canAccessStudy: (
      request: FastifyRequest,
      studyTeacherId: string
    ) => boolean;
    
    // Check if user can modify based on ownership
    canModifyResource: (
      request: FastifyRequest,
      resourceOwnerId: string,
      requiredPermission: Permission
    ) => boolean;
    
    // Middleware to require resource ownership or permission
    requireOwnershipOrPermission: (
      permission: Permission
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const permissionsPlugin = fp(async (app: FastifyInstance) => {
  /**
   * Check if user can access a student record
   * - Platform admin: always
   * - Admin/Pastor: all students in their church
   * - Teacher: only assigned students
   * - Student: only their own record
   */
  app.decorate(
    'canAccessStudent',
    async (
      request: FastifyRequest,
      studentId: string,
      teacherId?: string
    ): Promise<boolean> => {
      const userRole = request.user?.role as UserRole;
      const userId = request.user?.userId;

      // Platform admin can access all
      if (isPlatformAdmin(userRole)) {
        return true;
      }

      // Managers (pastor+) can access all students in their church
      if (isManager(userRole)) {
        return true;
      }

      // Teachers can access their assigned students
      if (userRole === 'teacher') {
        // If we know the teacher ID, check if it matches
        if (teacherId && teacherId === userId) {
          return true;
        }
        // Otherwise, the caller needs to verify assignment separately
        return teacherId === userId;
      }

      // Students can only access their own record
      if (userRole === 'student') {
        // Need to look up if this student record belongs to this user
        // This would require a database lookup - return false for now
        // The route handler should do this check
        return false;
      }

      return false;
    }
  );

  /**
   * Check if user can access a study
   * - Platform admin: always
   * - Admin/Pastor: all studies in their church
   * - Teacher: only studies they lead
   * - Student: only studies they're enrolled in
   */
  app.decorate(
    'canAccessStudy',
    (request: FastifyRequest, studyTeacherId: string): boolean => {
      const userRole = request.user?.role as UserRole;
      const userId = request.user?.userId;

      // Platform admin can access all
      if (isPlatformAdmin(userRole)) {
        return true;
      }

      // Managers can access all studies in their church
      if (isManager(userRole)) {
        return true;
      }

      // Teachers can access studies they lead
      if (userRole === 'teacher') {
        return studyTeacherId === userId;
      }

      // Students need enrollment check (done at route level)
      return false;
    }
  );

  /**
   * Check if user can modify a resource based on ownership or permission
   */
  app.decorate(
    'canModifyResource',
    (
      request: FastifyRequest,
      resourceOwnerId: string,
      requiredPermission: Permission
    ): boolean => {
      const userRole = request.user?.role as UserRole;
      const userId = request.user?.userId;

      // Platform admin can modify anything
      if (isPlatformAdmin(userRole)) {
        return true;
      }

      // Check if user has the required permission
      if (hasPermission(userRole, requiredPermission)) {
        return true;
      }

      // Check if user is the owner
      if (userId === resourceOwnerId) {
        return true;
      }

      return false;
    }
  );

  /**
   * Middleware to require resource ownership or a specific permission
   * The resource owner ID should be set in request.resourceContext.ownerId
   */
  app.decorate(
    'requireOwnershipOrPermission',
    (permission: Permission) =>
      async (request: FastifyRequest, reply: FastifyReply) => {
        const userRole = request.user?.role as UserRole;
        const userId = request.user?.userId;

        // Platform admin always passes
        if (isPlatformAdmin(userRole)) {
          return;
        }

        // Check permission
        if (hasPermission(userRole, permission)) {
          return;
        }

        // Check ownership if resource context is set
        const ownerId = request.resourceContext?.ownerId;
        if (ownerId && userId === ownerId) {
          return;
        }

        reply.status(403).send({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this resource',
          },
        });
      }
  );
});

/**
 * Helper function to filter data based on role
 * Used in service layer to scope queries
 */
export function getQueryScopeForRole(
  role: UserRole,
  userId: string,
  churchId: string
): {
  scope: 'all' | 'church' | 'assigned' | 'self';
  churchId?: string;
  userId?: string;
} {
  // Platform admin: no restrictions
  if (isPlatformAdmin(role)) {
    return { scope: 'all' };
  }

  // Managers: church-wide access
  if (isManager(role)) {
    return { scope: 'church', churchId };
  }

  // Leaders (teachers): see their assigned records
  if (isLeader(role)) {
    return { scope: 'assigned', churchId, userId };
  }

  // Everyone else: only their own records
  return { scope: 'self', churchId, userId };
}

/**
 * Helper to check if a user can perform an action on another user
 * Based on role hierarchy - can only manage users at same level or below
 */
export function canManageUser(
  actorRole: UserRole,
  targetRole: UserRole
): boolean {
  // Platform admin can manage anyone
  if (isPlatformAdmin(actorRole)) {
    return true;
  }

  // Can only manage users at same level or below
  return ROLE_HIERARCHY[actorRole] >= ROLE_HIERARCHY[targetRole];
}
