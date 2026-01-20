/**
 * Permission Hooks
 *
 * React hooks for permission and role checks in components.
 */

'use client';

export {
    ROLE_COLORS, ROLE_DISPLAY_NAMES, getRoleBadgeColor, getRoleDisplayName, useCanAccess, useCanAccessNavItem, useCanAssignRole, useHasAllPermissions, useHasAnyPermission, useHasPermission, useIsAdmin, useIsLeader, useIsManager, useIsPlatformAdmin, useIsRoleAtLeast, useUserPermissions, useUserRole
} from '../lib/permissions';

