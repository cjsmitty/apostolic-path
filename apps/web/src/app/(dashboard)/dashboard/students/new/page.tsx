'use client';

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
import { useCreateStudent, useUsers } from '@/lib/hooks';
import { ArrowLeft, GraduationCap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewStudentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createStudent = useCreateStudent();
  const { data: users, isLoading: usersLoading } = useUsers();

  const [selectedUserId, setSelectedUserId] = useState('');
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

    try {
      await createStudent.mutateAsync({
        userId: selectedUserId,
        notes: notes || undefined,
      });

      toast({
        title: 'Student created!',
        description: 'The student record has been created successfully.',
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
            Create a student record to track their New Birth journey
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>
              Select a church member to begin tracking their discipleship journey
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
            <Button type="submit" disabled={createStudent.isPending || !selectedUserId}>
              {createStudent.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Student
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
