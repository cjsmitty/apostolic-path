'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useStudents } from '@/lib/hooks';
import type { Student, User } from '@apostolic-path/shared';
import { format } from 'date-fns';
import {
    CheckCircle2,
    Circle,
    Droplets,
    Flame,
    GraduationCap,
    Plus,
    Search,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface StudentWithUser extends Student {
  user?: User;
}

function getNewBirthProgress(student: Student) {
  const { waterBaptism, holyGhost } = student.newBirthStatus;
  let completed = 0;
  if (waterBaptism.completed) completed++;
  if (holyGhost.completed) completed++;
  return { completed, total: 2 };
}

function getNewBirthStatus(student: Student): 'completed' | 'in-progress' | 'not-started' {
  const { waterBaptism, holyGhost } = student.newBirthStatus;
  if (waterBaptism.completed && holyGhost.completed) return 'completed';
  if (waterBaptism.completed || holyGhost.completed) return 'in-progress';
  return 'not-started';
}

function StudentCard({ student }: { student: StudentWithUser }) {
  const progress = getNewBirthProgress(student);
  const status = getNewBirthStatus(student);
  const user = student.user;

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return '?';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <Link href={`/dashboard/students/${student.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(user?.firstName, user?.lastName)}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">
                  {user?.firstName} {user?.lastName}
                </h3>
                <Badge
                  variant={
                    status === 'completed'
                      ? 'success'
                      : status === 'in-progress'
                        ? 'warning'
                        : 'secondary'
                  }
                >
                  {status === 'completed'
                    ? 'Born Again'
                    : status === 'in-progress'
                      ? 'In Progress'
                      : 'New'}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-3">
                Started {format(new Date(student.startDate), 'MMM d, yyyy')}
              </p>

              {/* New Birth Milestones (John 3:5 - born of water and Spirit) */}
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center gap-1.5"
                  title={`Water Baptism: ${student.newBirthStatus.waterBaptism.completed ? 'Complete' : 'Pending'}`}
                >
                  {student.newBirthStatus.waterBaptism.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Droplets className="h-4 w-4 text-blue-500" />
                </div>

                <div
                  className="flex items-center gap-1.5"
                  title={`Holy Ghost: ${student.newBirthStatus.holyGhost.completed ? 'Complete' : 'Pending'}`}
                >
                  {student.newBirthStatus.holyGhost.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Flame className="h-4 w-4 text-orange-500" />
                </div>

                <span className="text-sm text-muted-foreground ml-auto">
                  {progress.completed}/{progress.total} milestones
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function StudentCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-40 mb-3" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-24 ml-auto" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: students, isLoading, error } = useStudents();

  // Filter students based on search and status
  const filteredStudents = students?.filter((student) => {
    const user = student.user;
    const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;

    const status = getNewBirthStatus(student);
    return matchesSearch && status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            Students
          </h1>
          <p className="text-muted-foreground">
            Manage and track students on their New Birth journey
          </p>
        </div>
        <Link href="/dashboard/students/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Born Again
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {students?.filter((s) => getNewBirthStatus(s) === 'completed').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {students?.filter((s) => getNewBirthStatus(s) === 'in-progress').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Just Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {students?.filter((s) => getNewBirthStatus(s) === 'not-started').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'completed', 'in-progress', 'not-started'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all'
                ? 'All'
                : status === 'completed'
                  ? 'Born Again'
                  : status === 'in-progress'
                    ? 'In Progress'
                    : 'New'}
            </Button>
          ))}
        </div>
      </div>

      {/* Student List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <StudentCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Failed to load students. Please try again.
          </CardContent>
        </Card>
      ) : filteredStudents?.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No students found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first student'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Link href="/dashboard/students/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredStudents?.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}
    </div>
  );
}
