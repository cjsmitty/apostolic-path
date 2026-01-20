'use client';

import { PlatformAdminOnly } from '@/components/auth/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart3,
    Building2,
    ChevronRight,
    Church,
    GraduationCap,
    Plus,
    Settings,
    Shield,
    TrendingUp,
    Users,
} from 'lucide-react';
import Link from 'next/link';

interface SystemStats {
  totalChurches: number;
  totalUsers: number;
  totalStudents: number;
  totalStudies: number;
  activeChurches: number;
  newChurchesThisMonth: number;
}

export default function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user);
  
  // Fetch system-wide stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      // In a real implementation, this would call an admin API endpoint
      // For now, return mock data
      return {
        totalChurches: 12,
        totalUsers: 487,
        totalStudents: 234,
        totalStudies: 89,
        activeChurches: 10,
        newChurchesThisMonth: 2,
      } as SystemStats;
    },
  });

  // Fetch recent churches
  const { data: recentChurches, isLoading: churchesLoading } = useQuery({
    queryKey: ['admin', 'churches', 'recent'],
    queryFn: async () => {
      // Mock data - in real implementation, call API
      return [
        { id: '1', name: 'First Apostolic Church', city: 'Dallas', state: 'TX', users: 45 },
        { id: '2', name: 'New Life UPC', city: 'Houston', state: 'TX', users: 32 },
        { id: '3', name: 'Truth Tabernacle', city: 'Austin', state: 'TX', users: 28 },
        { id: '4', name: 'Pentecostal Church of God', city: 'San Antonio', state: 'TX', users: 21 },
      ];
    },
  });

  return (
    <PlatformAdminOnly showAccessDenied>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-purple-50 dark:bg-purple-900/20">
          <div className="container py-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-600">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">System Administration</h1>
                <p className="text-muted-foreground">
                  Welcome, {user?.firstName}. You have full system access.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8 space-y-8">
          {/* Quick Actions */}
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/admin/churches/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Church
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/churches">
                <Building2 className="h-4 w-4 mr-2" />
                View All Churches
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Churches</CardTitle>
                <Building2 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.totalChurches}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats?.activeChurches} active
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      Across all churches
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <GraduationCap className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.totalStudents}</div>
                    <p className="text-xs text-muted-foreground">
                      In discipleship programs
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bible Studies</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.totalStudies}</div>
                    <p className="text-xs text-muted-foreground">
                      Active studies
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Churches */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Churches</CardTitle>
                <CardDescription>Recently active churches on the platform</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/churches">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {churchesLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentChurches?.map((church) => (
                    <Link
                      key={church.id}
                      href={`/admin/churches/${church.id}`}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Church className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{church.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {church.city}, {church.state}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {church.users} users
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Health */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Growth This Month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">New Churches</span>
                    <span className="font-bold text-green-600">+{stats?.newChurchesThisMonth ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">New Users</span>
                    <span className="font-bold text-green-600">+47</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">New Students</span>
                    <span className="font-bold text-green-600">+23</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <Link
                    href="/admin/churches"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <Building2 className="h-5 w-5 text-purple-600" />
                    <span>Manage All Churches</span>
                  </Link>
                  <Link
                    href="/admin/users"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <Users className="h-5 w-5 text-purple-600" />
                    <span>System Users</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <span>Back to Dashboard</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PlatformAdminOnly>
  );
}
