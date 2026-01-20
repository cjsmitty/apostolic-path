'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStudies } from '@/lib/hooks';
import type { BibleStudy, User } from '@apostolic-path/shared';
import { format } from 'date-fns';
import {
    BookOpen,
    Calendar,
    CheckCircle2,
    Clock,
    MapPin,
    Pause,
    Plus,
    Search,
    Users,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface StudyWithDetails extends BibleStudy {
  teacher?: User;
  students?: User[];
  lessonCount?: number;
  completedLessonCount?: number;
}

const CURRICULUM_LABELS: Record<string, string> = {
  'search-for-truth': 'Search for Truth',
  'exploring-gods-word': "Exploring God's Word",
  'first-principles': 'First Principles',
  custom: 'Custom Study',
};

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge variant="success">Completed</Badge>;
    case 'paused':
      return <Badge variant="secondary">Paused</Badge>;
    default:
      return <Badge variant="default">In Progress</Badge>;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'paused':
      return <Pause className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Clock className="h-4 w-4 text-primary" />;
  }
}

function StudyCard({ study }: { study: StudyWithDetails }) {
  const lessonProgress =
    study.lessonCount && study.lessonCount > 0
      ? ((study.completedLessonCount || 0) / study.lessonCount) * 100
      : 0;

  return (
    <Link href={`/dashboard/studies/${study.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(study.status)}
              <CardTitle className="text-lg line-clamp-1">{study.title}</CardTitle>
            </div>
            {getStatusBadge(study.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            {CURRICULUM_LABELS[study.curriculum] || study.curriculum}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Lesson Progress</span>
              <span className="font-medium">
                {study.completedLessonCount || 0}/{study.lessonCount || 0}
              </span>
            </div>
            <Progress value={lessonProgress} className="h-2" />
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {study.studentIds?.length || 0} student
                {(study.studentIds?.length || 0) !== 1 ? 's' : ''}
              </span>
            </div>

            {study.scheduledDay && study.scheduledTime && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {study.scheduledDay}s at {study.scheduledTime}
                </span>
              </div>
            )}

            {study.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{study.location}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t text-xs text-muted-foreground">
            Started {format(new Date(study.createdAt), 'MMM d, yyyy')}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function StudyCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-4 w-32 mt-1" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-4 w-28 mt-3" />
      </CardContent>
    </Card>
  );
}

export default function StudiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: studies, isLoading } = useStudies(
    statusFilter !== 'all' ? { status: statusFilter } : undefined
  );

  // Filter studies by search query
  const filteredStudies = studies?.filter((study) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      study.title.toLowerCase().includes(query) ||
      CURRICULUM_LABELS[study.curriculum]?.toLowerCase().includes(query)
    );
  });

  const activeCount = studies?.filter((s) => s.status === 'in-progress').length || 0;
  const completedCount = studies?.filter((s) => s.status === 'completed').length || 0;
  const pausedCount = studies?.filter((s) => s.status === 'paused').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bible Studies</h1>
          <p className="text-muted-foreground">
            Manage your Bible study sessions and track lesson progress.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/studies/new">
            <Plus className="h-4 w-4 mr-2" />
            New Study
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCount}</p>
                <p className="text-sm text-muted-foreground">Active Studies</p>
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
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-full">
                <Pause className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pausedCount}</p>
                <p className="text-sm text-muted-foreground">Paused</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search studies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="in-progress">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Studies Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <StudyCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredStudies && filteredStudies.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudies.map((study) => (
            <StudyCard key={study.id} study={study} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || statusFilter !== 'all' ? 'No studies found' : 'No Bible studies yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Start your first Bible study to guide students through Scripture.'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button asChild>
                <Link href="/dashboard/studies/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Start Your First Study
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
