'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLessons, useMarkLessonComplete, useStudy, useUpdateStudyStatus } from '@/lib/hooks';
import type { LessonProgress } from '@apostolic-path/shared';
import { format } from 'date-fns';
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    CheckCircle2,
    Clock,
    Edit,
    MapPin,
    Pause,
    Play,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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

function LessonCard({
  lesson,
  onMarkComplete,
  isUpdating,
}: {
  lesson: LessonProgress;
  onMarkComplete: (lessonId: string) => void;
  isUpdating: boolean;
}) {
  const isCompleted = lesson.status === 'completed';
  const isInProgress = lesson.status === 'in-progress';

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border ${
        isCompleted
          ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
          : ''
      }`}
    >
      <div
        className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
          isCompleted
            ? 'bg-green-100 text-green-600 dark:bg-green-900/50'
            : isInProgress
              ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50'
              : 'bg-muted text-muted-foreground'
        }`}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : isInProgress ? (
          <Clock className="h-5 w-5" />
        ) : (
          <span className="font-semibold">{lesson.lessonNumber}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">
            Lesson {lesson.lessonNumber}: {lesson.lessonTitle}
          </h4>
        </div>
        {isCompleted && lesson.completedDate && (
          <p className="text-sm text-muted-foreground">
            Completed {format(new Date(lesson.completedDate), 'MMMM d, yyyy')}
          </p>
        )}
        {lesson.teacherNotes && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
            Note: {lesson.teacherNotes}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant={
            isCompleted ? 'success' : isInProgress ? 'warning' : 'secondary'
          }
        >
          {isCompleted ? 'Complete' : isInProgress ? 'In Progress' : 'Not Started'}
        </Badge>
        {!isCompleted && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMarkComplete(lesson.id)}
            disabled={isUpdating}
          >
            {isInProgress ? 'Mark Complete' : 'Start'}
          </Button>
        )}
      </div>
    </div>
  );
}

function StudyInfoSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-64 md:col-span-1" />
        <Skeleton className="h-64 md:col-span-2" />
      </div>
    </div>
  );
}

export default function StudyDetailPage() {
  const params = useParams();
  const studyId = params.id as string;
  const { toast } = useToast();

  const { data: study, isLoading: studyLoading, error } = useStudy(studyId);
  const { data: lessons, isLoading: lessonsLoading } = useLessons(studyId);
  const markComplete = useMarkLessonComplete();
  const updateStatus = useUpdateStudyStatus();

  const handleMarkLessonComplete = async (lessonId: string) => {
    try {
      await markComplete.mutateAsync({ id: lessonId, studyId });
      toast({
        title: 'Lesson updated',
        description: 'Lesson has been marked as complete.',
      });
    } catch (error) {
      toast({
        title: 'Failed to update',
        description: 'Could not update the lesson. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id: studyId, status: newStatus });
      toast({
        title: 'Status updated',
        description: `Study has been marked as ${newStatus.replace('-', ' ')}.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to update',
        description: 'Could not update the study status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getLessonProgress = () => {
    if (!lessons) return { completed: 0, total: 0 };
    const completed = lessons.filter((l) => l.status === 'completed').length;
    return { completed, total: lessons.length };
  };

  if (studyLoading) {
    return <StudyInfoSkeleton />;
  }

  if (error || !study) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/studies"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Studies
        </Link>
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Study not found</h3>
            <p className="text-muted-foreground">
              The Bible study you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lessonProgress = getLessonProgress();
  const progressPercent =
    lessonProgress.total > 0
      ? Math.round((lessonProgress.completed / lessonProgress.total) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/studies"
            className="inline-flex items-center justify-center h-10 w-10 rounded-lg border hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{study.title}</h1>
              {getStatusBadge(study.status)}
            </div>
            <p className="text-muted-foreground">
              {CURRICULUM_LABELS[study.curriculum] || study.curriculum}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {study.status === 'in-progress' && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange('paused')}
              disabled={updateStatus.isPending}
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          {study.status === 'paused' && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange('in-progress')}
              disabled={updateStatus.isPending}
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          {study.status !== 'completed' && (
            <Button
              variant="default"
              onClick={() => handleStatusChange('completed')}
              disabled={updateStatus.isPending}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Complete
            </Button>
          )}
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Study Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Lessons Completed</span>
                  <span className="font-medium">
                    {lessonProgress.completed}/{lessonProgress.total}
                  </span>
                </div>
                <Progress value={progressPercent} />
              </div>

              <div className="text-center py-4">
                <div className="text-4xl font-bold text-primary">{progressPercent}%</div>
                <p className="text-sm text-muted-foreground">Complete</p>
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Students</p>
                  <p className="font-medium">
                    {study.studentIds?.length || 0} enrolled
                  </p>
                </div>
              </div>

              {study.scheduledDay && study.scheduledTime && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <p className="text-muted-foreground">Schedule</p>
                      <p className="font-medium">
                        {study.scheduledDay}s at {study.scheduledTime}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {study.location && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div className="text-sm">
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium">{study.location}</p>
                    </div>
                  </div>
                </>
              )}

              <Separator />
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Started</p>
                  <p className="font-medium">
                    {format(new Date(study.createdAt), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          {study.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{study.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Lessons Area */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Lessons</CardTitle>
              <CardDescription>
                Track progress through each lesson in the curriculum
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lessonsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-48 mb-1" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              ) : lessons && lessons.length > 0 ? (
                <div className="space-y-3">
                  {lessons
                    .sort((a, b) => a.lessonNumber - b.lessonNumber)
                    .map((lesson) => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        onMarkComplete={handleMarkLessonComplete}
                        isUpdating={markComplete.isPending}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    No lessons found for this study.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
