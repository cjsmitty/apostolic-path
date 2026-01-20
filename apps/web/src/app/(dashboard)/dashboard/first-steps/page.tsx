'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirstStepsStats, useStudents } from '@/lib/hooks';
import type { FirstStepsProgress, Student, User } from '@apostolic-path/shared';
import {
    Book,
    CheckCircle2,
    Church,
    Droplets,
    Flame,
    Footprints,
    Heart,
    MessageSquare,
    TrendingUp,
    Users
} from 'lucide-react';
import Link from 'next/link';

interface StudentWithUser extends Student {
  user?: User;
}

const FIRST_STEPS = [
  {
    key: 'step1_foundations',
    name: 'Foundations',
    description: 'Basic beliefs and doctrines',
    icon: Book,
  },
  {
    key: 'step2_waterBaptism',
    name: 'Water Baptism',
    description: 'Understanding baptism in Jesus name',
    icon: Droplets,
  },
  {
    key: 'step3_holyGhost',
    name: 'Holy Ghost',
    description: 'Receiving the gift of the Holy Ghost',
    icon: Flame,
  },
  {
    key: 'step4_prayer',
    name: 'Prayer Life',
    description: 'Developing a consistent prayer life',
    icon: MessageSquare,
  },
  {
    key: 'step5_wordOfGod',
    name: 'Word of God',
    description: 'Bible study habits and devotion',
    icon: Book,
  },
  {
    key: 'step6_churchLife',
    name: 'Church Life',
    description: 'Involvement in church activities',
    icon: Church,
  },
  {
    key: 'step7_holiness',
    name: 'Holiness',
    description: 'Living a holy and separated life',
    icon: Heart,
  },
  {
    key: 'step8_evangelism',
    name: 'Evangelism',
    description: 'Sharing your faith with others',
    icon: Users,
  },
] as const;

function StepProgressCard({
  step,
  stats,
  totalStudents,
}: {
  step: (typeof FIRST_STEPS)[number];
  stats: { started: number; completed: number } | undefined;
  totalStudents: number;
}) {
  const Icon = step.icon;
  const started = stats?.started || 0;
  const completed = stats?.completed || 0;
  const progressPercent = totalStudents > 0 ? Math.round((completed / totalStudents) * 100) : 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">{step.name}</h3>
            <p className="text-sm text-muted-foreground">{step.description}</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium">
                  {completed}/{totalStudents}
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {started - completed} in progress
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentProgressRow({ student }: { student: StudentWithUser }) {
  const user = student.user;
  const progress = student.firstStepsProgress;

  const getCompletedCount = () => {
    if (!progress) return 0;
    return FIRST_STEPS.filter(
      (step) => progress[step.key as keyof FirstStepsProgress]?.completed
    ).length;
  };

  const completedCount = getCompletedCount();
  const progressPercent = Math.round((completedCount / 8) * 100);

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return '?';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <Link
      href={`/dashboard/students/${student.id}`}
      className="flex items-center gap-4 p-4 rounded-lg hover:bg-accent transition-colors"
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={user?.avatar} />
        <AvatarFallback className="text-sm">
          {getInitials(user?.firstName, user?.lastName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {user?.firstName} {user?.lastName}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {FIRST_STEPS.map((step) => {
            const stepProgress = progress?.[step.key as keyof FirstStepsProgress];
            const isCompleted = stepProgress?.completed;
            const isStarted = stepProgress?.started;
            return (
              <div
                key={step.key}
                className={`w-3 h-3 rounded-full ${
                  isCompleted
                    ? 'bg-green-500'
                    : isStarted
                      ? 'bg-yellow-500'
                      : 'bg-muted'
                }`}
                title={`${step.name}: ${isCompleted ? 'Complete' : isStarted ? 'In Progress' : 'Not Started'}`}
              />
            );
          })}
        </div>
      </div>

      <div className="text-right">
        <Badge variant={completedCount === 8 ? 'success' : completedCount > 0 ? 'default' : 'secondary'}>
          {completedCount}/8
        </Badge>
        <p className="text-xs text-muted-foreground mt-1">{progressPercent}%</p>
      </div>
    </Link>
  );
}

export default function FirstStepsPage() {
  const { data: stats, isLoading: statsLoading } = useFirstStepsStats();
  const { data: students, isLoading: studentsLoading } = useStudents();

  const isLoading = statsLoading || studentsLoading;

  // Sort students by progress (most progress first)
  const sortedStudents = [...(students || [])].sort((a, b) => {
    const getCompleted = (s: StudentWithUser) => {
      if (!s.firstStepsProgress) return 0;
      return FIRST_STEPS.filter(
        (step) => s.firstStepsProgress[step.key as keyof FirstStepsProgress]?.completed
      ).length;
    };
    return getCompleted(b) - getCompleted(a);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">First Steps</h1>
        <p className="text-muted-foreground">
          Track discipleship progress through the 8-step First Steps curriculum.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
                )}
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.fullyCompleted || 0}</p>
                )}
                <p className="text-sm text-muted-foreground">Completed All Steps</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <Footprints className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">
                    {(stats?.totalStudents || 0) - (stats?.fullyCompleted || 0)}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats?.averageCompletion || 0}%</p>
                )}
                <p className="text-sm text-muted-foreground">Average Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step-by-Step Progress */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Progress by Step</h2>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {FIRST_STEPS.map((step) => (
              <StepProgressCard
                key={step.key}
                step={step}
                stats={stats?.stepProgress?.[step.key]}
                totalStudents={stats?.totalStudents || 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Student Progress List */}
      <Card>
        <CardHeader>
          <CardTitle>Student Progress</CardTitle>
          <CardDescription>Track individual student progress through First Steps</CardDescription>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </div>
          ) : sortedStudents.length > 0 ? (
            <div className="divide-y">
              {sortedStudents.map((student) => (
                <StudentProgressRow key={student.id} student={student} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Footprints className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No students yet</h3>
              <p className="text-muted-foreground">
                Add students to start tracking their First Steps progress.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
