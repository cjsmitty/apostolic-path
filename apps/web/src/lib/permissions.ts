/**
 * Frontend Permission System
 *
 * Provides hooks and utilities for checking permissions in the frontend.
 * Re-exports shared permission logic for client-side use.
 */

import type { Permission, UserRole } from '@apostolic-path/shared';
import {
    canAccessNavItem,
    canAssignRole,
    hasAllPermissions,
    hasAnyPermission,
    hasPermission,
    isAdmin,
    isLeader,
    isManager,
    isPlatformAdmin,
    isRoleAtLeast,
    ROLE_HIERARCHY,
    ROLE_PERMISSIONS,
    type NavItem,
} from '@apostolic-path/shared';
import { useAuthStore } from './auth';

// Re-export all permission utilities for convenience
export {
    canAccessNavItem, canAssignRole, hasAllPermissions, hasAnyPermission, hasPermission, isAdmin, isLeader, isManager, isPlatformAdmin, isRoleAtLeast, ROLE_HIERARCHY, ROLE_PERMISSIONS, type NavItem
};

/**
 * Hook to get the current user's role
 */
export function useUserRole(): UserRole | null {
  const user = useAuthStore((state) => state.user);
  return (user?.role as UserRole) ?? null;
}

/**
 * Hook to check if current user has a specific permission
 */
export function useHasPermission(permission: Permission): boolean {
  const role = useUserRole();
  if (!role) return false;
  return hasPermission(role, permission);
}

/**
 * Hook to check if current user has any of the specified permissions
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const role = useUserRole();
  if (!role) return false;
  return hasAnyPermission(role, permissions);
}

/**
 * Hook to check if current user has all of the specified permissions
 */
export function useHasAllPermissions(permissions: Permission[]): boolean {
  const role = useUserRole();
  if (!role) return false;
  return hasAllPermissions(role, permissions);
}

/**
 * Hook to check if current user is a platform admin (super admin)
 */
export function useIsPlatformAdmin(): boolean {
  const role = useUserRole();
  if (!role) return false;
  return isPlatformAdmin(role);
}

/**
 * Hook to check if current user is an admin (church admin or platform admin)
 */
export function useIsAdmin(): boolean {
  const role = useUserRole();
  if (!role) return false;
  return isAdmin(role);
}

/**
 * Hook to check if current user is a manager (pastor or above)
 */
export function useIsManager(): boolean {
  const role = useUserRole();
  if (!role) return false;
  return isManager(role);
}

/**
 * Hook to check if current user is a leader (teacher or above)
 */
export function useIsLeader(): boolean {
  const role = useUserRole();
  if (!role) return false;
  return isLeader(role);
}

/**
 * Hook to check if current user's role is at least the specified role
 */
export function useIsRoleAtLeast(role: UserRole): boolean {
  const userRole = useUserRole();
  if (!userRole) return false;
  return isRoleAtLeast(userRole, role);
}

/**
 * Hook to check if current user can assign a specific role
 */
export function useCanAssignRole(targetRole: UserRole): boolean {
  const role = useUserRole();
  if (!role) return false;
  return canAssignRole(role, targetRole);
}

/**
 * Hook to check if current user can access a nav item
 */
export function useCanAccessNavItem(item: NavItem): boolean {
  const role = useUserRole();
  if (!role) return false;
  return canAccessNavItem(role, item);
}

/**
 * Hook to get all permissions for the current user
 */
export function useUserPermissions(): Permission[] {
  const role = useUserRole();
  if (!role) return [];
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Generic permission check hook - can check role, permission, or custom logic
 */
export function useCanAccess(options: {
  permission?: Permission;
  permissions?: Permission[];
  role?: UserRole;
  roles?: UserRole[];
  requireAll?: boolean;
}): boolean {
  const userRole = useUserRole();
  if (!userRole) return false;

  // Platform admin always has access
  if (isPlatformAdmin(userRole)) return true;

  // Check single role
  if (options.role && userRole !== options.role) {
    return false;
  }

  // Check multiple roles
  if (options.roles && options.roles.length > 0) {
    if (!options.roles.includes(userRole)) {
      return false;
    }
  }

  // Check single permission
  if (options.permission) {
    if (!hasPermission(userRole, options.permission)) {
      return false;
    }
  }

  // Check multiple permissions
  if (options.permissions && options.permissions.length > 0) {
    if (options.requireAll) {
      if (!hasAllPermissions(userRole, options.permissions)) {
        return false;
      }
    } else {
      if (!hasAnyPermission(userRole, options.permissions)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Role display names for UI
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  platform_admin: 'System Administrator',
  admin: 'Church Administrator',
  pastor: 'Pastor',
  teacher: 'Teacher',
  member: 'Member',
  student: 'Student',
};

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: UserRole): string {
  return ROLE_DISPLAY_NAMES[role] ?? role;
}

/**
 * Role badge colors for UI
 */
export const ROLE_COLORS: Record<UserRole, string> = {
  platform_admin: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  pastor: 'bg-green-100 text-green-800',
  teacher: 'bg-yellow-100 text-yellow-800',
  member: 'bg-gray-100 text-gray-800',
  student: 'bg-orange-100 text-orange-800',
};

/**
 * Get badge color for a role
 */
export function getRoleBadgeColor(role: UserRole): string {
  return ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-800';
}
