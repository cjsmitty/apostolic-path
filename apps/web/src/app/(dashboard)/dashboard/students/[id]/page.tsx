'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useStudent, useUpdateFirstStep, useUpdateNewBirthMilestone } from '@/lib/hooks';
import type { FirstStepsProgress } from '@apostolic-path/shared';
import { format } from 'date-fns';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Circle,
    Droplets,
    Edit,
    Flame,
    Footprints,
    Mail,
    Phone,
    Play,
    User
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const FIRST_STEPS = [
  { key: 'step1_foundations', name: 'Foundations', description: 'Basic beliefs and doctrines' },
  { key: 'step2_waterBaptism', name: 'Water Baptism', description: 'Understanding baptism in Jesus name' },
  { key: 'step3_holyGhost', name: 'Holy Ghost', description: 'Receiving the gift of the Holy Ghost' },
  { key: 'step4_prayer', name: 'Prayer Life', description: 'Developing a consistent prayer life' },
  { key: 'step5_wordOfGod', name: 'Word of God', description: 'Bible study habits and devotion' },
  { key: 'step6_churchLife', name: 'Church Life', description: 'Involvement in church activities' },
  { key: 'step7_holiness', name: 'Holiness', description: 'Living a holy and separated life' },
  { key: 'step8_evangelism', name: 'Evangelism', description: 'Sharing your faith with others' },
] as const;

function NewBirthMilestoneCard({
  title,
  icon: Icon,
  iconColor,
  completed,
  date,
  notes,
  onMarkComplete,
  isUpdating,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  completed: boolean;
  date?: string;
  notes?: string;
  onMarkComplete: () => void;
  isUpdating: boolean;
}) {
  return (
    <Card className={completed ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full bg-muted ${iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{title}</h4>
                {completed && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </div>
              {completed && date && (
                <p className="text-sm text-muted-foreground">
                  Completed {format(new Date(date), 'MMMM d, yyyy')}
                </p>
              )}
              {notes && (
                <p className="text-sm text-muted-foreground mt-1">{notes}</p>
              )}
            </div>
          </div>
          {!completed && (
            <Button
              size="sm"
              variant="outline"
              onClick={onMarkComplete}
              disabled={isUpdating}
            >
              Mark Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FirstStepsProgressCard({
  step,
  progress,
  onStart,
  onComplete,
  isUpdating,
}: {
  step: (typeof FIRST_STEPS)[number];
  progress: FirstStepsProgress[keyof FirstStepsProgress];
  onStart: () => void;
  onComplete: () => void;
  isUpdating: boolean;
}) {
  const isCompleted = progress?.completed;
  const isStarted = progress?.started;

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border">
      <div className={`p-2 rounded-full ${isCompleted ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' : isStarted ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400' : 'bg-muted text-muted-foreground'}`}>
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : isStarted ? (
          <Circle className="h-4 w-4 fill-current" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm">{step.name}</h4>
        <p className="text-xs text-muted-foreground truncate">{step.description}</p>
        {isCompleted && progress?.completedDate && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Completed {format(new Date(progress.completedDate), 'MMM d, yyyy')}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Badge
          variant={isCompleted ? 'success' : isStarted ? 'warning' : 'secondary'}
        >
          {isCompleted ? 'Complete' : isStarted ? 'In Progress' : 'Not Started'}
        </Badge>
        {!isStarted && !isCompleted && (
          <Button size="sm" variant="outline" onClick={onStart} disabled={isUpdating}>
            <Play className="h-3 w-3 mr-1" />
            Start
          </Button>
        )}
        {isStarted && !isCompleted && (
          <Button size="sm" variant="outline" onClick={onComplete} disabled={isUpdating}>
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Complete
          </Button>
        )}
      </div>
    </div>
  );
}

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;
  const { toast } = useToast();

  const { data: student, isLoading, error } = useStudent(studentId);
  const updateMilestone = useUpdateNewBirthMilestone();
  const updateFirstStep = useUpdateFirstStep();

  const handleMarkMilestoneComplete = async (milestone: 'waterBaptism' | 'holyGhost') => {
    try {
      await updateMilestone.mutateAsync({
        studentId,
        milestone,
        completed: true,
        date: new Date().toISOString(),
      });
      const displayName = milestone === 'waterBaptism' ? 'Water Baptism' : 'Holy Ghost';
      toast({
        title: 'Milestone completed!',
        description: `${displayName} has been marked as complete.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to update',
        description: 'Could not update the milestone. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleStartStep = async (step: string) => {
    try {
      await updateFirstStep.mutateAsync({
        studentId,
        step,
        started: true,
      });
      toast({
        title: 'Step started!',
        description: 'The student has begun this step.',
      });
    } catch (error) {
      toast({
        title: 'Failed to update',
        description: 'Could not update the step. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteStep = async (step: string) => {
    try {
      await updateFirstStep.mutateAsync({
        studentId,
        step,
        completed: true,
      });
      toast({
        title: 'Step completed!',
        description: 'Great progress! The step has been marked as complete.',
      });
    } catch (error) {
      toast({
        title: 'Failed to update',
        description: 'Could not update the step. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getFirstStepsProgress = () => {
    if (!student?.firstStepsProgress) return { completed: 0, total: 8 };
    let completed = 0;
    FIRST_STEPS.forEach((step) => {
      const progress = student.firstStepsProgress[step.key as keyof FirstStepsProgress];
      if (progress?.completed) completed++;
    });
    return { completed, total: 8 };
  };

  const getNewBirthProgress = () => {
    if (!student) return { completed: 0, total: 2 };
    const { waterBaptism, holyGhost } = student.newBirthStatus;
    let completed = 0;
    if (waterBaptism.completed) completed++;
    if (holyGhost.completed) completed++;
    return { completed, total: 2 };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 md:col-span-1" />
          <Skeleton className="h-64 md:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/students"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Students
        </Link>
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Student not found</h3>
            <p className="text-muted-foreground">
              The student record you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const user = student.user;
  const newBirthProgress = getNewBirthProgress();
  const firstStepsProgress = getFirstStepsProgress();

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return '?';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/students"
            className="inline-flex items-center justify-center h-10 w-10 rounded-lg border hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-muted-foreground">
                Started {format(new Date(student.startDate), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit Student
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Contact Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>
              )}
              {user?.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.phone}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="text-muted-foreground">Started</p>
                  <p>{format(new Date(student.startDate), 'PPP')}</p>
                </div>
              </div>
              {student.completionDate && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <div className="text-sm">
                    <p className="text-muted-foreground">Completed</p>
                    <p>{format(new Date(student.completionDate), 'PPP')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Journey Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    New Birth
                  </span>
                  <span className="text-muted-foreground">
                    {newBirthProgress.completed}/{newBirthProgress.total}
                  </span>
                </div>
                <Progress value={(newBirthProgress.completed / newBirthProgress.total) * 100} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Footprints className="h-4 w-4 text-primary" />
                    First Steps
                  </span>
                  <span className="text-muted-foreground">
                    {firstStepsProgress.completed}/{firstStepsProgress.total}
                  </span>
                </div>
                <Progress value={(firstStepsProgress.completed / firstStepsProgress.total) * 100} />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {student.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{student.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-2">
          <Tabs defaultValue="new-birth">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new-birth" className="flex items-center gap-2">
                <Flame className="h-4 w-4" />
                New Birth
              </TabsTrigger>
              <TabsTrigger value="first-steps" className="flex items-center gap-2">
                <Footprints className="h-4 w-4" />
                First Steps
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new-birth" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>New Birth Journey</CardTitle>
                  <CardDescription>
                    John 3:5 - Born of water (Baptism in Jesus Name) and Spirit (Holy Ghost with evidence of speaking in tongues)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <NewBirthMilestoneCard
                    title="Water Baptism in Jesus' Name"
                    icon={Droplets}
                    iconColor="text-blue-500"
                    completed={student.newBirthStatus.waterBaptism.completed}
                    date={student.newBirthStatus.waterBaptism.date}
                    notes={student.newBirthStatus.waterBaptism.notes}
                    onMarkComplete={() => handleMarkMilestoneComplete('waterBaptism')}
                    isUpdating={updateMilestone.isPending}
                  />

                  <NewBirthMilestoneCard
                    title="Holy Ghost (with tongues)"
                    icon={Flame}
                    iconColor="text-orange-500"
                    completed={student.newBirthStatus.holyGhost.completed}
                    date={student.newBirthStatus.holyGhost.date}
                    notes={student.newBirthStatus.holyGhost.notes}
                    onMarkComplete={() => handleMarkMilestoneComplete('holyGhost')}
                    isUpdating={updateMilestone.isPending}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="first-steps" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>First Steps Discipleship</CardTitle>
                  <CardDescription>
                    8-step discipleship curriculum for new believers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {FIRST_STEPS.map((step) => (
                    <FirstStepsProgressCard
                      key={step.key}
                      step={step}
                      progress={student.firstStepsProgress?.[step.key as keyof FirstStepsProgress]}
                      onStart={() => handleStartStep(step.key)}
                      onComplete={() => handleCompleteStep(step.key)}
                      isUpdating={updateFirstStep.isPending}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
