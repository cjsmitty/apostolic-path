'use client';

import { PlatformAdminOnly } from '@/components/auth/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    ChevronRight,
    Church,
    Edit,
    GraduationCap,
    Mail,
    MapPin,
    MoreHorizontal,
    Phone,
    Settings,
    Shield,
    User,
    Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface ChurchDetail {
  id: string;
  name: string;
  slug: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  pastor: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  settings: {
    timezone: string;
  };
  subscription: {
    tier: 'free' | 'basic' | 'pro' | 'enterprise';
    status: 'active' | 'trial' | 'expired';
    expiresAt?: string;
  };
  stats: {
    totalUsers: number;
    totalStudents: number;
    totalStudies: number;
    completedStudents: number;
  };
  createdAt: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function ChurchDetailPage() {
  const params = useParams();
  const churchId = params.id as string;

  // Fetch church details
  const { data: church, isLoading } = useQuery({
    queryKey: ['admin', 'churches', churchId],
    queryFn: async () => {
      // Mock data - in real implementation, call API
      return {
        id: churchId,
        name: 'First Apostolic Church',
        slug: 'first-apostolic-dallas',
        address: {
          street: '123 Main Street',
          city: 'Dallas',
          state: 'TX',
          zip: '75201',
        },
        pastor: {
          id: 'pastor-1',
          name: 'Pastor John Smith',
          email: 'pastor.john@firstap.org',
          phone: '(555) 123-4567',
        },
        settings: {
          timezone: 'America/Chicago',
        },
        subscription: {
          tier: 'pro',
          status: 'active',
          expiresAt: '2025-12-31',
        },
        stats: {
          totalUsers: 45,
          totalStudents: 23,
          totalStudies: 12,
          completedStudents: 8,
        },
        createdAt: '2024-01-15',
      } as ChurchDetail;
    },
  });

  // Fetch church users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'churches', churchId, 'users'],
    queryFn: async () => {
      // Mock data
      return [
        { id: '1', name: 'Pastor John Smith', email: 'pastor.john@firstap.org', role: 'pastor', createdAt: '2024-01-15' },
        { id: '2', name: 'Sarah Johnson', email: 'sarah.j@firstap.org', role: 'admin', createdAt: '2024-01-20' },
        { id: '3', name: 'Mike Williams', email: 'mike.w@email.com', role: 'teacher', createdAt: '2024-02-10' },
        { id: '4', name: 'Lisa Davis', email: 'lisa.d@email.com', role: 'teacher', createdAt: '2024-02-15' },
        { id: '5', name: 'James Brown', email: 'james.b@email.com', role: 'student', createdAt: '2024-03-01' },
      ] as UserData[];
    },
  });

  const getSubscriptionBadge = (tier: string, status: string) => {
    const tierColors: Record<string, string> = {
      free: 'bg-gray-100 text-gray-700',
      basic: 'bg-blue-100 text-blue-700',
      pro: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-gold-100 text-amber-700',
    };

    return (
      <div className="flex items-center gap-2">
        <Badge className={tierColors[tier] ?? tierColors.free}>
          {tier.charAt(0).toUpperCase() + tier.slice(1)}
        </Badge>
        <Badge
          className={
            status === 'active'
              ? 'bg-green-100 text-green-700'
              : status === 'trial'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          }
        >
          {status}
        </Badge>
      </div>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      pastor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      teacher: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      member: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      student: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return <Badge className={colors[role] ?? colors.member}>{role}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-4 w-48 mb-8" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <PlatformAdminOnly showAccessDenied>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-purple-50 dark:bg-purple-900/20">
          <div className="container py-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link href="/admin" className="hover:text-foreground">
                System Admin
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/admin/churches" className="hover:text-foreground">
                Churches
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{church?.name}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-600">
                  <Church className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{church?.name}</h1>
                  <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {church?.address.city}, {church?.address.state}
                    </span>
                    <span className="mx-2">•</span>
                    {getSubscriptionBadge(
                      church?.subscription.tier ?? 'free',
                      church?.subscription.status ?? 'active'
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/admin/churches">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Link>
                </Button>
                <Button>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Church
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{church?.stats.totalUsers}</p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <GraduationCap className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{church?.stats.totalStudents}</p>
                    <p className="text-sm text-muted-foreground">Active Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <BookOpen className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{church?.stats.totalStudies}</p>
                    <p className="text-sm text-muted-foreground">Bible Studies</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{church?.stats.completedStudents}</p>
                    <p className="text-sm text-muted-foreground">Completed Journey</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Church Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Church Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">
                        {church?.address.street}
                        <br />
                        {church?.address.city}, {church?.address.state} {church?.address.zip}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Slug</p>
                      <p className="font-medium font-mono">{church?.slug}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Timezone</p>
                      <p className="font-medium">{church?.settings.timezone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {church?.createdAt ? new Date(church.createdAt).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Pastor Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pastor Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                        <User className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">{church?.pastor.name}</p>
                        <p className="text-sm text-muted-foreground">Lead Pastor</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${church?.pastor.email}`} className="hover:underline">
                        {church?.pastor.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{church?.pastor.phone}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Church Users</CardTitle>
                    <CardDescription>{users?.length ?? 0} users in this church</CardDescription>
                  </div>
                  <Button size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {users?.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {getRoleBadge(user.role)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                <DropdownMenuItem>Change Role</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  Remove from Church
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Church Settings</CardTitle>
                  <CardDescription>
                    Configure church-specific settings from the platform admin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Settings className="h-8 w-8 mr-3" />
                    <span>Settings management coming soon</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription & Billing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">Current Plan</p>
                      <div className="mt-1">
                        {getSubscriptionBadge(
                          church?.subscription.tier ?? 'free',
                          church?.subscription.status ?? 'active'
                        )}
                      </div>
                    </div>
                    <Button variant="outline">Change Plan</Button>
                  </div>

                  {church?.subscription.expiresAt && (
                    <div className="p-4 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Subscription Expires</p>
                      <p className="font-medium mt-1">
                        {new Date(church.subscription.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PlatformAdminOnly>
  );
}
