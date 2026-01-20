/**
 * RBAC Permission System
 *
 * Defines all permissions in the system and which roles have access to them.
 * This is the single source of truth for authorization logic.
 */

import type { UserRole } from '../types/user.js';

/**
 * All available permissions in the system
 */
export const PERMISSIONS = {
  // System Administration
  'system:access': 'Access system admin panel',
  'system:manage-churches': 'Create, update, delete any church',
  'system:view-all-data': 'View data across all churches',
  'system:manage-subscriptions': 'Manage church subscriptions',

  // Church Management
  'church:create': 'Create new churches',
  'church:read': 'View church details',
  'church:update': 'Update church settings',
  'church:delete': 'Delete church',
  'church:manage-settings': 'Manage church settings and preferences',

  // User Management
  'user:list': 'List users in church',
  'user:read': 'View user details',
  'user:create': 'Create new users',
  'user:update': 'Update user details',
  'user:delete': 'Delete/deactivate users',
  'user:assign-role': 'Change user roles',
  'user:manage-self': 'Update own profile',

  // Student Management
  'student:list': 'List students',
  'student:list-own': 'List only assigned students',
  'student:read': 'View student details',
  'student:read-self': 'View own student record',
  'student:create': 'Create student records',
  'student:update': 'Update student records',
  'student:update-self': 'Update own student record',
  'student:delete': 'Delete student records',
  'student:assign-teacher': 'Assign teachers to students',
  'student:update-milestones': 'Update New Birth milestones',

  // Bible Study Management
  'study:list': 'List all studies',
  'study:list-own': 'List only own studies',
  'study:read': 'View study details',
  'study:create': 'Create new studies',
  'study:update': 'Update studies',
  'study:update-own': 'Update own studies only',
  'study:delete': 'Delete studies',
  'study:assign-students': 'Add/remove students from studies',

  // First Steps Management
  'firststeps:view': 'View First Steps progress',
  'firststeps:update': 'Update First Steps progress',

  // Reports & Analytics
  'reports:view-church': 'View church-wide reports',
  'reports:view-own': 'View own progress reports',
  'reports:export': 'Export report data',

  // Member Management
  'member:list': 'List church members',
  'member:manage': 'Manage church members',
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Role hierarchy - higher index = more permissions
 * Used for inheritance checking
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  student: 0,
  member: 1,
  teacher: 2,
  pastor: 3,
  admin: 4,
  platform_admin: 5,
};

/**
 * Permission matrix - maps roles to their permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // Platform Admin - Full system access
  platform_admin: [
    'system:access',
    'system:manage-churches',
    'system:view-all-data',
    'system:manage-subscriptions',
    'church:create',
    'church:read',
    'church:update',
    'church:delete',
    'church:manage-settings',
    'user:list',
    'user:read',
    'user:create',
    'user:update',
    'user:delete',
    'user:assign-role',
    'user:manage-self',
    'student:list',
    'student:read',
    'student:create',
    'student:update',
    'student:delete',
    'student:assign-teacher',
    'student:update-milestones',
    'study:list',
    'study:read',
    'study:create',
    'study:update',
    'study:delete',
    'study:assign-students',
    'firststeps:view',
    'firststeps:update',
    'reports:view-church',
    'reports:export',
    'member:list',
    'member:manage',
  ],

  // Admin - Full church access
  admin: [
    'church:read',
    'church:update',
    'church:manage-settings',
    'user:list',
    'user:read',
    'user:create',
    'user:update',
    'user:delete',
    'user:assign-role',
    'user:manage-self',
    'student:list',
    'student:read',
    'student:create',
    'student:update',
    'student:delete',
    'student:assign-teacher',
    'student:update-milestones',
    'study:list',
    'study:read',
    'study:create',
    'study:update',
    'study:delete',
    'study:assign-students',
    'firststeps:view',
    'firststeps:update',
    'reports:view-church',
    'reports:export',
    'member:list',
    'member:manage',
  ],

  // Pastor - View all, limited management
  pastor: [
    'church:read',
    'user:list',
    'user:read',
    'user:create',
    'user:update',
    'user:assign-role',
    'user:manage-self',
    'student:list',
    'student:read',
    'student:create',
    'student:update',
    'student:assign-teacher',
    'student:update-milestones',
    'study:list',
    'study:read',
    'study:create',
    'study:update',
    'study:assign-students',
    'firststeps:view',
    'firststeps:update',
    'reports:view-church',
    'reports:export',
    'member:list',
    'member:manage',
  ],

  // Teacher - Manage assigned students/studies
  teacher: [
    'user:manage-self',
    'student:list-own',
    'student:read',
    'student:create',
    'student:update',
    'student:update-milestones',
    'study:list-own',
    'study:read',
    'study:create',
    'study:update-own',
    'study:assign-students',
    'firststeps:view',
    'firststeps:update',
    'reports:view-own',
  ],

  // Member - Basic church access
  member: [
    'user:manage-self',
    'church:read',
    'reports:view-own',
  ],

  // Student - Self-service only
  student: [
    'user:manage-self',
    'student:read-self',
    'student:update-self',
    'study:list-own',
    'study:read',
    'firststeps:view',
    'reports:view-own',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.includes(permission) ?? false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if role A is higher than or equal to role B in hierarchy
 */
export function isRoleAtLeast(roleA: UserRole, roleB: UserRole): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}

/**
 * Check if user is a platform admin (super admin)
 */
export function isPlatformAdmin(role: UserRole): boolean {
  return role === 'platform_admin';
}

/**
 * Check if user has admin-level access (admin or platform_admin)
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'admin' || role === 'platform_admin';
}

/**
 * Check if user has management-level access (pastor, admin, or platform_admin)
 */
export function isManager(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.pastor;
}

/**
 * Check if user has leadership-level access (teacher and above)
 */
export function isLeader(role: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.teacher;
}

/**
 * Resource ownership check types
 */
export interface ResourceOwnershipCheck {
  type: 'student' | 'study' | 'user';
  resourceId: string;
  userId: string;
  teacherId?: string;
  churchId: string;
}

/**
 * Roles that can create other roles
 * Maps each role to the roles it can create/assign
 */
export const ROLE_CREATION_PERMISSIONS: Record<UserRole, UserRole[]> = {
  platform_admin: ['platform_admin', 'admin', 'pastor', 'teacher', 'member', 'student'],
  admin: ['admin', 'pastor', 'teacher', 'member', 'student'],
  pastor: ['teacher', 'member', 'student'],
  teacher: ['student'],
  member: [],
  student: [],
};

/**
 * Check if a role can assign another role
 */
export function canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
  const allowedRoles = ROLE_CREATION_PERMISSIONS[assignerRole];
  return allowedRoles?.includes(targetRole) ?? false;
}

/**
 * Navigation items with required permissions
 */
export interface NavItem {
  name: string;
  href: string;
  icon: string;
  permissions?: Permission[];
  roles?: UserRole[];
  showForRoles?: UserRole[];
  hideForRoles?: UserRole[];
}

/**
 * Check if a user can access a navigation item
 */
export function canAccessNavItem(role: UserRole, item: NavItem): boolean {
  // If specific roles are defined for showing, check them
  if (item.showForRoles && item.showForRoles.length > 0) {
    return item.showForRoles.includes(role);
  }

  // If roles to hide from are defined, check them
  if (item.hideForRoles && item.hideForRoles.length > 0) {
    return !item.hideForRoles.includes(role);
  }

  // If specific roles are required, check them
  if (item.roles && item.roles.length > 0) {
    return item.roles.includes(role);
  }

  // If permissions are required, check them
  if (item.permissions && item.permissions.length > 0) {
    return hasAnyPermission(role, item.permissions);
  }

  // Default: accessible to all
  return true;
}
