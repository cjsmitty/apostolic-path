'use client';

import {
    useHasAnyPermission,
    useHasPermission,
    useIsPlatformAdmin,
    useUserRole,
} from '@/hooks/use-permissions';
import { useAuthStore } from '@/lib/auth';
import type { Permission, UserRole } from '@apostolic-path/shared';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

interface RoleGuardProps {
  children: ReactNode;
  /** Required roles - user must have one of these */
  roles?: UserRole[];
  /** Required permission - user must have this */
  permission?: Permission;
  /** Required permissions - user must have at least one of these */
  permissions?: Permission[];
  /** Require all permissions instead of any */
  requireAll?: boolean;
  /** Redirect URL if access is denied (default: /dashboard) */
  redirectTo?: string;
  /** Show access denied message instead of redirecting */
  showAccessDenied?: boolean;
  /** Custom loading component */
  loadingComponent?: ReactNode;
  /** Custom access denied component */
  accessDeniedComponent?: ReactNode;
}

/**
 * RoleGuard - Protects routes/components based on user role or permissions
 *
 * Usage:
 * ```tsx
 * // Require specific roles
 * <RoleGuard roles={['admin', 'pastor']}>
 *   <AdminContent />
 * </RoleGuard>
 *
 * // Require specific permission
 * <RoleGuard permission="user:create">
 *   <CreateUserButton />
 * </RoleGuard>
 *
 * // Require any of multiple permissions
 * <RoleGuard permissions={['student:read', 'student:list']}>
 *   <StudentList />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({
  children,
  roles,
  permission,
  permissions,
  requireAll = false,
  redirectTo = '/dashboard',
  showAccessDenied = false,
  loadingComponent,
  accessDeniedComponent,
}: RoleGuardProps) {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useAuthStore();
  const userRole = useUserRole();
  const isPlatformAdmin = useIsPlatformAdmin();

  // Check if user has access
  const hasAccess = (() => {
    // Not authenticated
    if (!isAuthenticated || !userRole) {
      return false;
    }

    // Platform admin always has access
    if (isPlatformAdmin) {
      return true;
    }

    // Check roles
    if (roles && roles.length > 0) {
      if (!roles.includes(userRole)) {
        return false;
      }
    }

    // Check single permission
    if (permission) {
      const hasPermissionCheck = useHasPermission(permission);
      if (!hasPermissionCheck) {
        return false;
      }
    }

    // Check multiple permissions
    if (permissions && permissions.length > 0) {
      const hasPermissionsCheck = useHasAnyPermission(permissions);
      if (!hasPermissionsCheck) {
        return false;
      }
    }

    return true;
  })();

  // Redirect if no access
  useEffect(() => {
    if (!isLoading && !hasAccess && !showAccessDenied) {
      router.replace(redirectTo);
    }
  }, [isLoading, hasAccess, showAccessDenied, redirectTo, router]);

  // Loading state
  if (isLoading) {
    return (
      loadingComponent ?? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    );
  }

  // Access denied
  if (!hasAccess) {
    if (showAccessDenied) {
      return (
        accessDeniedComponent ?? (
          <AccessDeniedDefault />
        )
      );
    }
    // Will redirect, show loading
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Default access denied component
 */
function AccessDeniedDefault() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <ShieldAlert className="h-12 w-12 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
      <p className="text-muted-foreground max-w-md">
        You don&apos;t have permission to access this page. Please contact your
        administrator if you believe this is an error.
      </p>
    </div>
  );
}

/**
 * RequireRole - Simple role check wrapper
 */
export function RequireRole({
  children,
  role,
  roles,
  fallback,
}: {
  children: ReactNode;
  role?: UserRole;
  roles?: UserRole[];
  fallback?: ReactNode;
}) {
  const userRole = useUserRole();
  const isPlatformAdmin = useIsPlatformAdmin();

  // Platform admin always passes
  if (isPlatformAdmin) {
    return <>{children}</>;
  }

  if (!userRole) {
    return fallback ?? null;
  }

  // Check single role
  if (role && userRole !== role) {
    return fallback ?? null;
  }

  // Check multiple roles
  if (roles && roles.length > 0 && !roles.includes(userRole)) {
    return fallback ?? null;
  }

  return <>{children}</>;
}

/**
 * RequirePermission - Simple permission check wrapper
 */
export function RequirePermission({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback,
}: {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: ReactNode;
}) {
  const hasSinglePermission = useHasPermission(permission ?? ('user:manage-self' as Permission));
  const hasMultiplePermissions = useHasAnyPermission(permissions ?? []);
  const isPlatformAdmin = useIsPlatformAdmin();

  // Platform admin always passes
  if (isPlatformAdmin) {
    return <>{children}</>;
  }

  // Check single permission
  if (permission && !hasSinglePermission) {
    return fallback ?? null;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0 && !hasMultiplePermissions) {
    return fallback ?? null;
  }

  return <>{children}</>;
}

/**
 * AdminOnly - Only render for admin and platform_admin
 */
export function AdminOnly({
  children,
  fallback,
  showAccessDenied = false,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}) {
  if (showAccessDenied) {
    return (
      <RoleGuard roles={['admin', 'platform_admin']} showAccessDenied>
        {children}
      </RoleGuard>
    );
  }
  return (
    <RequireRole roles={['admin', 'platform_admin']} fallback={fallback}>
      {children}
    </RequireRole>
  );
}

/**
 * ManagerOnly - Only render for pastor, admin, platform_admin
 */
export function ManagerOnly({
  children,
  fallback,
  showAccessDenied = false,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}) {
  if (showAccessDenied) {
    return (
      <RoleGuard roles={['pastor', 'admin', 'platform_admin']} showAccessDenied>
        {children}
      </RoleGuard>
    );
  }
  return (
    <RequireRole roles={['pastor', 'admin', 'platform_admin']} fallback={fallback}>
      {children}
    </RequireRole>
  );
}

/**
 * LeaderOnly - Only render for teacher and above
 */
export function LeaderOnly({
  children,
  fallback,
  showAccessDenied = false,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}) {
  if (showAccessDenied) {
    return (
      <RoleGuard roles={['teacher', 'pastor', 'admin', 'platform_admin']} showAccessDenied>
        {children}
      </RoleGuard>
    );
  }
  return (
    <RequireRole roles={['teacher', 'pastor', 'admin', 'platform_admin']} fallback={fallback}>
      {children}
    </RequireRole>
  );
}

/**
 * PlatformAdminOnly - Only render for platform admins
 */
export function PlatformAdminOnly({
  children,
  fallback,
  showAccessDenied = false,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}) {
  if (showAccessDenied) {
    return (
      <RoleGuard roles={['platform_admin']} showAccessDenied>
        {children}
      </RoleGuard>
    );
  }
  return (
    <RequireRole role="platform_admin" fallback={fallback}>
      {children}
    </RequireRole>
  );
}
