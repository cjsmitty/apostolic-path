'use client';

import { ManagerDashboard } from '@/components/dashboard/manager-dashboard';
import { StudentDashboard } from '@/components/dashboard/student-dashboard';
import { TeacherDashboard } from '@/components/dashboard/teacher-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserRole } from '@/hooks/use-permissions';

/**
 * Main Dashboard Page
 * Renders different dashboard views based on user role
 */
export default function DashboardPage() {
  const userRole = useUserRole();

  // Loading state while role is being determined
  if (!userRole) {
    return <DashboardSkeleton />;
  }

  // Render role-specific dashboard
  switch (userRole) {
    case 'student':
      return <StudentDashboard />;
    
    case 'member':
      // Members see a simplified view similar to students
      return <StudentDashboard />;
    
    case 'teacher':
      return <TeacherDashboard />;
    
    case 'pastor':
    case 'admin':
    case 'platform_admin':
      // Pastors and admins see the full manager dashboard
      return <ManagerDashboard />;
    
    default:
      // Fallback to manager dashboard for unknown roles
      return <ManagerDashboard />;
  }
}

/**
 * Dashboard loading skeleton
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 rounded-lg border bg-card">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 p-6 rounded-lg border bg-card">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-6" />
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        </div>
        <div className="col-span-3 p-6 rounded-lg border bg-card">
          <Skeleton className="h-6 w-36 mb-2" />
          <Skeleton className="h-4 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
