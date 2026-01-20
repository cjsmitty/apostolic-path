'use client';

import { ManagerOnly } from '@/components/auth/role-guard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
    getRoleBadgeColor,
    getRoleDisplayName,
    useIsAdmin,
    useUserRole
} from '@/hooks/use-permissions';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useUsers } from '@/lib/hooks';
import type { User, UserRole } from '@apostolic-path/shared';
import { useQueryClient } from '@tanstack/react-query';
import {
    Mail,
    MoreHorizontal,
    Phone,
    Search,
    UserPlus,
    Users
} from 'lucide-react';
import { useMemo, useState } from 'react';

const ASSIGNABLE_ROLES: UserRole[] = ['admin', 'pastor', 'teacher', 'member', 'student'];

export default function UserManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useUsers();
  const currentUserRole = useUserRole();
  const isAdmin = useIsAdmin();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'member' as UserRole,
  });

  // Filter users based on search and role filter
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter((user) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower);
      
      // Role filter
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Group users by role
  const usersByRole = useMemo(() => {
    const grouped: Record<string, User[]> = {};
    filteredUsers.forEach((user) => {
      const role = user.role || 'unknown';
      if (!grouped[role]) {
        grouped[role] = [];
      }
      grouped[role].push(user);
    });
    return grouped;
  }, [filteredUsers]);

  const handleCreateUser = async () => {
    setIsCreating(true);
    try {
      const response = await api.post('/users', newUser);
      
      if (response.success) {
        toast({
          title: 'User created',
          description: `${newUser.firstName} ${newUser.lastName} has been added.`,
        });
        setIsCreateDialogOpen(false);
        setNewUser({
          email: '',
          firstName: '',
          lastName: '',
          phone: '',
          role: 'member',
        });
        queryClient.invalidateQueries({ queryKey: ['users'] }); // Refresh user list
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      const response = await api.patch(`/users/${userId}`, { role: newRole });
      
      if (response.success) {
        toast({
          title: 'Role updated',
          description: 'User role has been updated successfully.',
        });
        queryClient.invalidateQueries({ queryKey: ['users'] });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update role. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  // Roles that current user can assign
  const assignableRoles = ASSIGNABLE_ROLES.filter((role) => {
    if (!currentUserRole) return false;
    // Simple check - in real app, use canAssignRole from shared
    if (currentUserRole === 'platform_admin') return true;
    if (currentUserRole === 'admin') return role !== 'platform_admin';
    if (currentUserRole === 'pastor') return ['teacher', 'member', 'student'].includes(role);
    return false;
  });

  return (
    <ManagerOnly showAccessDenied>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Manage users and their roles in your church.
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account for your church.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newUser.firstName}
                      onChange={(e) =>
                        setNewUser((prev) => ({ ...prev, firstName: e.target.value }))
                      }
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newUser.lastName}
                      onChange={(e) =>
                        setNewUser((prev) => ({ ...prev, lastName: e.target.value }))
                      }
                      placeholder="Smith"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) =>
                      setNewUser((prev) => ({ ...prev, role: value as UserRole }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {getRoleDisplayName(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateUser} disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {ASSIGNABLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {getRoleDisplayName(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* User Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { role: 'admin', label: 'Admins', color: 'text-blue-600' },
            { role: 'pastor', label: 'Pastors', color: 'text-green-600' },
            { role: 'teacher', label: 'Teachers', color: 'text-yellow-600' },
            { role: 'student', label: 'Students', color: 'text-orange-600' },
          ].map(({ role, label, color }) => (
            <Card key={role}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {label}
                  <Users className={`h-4 w-4 ${color}`} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <div className="text-2xl font-bold">
                    {usersByRole[role]?.length ?? 0}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User List */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        {!user.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge className={getRoleBadgeColor(user.role as UserRole)}>
                      {getRoleDisplayName(user.role as UserRole)}
                    </Badge>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit User</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                          {assignableRoles.map((role) => (
                            <DropdownMenuItem
                              key={role}
                              disabled={user.role === role}
                              onClick={() => handleUpdateRole(user.id, role)}
                            >
                              {getRoleDisplayName(role)}
                              {user.role === role && ' (current)'}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Deactivate User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No users found</p>
                <p className="text-muted-foreground">
                  {searchQuery || roleFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Add your first user to get started'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ManagerOnly>
  );
}
