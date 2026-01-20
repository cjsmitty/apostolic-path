'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    useIsAdmin,
    useIsManager,
    useIsPlatformAdmin,
    useUserRole,
} from '@/hooks/use-permissions';
import type { LucideIcon } from 'lucide-react';
import {
    Bell,
    Building2,
    Globe,
    Key,
    Palette,
    Shield,
    Users,
} from 'lucide-react';
import Link from 'next/link';

interface SettingsItem {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  managerOnly?: boolean;
  platformAdminOnly?: boolean;
}

const settingsItems: SettingsItem[] = [
  {
    title: 'Church Settings',
    description: 'Manage church information, address, and preferences',
    href: '/dashboard/settings/church',
    icon: Building2,
    adminOnly: true,
  },
  {
    title: 'User Management',
    description: 'Add, edit, and manage users and their roles',
    href: '/dashboard/settings/users',
    icon: Users,
    managerOnly: true,
  },
  {
    title: 'Role Management',
    description: 'Configure roles and permissions for your church',
    href: '/dashboard/settings/roles',
    icon: Shield,
    adminOnly: true,
  },
  {
    title: 'Notifications',
    description: 'Configure email and notification preferences',
    href: '/dashboard/settings/notifications',
    icon: Bell,
  },
  {
    title: 'Appearance',
    description: 'Customize the look and feel of your dashboard',
    href: '/dashboard/settings/appearance',
    icon: Palette,
  },
  {
    title: 'Security',
    description: 'Manage password and account security settings',
    href: '/dashboard/settings/security',
    icon: Key,
  },
];

export default function SettingsPage() {
  const userRole = useUserRole();
  const isAdmin = useIsAdmin();
  const isManager = useIsManager();
  const isPlatformAdmin = useIsPlatformAdmin();

  // Filter settings based on user role
  const visibleSettings = settingsItems.filter((item) => {
    if (item.platformAdminOnly && !isPlatformAdmin) return false;
    if (item.adminOnly && !isAdmin) return false;
    if (item.managerOnly && !isManager) return false;
    return true;
  });

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and church settings.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {visibleSettings.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Platform Admin Section */}
      {isPlatformAdmin && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-purple-600">
            <Shield className="h-5 w-5" />
            System Administration
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/admin">
              <Card className="h-full hover:bg-purple-50 dark:hover:bg-purple-900/20 border-purple-200 dark:border-purple-800 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <Globe className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-purple-700 dark:text-purple-300">
                        System Admin Panel
                      </CardTitle>
                      <CardDescription>
                        Manage all churches and system-wide settings
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
            <Link href="/admin/churches">
              <Card className="h-full hover:bg-purple-50 dark:hover:bg-purple-900/20 border-purple-200 dark:border-purple-800 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <Building2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-purple-700 dark:text-purple-300">
                        All Churches
                      </CardTitle>
                      <CardDescription>
                        View and manage all registered churches
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
