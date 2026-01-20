'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsAdmin } from '@/hooks/use-permissions';
import { useAuthStore } from '@/lib/auth';
import { useChurchStats, useNewBirthStats, useStudents, useStudies } from '@/lib/hooks';
import {
    BookOpen,
    Church,
    Droplets,
    Flame,
    GraduationCap,
    Settings,
    TrendingUp,
    UserCheck,
    Users
} from 'lucide-react';
import Link from 'next/link';

/**
 * Manager Dashboard View (Pastor & Admin)
 * Shows church-wide overview and management options
 */
export function ManagerDashboard() {
  const user = useAuthStore((state) => state.user);
  const church = useAuthStore((state) => state.church);
  const isAdmin = useIsAdmin();
  
  const { data: churchStats, isLoading: statsLoading } = useChurchStats();
  const { data: newBirthStats, isLoading: newBirthLoading } = useNewBirthStats();
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: studies, isLoading: studiesLoading } = useStudies();

  const isLoading = statsLoading || newBirthLoading || studentsLoading || studiesLoading;
  
  const stats = {
    totalStudents: newBirthStats?.totalStudents ?? churchStats?.totalStudents ?? 0,
    activeStudies: churchStats?.activeStudies ?? (studies?.filter((s) => s.status === 'in-progress').length ?? 0),
    awaitingBaptism: newBirthStats?.awaitingBaptism ?? 0,
    awaitingHolyGhost: newBirthStats?.awaitingHolyGhost ?? 0,
    completedNewBirth: newBirthStats?.completedNewBirth ?? 0,
    baptismsThisMonth: newBirthStats?.baptismsThisMonth ?? churchStats?.baptismsThisMonth ?? 0,
    holyGhostThisMonth: newBirthStats?.holyGhostThisMonth ?? churchStats?.holyGhostThisMonth ?? 0,
  };

  // Calculate percentages for progress bars
  const baptizedCount = stats.awaitingHolyGhost + stats.completedNewBirth;
  const holyGhostCount = stats.completedNewBirth;
  const baptismPercent = stats.totalStudents > 0 ? Math.round((baptizedCount / stats.totalStudents) * 100) : 0;
  const holyGhostPercent = stats.totalStudents > 0 ? Math.round((holyGhostCount / stats.totalStudents) * 100) : 0;

  // Get recent students for activity
  const recentStudents = students?.slice(0, 5) ?? [];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.role === 'pastor' ? 'Pastor' : ''} {user?.firstName || ''}!
          </h1>
          <p className="text-muted-foreground">
            {church?.name ? `${church.name} - ` : ''}Here&apos;s what&apos;s happening with your discipleship program.
          </p>
        </div>
        {isAdmin && (
          <Link 
            href="/dashboard/settings/church"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span className="text-sm font-medium">Church Settings</span>
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.completedNewBirth} born again
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Studies</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.activeStudies}</div>
                <p className="text-xs text-muted-foreground">
                  Bible studies in progress
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Baptism</CardTitle>
            <Droplets className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.awaitingBaptism}</div>
                <p className="text-xs text-muted-foreground">Need water baptism</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Holy Ghost</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.awaitingHolyGhost}</div>
                <p className="text-xs text-muted-foreground">Baptized, seeking Spirit</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secondary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* New Birth Progress */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>New Birth Journey Overview</CardTitle>
            <CardDescription>
              John 3:5 - Born of Water and Spirit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span>Water Baptism (in Jesus&apos; Name)</span>
                </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <span className="text-muted-foreground">{baptizedCount} / {stats.totalStudents} students</span>
                )}
              </div>
              <Progress value={baptismPercent} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span>Holy Ghost (with tongues)</span>
                </div>
                {isLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  <span className="text-muted-foreground">{holyGhostCount} / {stats.totalStudents} students</span>
                )}
              </div>
              <Progress value={holyGhostPercent} className="h-2" />
            </div>

            {/* This Month Stats */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">This Month</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Droplets className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    {isLoading ? (
                      <Skeleton className="h-5 w-8" />
                    ) : (
                      <p className="text-lg font-semibold">{stats.baptismsThisMonth}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Baptisms</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <Flame className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    {isLoading ? (
                      <Skeleton className="h-5 w-8" />
                    ) : (
                      <p className="text-lg font-semibold">{stats.holyGhostThisMonth}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Holy Ghost</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Students */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Students</CardTitle>
            <CardDescription>Latest additions to your discipleship program</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studentsLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))
              ) : recentStudents.length > 0 ? (
                recentStudents.map((student) => {
                  const { waterBaptism, holyGhost } = student.newBirthStatus;
                  let statusIcon = GraduationCap;
                  let statusColor = 'text-muted-foreground';
                  let statusText = 'Just started';
                  
                  if (waterBaptism.completed && holyGhost.completed) {
                    statusIcon = Flame;
                    statusColor = 'text-green-500';
                    statusText = 'Born Again!';
                  } else if (waterBaptism.completed) {
                    statusIcon = Flame;
                    statusColor = 'text-orange-500';
                    statusText = 'Seeking Holy Ghost';
                  } else {
                    statusIcon = Droplets;
                    statusColor = 'text-blue-500';
                    statusText = 'Awaiting baptism';
                  }
                  
                  const Icon = statusIcon;
                  
                  return (
                    <Link 
                      key={student.id} 
                      href={`/dashboard/students/${student.id}`}
                      className="flex items-center gap-4 hover:bg-accent rounded-lg p-2 -m-2 transition-colors"
                    >
                      <div className={`p-2 rounded-full bg-muted ${statusColor}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {student.user?.firstName} {student.user?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{statusText}</p>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-4">
                  <GraduationCap className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No students yet</p>
                  <Link href="/dashboard/students/new" className="text-sm text-primary hover:underline">
                    Add your first student
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for managing discipleship</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Add New Student', icon: GraduationCap, href: '/dashboard/students/new' },
              { title: 'Start Bible Study', icon: BookOpen, href: '/dashboard/studies/new' },
              { title: 'View All Students', icon: Users, href: '/dashboard/students' },
              { title: 'View Reports', icon: TrendingUp, href: '/dashboard/reports' },
              ...(isAdmin ? [
                { title: 'Manage Users', icon: UserCheck, href: '/dashboard/settings/users' },
                { title: 'Church Settings', icon: Church, href: '/dashboard/settings/church' },
              ] : []),
            ].map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <action.icon className="h-5 w-5 text-primary" />
                <span className="font-medium">{action.title}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
