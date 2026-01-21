'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    getRoleBadgeColor,
    getRoleDisplayName,
    useIsPlatformAdmin,
    useUserRole,
} from '@/hooks/use-permissions';
import { useAuthStore } from '@/lib/auth';
import { cn } from '@/lib/utils';
import type { UserRole } from '@apostolic-path/shared';
import { useQueryClient } from '@tanstack/react-query';
import {
    BarChart3,
    BookOpen,
    Building2,
    ChevronLeft,
    ChevronRight,
    Footprints,
    GraduationCap,
    LayoutDashboard,
    LogOut,
    Settings,
    Shield,
    TrendingUp,
    User,
    Users,
    type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  // Only show for these roles (empty = all)
  showForRoles?: UserRole[];
  // Hide from these roles
  hideForRoles?: UserRole[];
}

/**
 * Navigation configuration with role-based visibility
 */
const navigationConfig: NavItem[] = [
  // Dashboard - visible to all
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  
  // Student self-service - students only
  { 
    name: 'My Progress', 
    href: '/dashboard/my-progress', 
    icon: TrendingUp,
    showForRoles: ['student'],
  },
  { 
    name: 'My Studies', 
    href: '/dashboard/my-studies', 
    icon: BookOpen,
    showForRoles: ['student'],
  },
  
  // Teacher and above - Students management
  { 
    name: 'Students', 
    href: '/dashboard/students', 
    icon: GraduationCap,
    hideForRoles: ['student', 'member'],
  },
  
  // Teacher and above - Studies management
  { 
    name: 'Bible Studies', 
    href: '/dashboard/studies', 
    icon: BookOpen,
    hideForRoles: ['student', 'member'],
  },
  
  // Pastor and above - First Steps tracking
  { 
    name: 'First Steps', 
    href: '/dashboard/first-steps', 
    icon: Footprints,
    showForRoles: ['pastor', 'admin', 'platform_admin'],
  },
  
  // Pastor and above - Member management
  { 
    name: 'Members', 
    href: '/dashboard/members', 
    icon: Users,
    showForRoles: ['pastor', 'admin', 'platform_admin'],
  },
  
  // Pastor and above - Reports
  { 
    name: 'Reports', 
    href: '/dashboard/reports', 
    icon: BarChart3,
    showForRoles: ['pastor', 'admin', 'platform_admin'],
  },
];

const settingsNavigation: NavItem[] = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

/**
 * Platform admin navigation - only for super admins
 */
const adminNavigation: NavItem[] = [
  { 
    name: 'System Admin', 
    href: '/admin', 
    icon: Shield,
    showForRoles: ['platform_admin'],
  },
  { 
    name: 'All Churches', 
    href: '/admin/churches', 
    icon: Building2,
    showForRoles: ['platform_admin'],
  },
];

/**
 * Check if a nav item should be shown for a role
 */
function shouldShowNavItem(item: NavItem, role: UserRole | null): boolean {
  if (!role) return false;
  
  // If showForRoles is defined, user must have one of those roles
  if (item.showForRoles && item.showForRoles.length > 0) {
    return item.showForRoles.includes(role);
  }
  
  // If hideForRoles is defined, user must NOT have one of those roles
  if (item.hideForRoles && item.hideForRoles.length > 0) {
    return !item.hideForRoles.includes(role);
  }
  
  // Default: show to all
  return true;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  
  const userRole = useUserRole();
  const isPlatformAdmin = useIsPlatformAdmin();

  const handleLogout = () => {
    // Clear all cached queries to prevent stale data for next user
    queryClient.clear();
    logout();
    router.push('/login');
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  // Filter navigation based on user role
  const visibleNavigation = useMemo(() => {
    return navigationConfig.filter((item) => shouldShowNavItem(item, userRole));
  }, [userRole]);

  const visibleAdminNavigation = useMemo(() => {
    return adminNavigation.filter((item) => shouldShowNavItem(item, userRole));
  }, [userRole]);

  return (
    <div
      className={cn(
        'flex flex-col h-screen bg-card border-r transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="p-1.5 bg-primary rounded-lg shrink-0">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-primary">Apostolic Path</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {visibleNavigation.map((item) => {
            // For /dashboard, only match exact path to avoid highlighting when on child routes
            const isActive = item.href === '/dashboard' 
              ? pathname === '/dashboard'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Admin Section - Only for platform admins */}
        {visibleAdminNavigation.length > 0 && (
          <div className="mt-8">
            {!collapsed && (
              <h3 className="px-5 text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                System Admin
              </h3>
            )}
            <ul className="space-y-1 px-2">
              {visibleAdminNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-purple-600 text-white'
                          : 'text-purple-600 hover:bg-purple-100 hover:text-purple-700'
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Settings Section */}
        <div className="mt-8">
          {!collapsed && (
            <h3 className="px-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Settings
            </h3>
          )}
          <ul className="space-y-1 px-2">
            {settingsNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                    title={collapsed ? item.name : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Collapse Toggle */}
      <div className="px-2 py-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>

      {/* User Menu */}
      <div className="p-2 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 px-2',
                collapsed && 'justify-center px-0'
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col items-start text-left overflow-hidden">
                  <span className="text-sm font-medium truncate w-full">
                    {user?.firstName} {user?.lastName}
                  </span>
                  {userRole && (
                    <Badge 
                      variant="secondary" 
                      className={cn('text-xs mt-0.5', getRoleBadgeColor(userRole))}
                    >
                      {getRoleDisplayName(userRole)}
                    </Badge>
                  )}
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.firstName} {user?.lastName}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            {isPlatformAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="text-purple-600">
                    <Shield className="mr-2 h-4 w-4" />
                    System Admin
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
