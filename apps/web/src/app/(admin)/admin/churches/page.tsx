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
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import {
    Building2,
    ChevronRight,
    Church,
    Filter,
    MapPin,
    MoreHorizontal,
    Plus,
    Search,
    Users,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface ChurchData {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  pastorName: string;
  userCount: number;
  studentCount: number;
  status: 'active' | 'inactive' | 'trial';
  createdAt: string;
}

export default function ChurchesListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Fetch all churches
  const { data: churches, isLoading } = useQuery({
    queryKey: ['admin', 'churches'],
    queryFn: async () => {
      // Mock data - in real implementation, call API
      return [
        {
          id: '1',
          name: 'First Apostolic Church',
          slug: 'first-apostolic-dallas',
          city: 'Dallas',
          state: 'TX',
          pastorName: 'Pastor John Smith',
          userCount: 45,
          studentCount: 23,
          status: 'active',
          createdAt: '2024-01-15',
        },
        {
          id: '2',
          name: 'New Life UPC',
          slug: 'new-life-upc-houston',
          city: 'Houston',
          state: 'TX',
          pastorName: 'Pastor Michael Johnson',
          userCount: 32,
          studentCount: 15,
          status: 'active',
          createdAt: '2024-02-20',
        },
        {
          id: '3',
          name: 'Truth Tabernacle',
          slug: 'truth-tabernacle-austin',
          city: 'Austin',
          state: 'TX',
          pastorName: 'Pastor David Williams',
          userCount: 28,
          studentCount: 12,
          status: 'active',
          createdAt: '2024-03-10',
        },
        {
          id: '4',
          name: 'Pentecostal Church of God',
          slug: 'pcog-san-antonio',
          city: 'San Antonio',
          state: 'TX',
          pastorName: 'Pastor Robert Brown',
          userCount: 21,
          studentCount: 8,
          status: 'trial',
          createdAt: '2024-06-01',
        },
        {
          id: '5',
          name: 'Living Waters Apostolic',
          slug: 'living-waters-phoenix',
          city: 'Phoenix',
          state: 'AZ',
          pastorName: 'Pastor James Davis',
          userCount: 56,
          studentCount: 31,
          status: 'active',
          createdAt: '2023-11-20',
        },
        {
          id: '6',
          name: 'Grace Apostolic Temple',
          slug: 'grace-apostolic-okc',
          city: 'Oklahoma City',
          state: 'OK',
          pastorName: 'Pastor William Thompson',
          userCount: 0,
          studentCount: 0,
          status: 'inactive',
          createdAt: '2024-04-15',
        },
      ] as ChurchData[];
    },
  });

  // Filter churches
  const filteredChurches = churches?.filter((church) => {
    const matchesSearch =
      !searchQuery ||
      church.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      church.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      church.pastorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || church.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>;
      case 'trial':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Trial</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400">Inactive</Badge>;
      default:
        return null;
    }
  };

  return (
    <PlatformAdminOnly showAccessDenied>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-purple-50 dark:bg-purple-900/20">
          <div className="container py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Link href="/admin" className="hover:text-foreground">
                    System Admin
                  </Link>
                  <ChevronRight className="h-4 w-4" />
                  <span>Churches</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">All Churches</h1>
                <p className="text-muted-foreground mt-1">
                  Manage all churches on the platform
                </p>
              </div>
              <Button asChild>
                <Link href="/admin/churches/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Church
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="container py-8 space-y-6">
          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search churches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  {statusFilter ? `Status: ${statusFilter}` : 'All Statuses'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('trial')}>
                  Trial
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('inactive')}>
                  Inactive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Stats Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Building2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{churches?.length ?? 0}</p>
                    <p className="text-sm text-muted-foreground">Total Churches</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Church className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {churches?.filter((c) => c.status === 'active').length ?? 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                    <Church className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {churches?.filter((c) => c.status === 'trial').length ?? 0}
                    </p>
                    <p className="text-sm text-muted-foreground">On Trial</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {churches?.reduce((acc, c) => acc + c.userCount, 0) ?? 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Churches List */}
          <Card>
            <CardHeader>
              <CardTitle>Churches</CardTitle>
              <CardDescription>
                {filteredChurches?.length ?? 0} churches found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-48 mb-2" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : filteredChurches?.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold">No churches found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter
                      ? 'Try adjusting your filters'
                      : 'Get started by adding your first church'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredChurches?.map((church) => (
                    <div
                      key={church.id}
                      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Church className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/churches/${church.id}`}
                            className="font-semibold hover:underline truncate"
                          >
                            {church.name}
                          </Link>
                          {getStatusBadge(church.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {church.city}, {church.state}
                          </span>
                          <span>{church.pastorName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-semibold">{church.userCount}</p>
                          <p className="text-muted-foreground">Users</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{church.studentCount}</p>
                          <p className="text-muted-foreground">Students</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/churches/${church.id}`}>
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Edit Church</DropdownMenuItem>
                          <DropdownMenuItem>Manage Users</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PlatformAdminOnly>
  );
}
