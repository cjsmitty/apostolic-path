'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/lib/auth';
import {
    BookOpen,
    Calendar,
    CheckCircle2,
    Droplets,
    Flame,
    Footprints,
    TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

/**
 * Student Dashboard View
 * Shows personal progress and assigned studies
 */
export function StudentDashboard() {
  const user = useAuthStore((state) => state.user);
  
  // TODO: Fetch student's own data from API
  // For now, showing placeholder/mock data
  const isLoading = false;
  
  // Mock data for student progress
  const myProgress = {
    waterBaptism: { completed: true, date: '2025-12-15' },
    holyGhost: { completed: false, date: null },
    currentStudy: {
      title: 'Search for Truth - Series 1',
      lesson: 3,
      totalLessons: 10,
      nextSession: '2026-01-22',
    },
    firstSteps: {
      completed: 2,
      total: 8,
    },
  };

  const studyProgress = Math.round((myProgress.currentStudy.lesson / myProgress.currentStudy.totalLessons) * 100);
  const firstStepsProgress = Math.round((myProgress.firstSteps.completed / myProgress.firstSteps.total) * 100);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {user?.firstName || 'Friend'}!
        </h1>
        <p className="text-muted-foreground">
          Track your spiritual journey and growth.
        </p>
      </div>

      {/* New Birth Journey Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            My New Birth Journey
          </CardTitle>
          <CardDescription>
            John 3:5 - Born of Water and Spirit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Water Baptism */}
            <div className="flex items-start gap-4 p-4 rounded-lg border">
              <div className={`p-3 rounded-full ${myProgress.waterBaptism.completed ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                <Droplets className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Water Baptism</h3>
                  {myProgress.waterBaptism.completed && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {myProgress.waterBaptism.completed 
                    ? `Baptized on ${new Date(myProgress.waterBaptism.date!).toLocaleDateString()}`
                    : 'Ready to take this step in your journey'}
                </p>
              </div>
            </div>

            {/* Holy Ghost */}
            <div className="flex items-start gap-4 p-4 rounded-lg border">
              <div className={`p-3 rounded-full ${myProgress.holyGhost.completed ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                <Flame className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Holy Ghost</h3>
                  {myProgress.holyGhost.completed ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Received
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      Seeking
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {myProgress.holyGhost.completed 
                    ? `Received on ${new Date(myProgress.holyGhost.date!).toLocaleDateString()}`
                    : 'Continue seeking the infilling of the Holy Spirit'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Bible Study */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Current Bible Study
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myProgress.currentStudy ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{myProgress.currentStudy.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Lesson {myProgress.currentStudy.lesson} of {myProgress.currentStudy.totalLessons}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{studyProgress}%</span>
                  </div>
                  <Progress value={studyProgress} className="h-2" />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Next session: {new Date(myProgress.currentStudy.nextSession).toLocaleDateString()}</span>
                </div>
                <Link 
                  href="/dashboard/my-studies"
                  className="inline-block text-sm text-primary hover:underline"
                >
                  View all my studies →
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No active Bible study</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your teacher will assign you a study soon
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* First Steps Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Footprints className="h-5 w-5" />
              First Steps Discipleship
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{myProgress.firstSteps.completed} of {myProgress.firstSteps.total} steps completed</span>
                  <span>{firstStepsProgress}%</span>
                </div>
                <Progress value={firstStepsProgress} className="h-2" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[...Array(myProgress.firstSteps.total)].map((_, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded text-center text-xs font-medium ${
                      i < myProgress.firstSteps.completed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    Step {i + 1}
                  </div>
                ))}
              </div>
              <Link 
                href="/dashboard/my-progress"
                className="inline-block text-sm text-primary hover:underline"
              >
                View detailed progress →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Encouragement Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <blockquote className="text-center">
            <p className="text-lg italic text-foreground/80">
              &ldquo;Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.&rdquo;
            </p>
            <cite className="block mt-2 text-sm text-muted-foreground">
              — 2 Corinthians 5:17
            </cite>
          </blockquote>
        </CardContent>
      </Card>
    </div>
  );
}
