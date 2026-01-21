'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/auth';
import { useCreateStudent, useTeachers, useUsers } from '@/lib/hooks';
import { useHasPermission } from '@/lib/permissions';
import { ArrowLeft, GraduationCap, Loader2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewStudentPage() {
  return (
    <RoleGuard 
      permission="student:create" 
      showAccessDenied
      accessDeniedComponent={<AccessDeniedMessage />}
    >
      <AddStudentForm />
    </RoleGuard>
  );
}

function AccessDeniedMessage() {
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ShieldAlert className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground text-center mb-4">
            You don&apos;t have permission to add students. Only teachers, pastors, and admins can add students.
          </p>
          <Link href="/dashboard/students">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Students
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function AddStudentForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const createStudent = useCreateStudent();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: teachers, isLoading: teachersLoading } = useTeachers();
  
  // Check if user can assign teachers (pastors/admins only)
  const canAssignTeacher = useHasPermission('student:assign-teacher');
  const isTeacher = user?.role === 'teacher';

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [notes, setNotes] = useState('');

  // Filter users who might be candidates for becoming students
  const availableUsers = users?.filter((u) => u.role === 'member' || u.role === 'student') || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast({
        title: 'Please select a user',
        description: 'You must select a church member to create a student record for.',
        variant: 'destructive',
      });
      return;
    }

    // Validate teacher is selected for pastors/admins
    if (canAssignTeacher && !selectedTeacherId) {
      toast({
        title: 'Please select a teacher',
        description: 'You must assign a teacher to guide this student.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Determine the assigned teacher
      let assignedTeacherId: string;
      
      if (isTeacher) {
        // Teachers automatically assign themselves
        assignedTeacherId = user?.id as string;
      } else {
        // Pastors/Admins must choose a teacher
        assignedTeacherId = selectedTeacherId;
      }

      await createStudent.mutateAsync({
        userId: selectedUserId,
        assignedTeacherId,
        notes: notes || undefined,
      });

      toast({
        title: 'Student created!',
        description: isTeacher 
          ? 'The student has been added and assigned to you.'
          : 'The student record has been created successfully.',
      });

      router.push('/dashboard/students');
    } catch (error) {
      toast({
        title: 'Failed to create student',
        description: 'Could not create the student record. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/students"
          className="inline-flex items-center justify-center h-10 w-10 rounded-lg border hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Add New Student
          </h1>
          <p className="text-muted-foreground">
            {isTeacher 
              ? 'Add a church member as your student to track their New Birth journey'
              : 'Create a student record to track their New Birth journey'
            }
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>
              {isTeacher
                ? 'Select a church member to add as your student'
                : 'Select a church member to begin tracking their discipleship journey'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User Selection */}
            <div className="space-y-2">
              <Label htmlFor="userId">Church Member</Label>
              {usersLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading members...
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    No available members found
                  </p>
                  <Link href="/dashboard/members/new">
                    <Button variant="outline" size="sm">
                      Add a Member First
                    </Button>
                  </Link>
                </div>
              ) : (
                <select
                  id="userId"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Select a member...</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-muted-foreground">
                Only members not already enrolled as students are shown
              </p>
            </div>

            {/* Teacher Assignment - Required for Pastors/Admins */}
            {canAssignTeacher && (
              <div className="space-y-2">
                <Label htmlFor="teacherId">Assign Teacher <span className="text-destructive">*</span></Label>
                {teachersLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading teachers...
                  </div>
                ) : !teachers || teachers.length === 0 ? (
                  <div className="p-3 rounded-lg border border-destructive/50 text-center">
                    <p className="text-sm text-muted-foreground">
                      No teachers available. Please add a teacher before creating students.
                    </p>
                  </div>
                ) : (
                  <select
                    id="teacherId"
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  >
                    <option value="">Select a teacher...</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-muted-foreground">
                  Every student must have an assigned teacher to guide their journey
                </p>
              </div>
            )}

            {/* Teacher auto-assignment notice */}
            {isTeacher && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> This student will be automatically assigned to you as their teacher.
                </p>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information about this student..."
                rows={4}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/dashboard/students">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={createStudent.isPending || !selectedUserId || (canAssignTeacher && !selectedTeacherId)}
            >
              {createStudent.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isTeacher ? 'Add as My Student' : 'Create Student'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
