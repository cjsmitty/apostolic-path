'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCreateStudy, useStudents } from '@/lib/hooks';
import type { Student, User } from '@apostolic-path/shared';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface StudentWithUser extends Student {
  user?: User;
}

const CURRICULUMS = [
  {
    value: 'search-for-truth',
    label: 'Search for Truth',
    description: '12 lessons covering foundational Apostolic doctrine',
    lessonCount: 12,
  },
  {
    value: 'exploring-gods-word',
    label: "Exploring God's Word",
    description: '8 lessons on the Oneness and New Birth',
    lessonCount: 8,
  },
  {
    value: 'first-principles',
    label: 'First Principles',
    description: '10 lessons for new believers',
    lessonCount: 10,
  },
  {
    value: 'custom',
    label: 'Custom Study',
    description: 'Create your own lesson plan',
    lessonCount: 0,
  },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function StudentSelector({
  students,
  selectedIds,
  onToggle,
  isLoading,
}: {
  students: StudentWithUser[];
  selectedIds: string[];
  onToggle: (studentId: string) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p>No students found.</p>
        <Link href="/dashboard/students/new" className="text-primary hover:underline text-sm">
          Add a student first
        </Link>
      </div>
    );
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return '?';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {students.map((student) => (
        <label
          key={student.id}
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
            selectedIds.includes(student.id)
              ? 'border-primary bg-primary/5'
              : ''
          }`}
        >
          <Checkbox
            checked={selectedIds.includes(student.id)}
            onCheckedChange={() => onToggle(student.id)}
          />
          <Avatar className="h-8 w-8">
            <AvatarImage src={student.user?.avatar} />
            <AvatarFallback className="text-xs">
              {getInitials(student.user?.firstName, student.user?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {student.user?.firstName} {student.user?.lastName}
            </p>
            {student.user?.email && (
              <p className="text-xs text-muted-foreground truncate">{student.user.email}</p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}

export default function NewStudyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: students, isLoading: studentsLoading } = useStudents();
  const createStudy = useCreateStudy();

  // Form state
  const [title, setTitle] = useState('');
  const [curriculum, setCurriculum] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [scheduledDay, setScheduledDay] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for the study.',
        variant: 'destructive',
      });
      return;
    }

    if (!curriculum) {
      toast({
        title: 'Curriculum required',
        description: 'Please select a curriculum.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedStudentIds.length === 0) {
      toast({
        title: 'Students required',
        description: 'Please select at least one student for the study.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const study = await createStudy.mutateAsync({
        title: title.trim(),
        curriculum,
        studentIds: selectedStudentIds,
        scheduledDay: scheduledDay || undefined,
        scheduledTime: scheduledTime || undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast({
        title: 'Study created!',
        description: 'Your new Bible study has been created successfully.',
      });

      router.push(`/dashboard/studies/${study?.id || ''}`);
    } catch (error) {
      toast({
        title: 'Failed to create study',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const selectedCurriculum = CURRICULUMS.find((c) => c.value === curriculum);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/studies"
          className="inline-flex items-center justify-center h-10 w-10 rounded-lg border hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Start New Bible Study</h1>
          <p className="text-muted-foreground">
            Create a new study session to guide students through Scripture.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Study Information</CardTitle>
            <CardDescription>Enter the basic details for your Bible study.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Study Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Tuesday Night Bible Study"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="curriculum">Curriculum *</Label>
              <Select value={curriculum} onValueChange={setCurriculum}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a curriculum" />
                </SelectTrigger>
                <SelectContent>
                  {CURRICULUMS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCurriculum && (
                <p className="text-sm text-muted-foreground">
                  {selectedCurriculum.description}
                  {selectedCurriculum.lessonCount > 0 && (
                    <span className="font-medium"> ({selectedCurriculum.lessonCount} lessons)</span>
                  )}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes about this study..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Schedule (Optional) */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule (Optional)</CardTitle>
            <CardDescription>Set a regular meeting time for this study.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="day">Day of Week</Label>
                <Select value={scheduledDay} onValueChange={setScheduledDay}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Church Fellowship Hall, Student's Home"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Student Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Students *</CardTitle>
            <CardDescription>
              Choose which students will participate in this study.
              {selectedStudentIds.length > 0 && (
                <span className="font-medium text-primary">
                  {' '}
                  ({selectedStudentIds.length} selected)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StudentSelector
              students={students || []}
              selectedIds={selectedStudentIds}
              onToggle={handleToggleStudent}
              isLoading={studentsLoading}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard/studies">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createStudy.isPending}>
            {createStudy.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-2" />
                Create Study
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
