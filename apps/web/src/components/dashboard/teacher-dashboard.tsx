'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/auth';
import { useStudents, useStudies } from '@/lib/hooks';
import {
    BookOpen,
    Calendar,
    Droplets,
    Flame,
    GraduationCap,
    TrendingUp,
    Users
} from 'lucide-react';
import Link from 'next/link';

/**
 * Teacher Dashboard View
 * Shows assigned students and studies they're leading
 */
export function TeacherDashboard() {
  const user = useAuthStore((state) => state.user);
  
  // Fetch teacher's assigned students and studies
  const { data: students, isLoading: studentsLoading } = useStudents();
  const { data: studies, isLoading: studiesLoading } = useStudies();
  
  const isLoading = studentsLoading || studiesLoading;

  // Filter to only show assigned students (in real implementation, API should filter)
  const myStudents = students?.filter((s) => s.assignedTeacherId === user?.id) ?? [];
  const myStudies = studies ?? [];
  
  // Calculate stats for my students
  const awaitingBaptism = myStudents.filter((s) => !s.newBirthStatus.waterBaptism.completed).length;
  const awaitingHolyGhost = myStudents.filter(
    (s) => s.newBirthStatus.waterBaptism.completed && !s.newBirthStatus.holyGhost.completed
  ).length;
  const bornAgain = myStudents.filter(
    (s) => s.newBirthStatus.waterBaptism.completed && s.newBirthStatus.holyGhost.completed
  ).length;

  // Active studies count
  const activeStudies = myStudies.filter((s) => s.status === 'in-progress').length;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, Teacher {user?.firstName || ''}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your assigned students and Bible studies.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{myStudents.length}</div>
                <p className="text-xs text-muted-foreground">
                  Assigned to you
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
                <div className="text-2xl font-bold">{activeStudies}</div>
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
                <div className="text-2xl font-bold">{awaitingBaptism}</div>
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
                <div className="text-2xl font-bold">{awaitingHolyGhost}</div>
                <p className="text-xs text-muted-foreground">Baptized, seeking Spirit</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* My Students Progress */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>My Students Progress</CardTitle>
            <CardDescription>
              Track your assigned students&apos; spiritual journey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))
            ) : myStudents.length > 0 ? (
              myStudents.slice(0, 5).map((student) => {
                const { waterBaptism, holyGhost } = student.newBirthStatus;
                let statusIcon = GraduationCap;
                let statusColor = 'text-muted-foreground bg-muted';
                let statusText = 'Just started';
                
                if (waterBaptism.completed && holyGhost.completed) {
                  statusIcon = Flame;
                  statusColor = 'text-green-600 bg-green-100';
                  statusText = 'Born Again!';
                } else if (waterBaptism.completed) {
                  statusIcon = Flame;
                  statusColor = 'text-orange-600 bg-orange-100';
                  statusText = 'Seeking Holy Ghost';
                } else {
                  statusIcon = Droplets;
                  statusColor = 'text-blue-600 bg-blue-100';
                  statusText = 'Awaiting baptism';
                }
                
                const Icon = statusIcon;
                
                return (
                  <Link 
                    key={student.id} 
                    href={`/dashboard/students/${student.id}`}
                    className="flex items-center gap-4 hover:bg-accent rounded-lg p-2 -m-2 transition-colors"
                  >
                    <div className={`p-2 rounded-full ${statusColor}`}>
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
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No students assigned yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your pastor will assign students to you
                </p>
              </div>
            )}
            {myStudents.length > 5 && (
              <Link 
                href="/dashboard/students" 
                className="block text-center text-sm text-primary hover:underline pt-2"
              >
                View all {myStudents.length} students →
              </Link>
            )}
          </CardContent>
        </Card>

        {/* My Bible Studies */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>My Bible Studies</CardTitle>
            <CardDescription>Studies you are leading</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))
              ) : myStudies.length > 0 ? (
                myStudies.slice(0, 4).map((study) => {
                  // Use lessonProgress if available
                  const lessonProgress = (study as unknown as { lessonProgress?: number }).lessonProgress ?? 50;
                  
                  return (
                    <Link
                      key={study.id}
                      href={`/dashboard/studies/${study.id}`}
                      className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm truncate">{study.title}</h4>
                        <Badge variant={study.status === 'in-progress' ? 'default' : 'secondary'}>
                          {study.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{lessonProgress}%</span>
                        </div>
                        <Progress value={lessonProgress} className="h-1.5" />
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{study.studentIds?.length ?? 0} students</span>
                        {study.scheduledDay && (
                          <>
                            <span className="mx-1">•</span>
                            <Calendar className="h-3 w-3" />
                            <span>{study.scheduledDay}s</span>
                          </>
                        )}
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No Bible studies yet</p>
                  <Link 
                    href="/dashboard/studies/new"
                    className="inline-block mt-2 text-sm text-primary hover:underline"
                  >
                    Start a new study →
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
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Add New Student', icon: GraduationCap, href: '/dashboard/students/new' },
              { title: 'Start Bible Study', icon: BookOpen, href: '/dashboard/studies/new' },
              { title: 'View My Students', icon: Users, href: '/dashboard/students' },
              { title: 'View My Studies', icon: TrendingUp, href: '/dashboard/studies' },
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
