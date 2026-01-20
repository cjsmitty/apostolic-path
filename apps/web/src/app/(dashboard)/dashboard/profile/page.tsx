'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
    getRoleBadgeColor,
    getRoleDisplayName,
    useIsPlatformAdmin,
    useUserRole,
} from '@/hooks/use-permissions';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import {
    Building2,
    Calendar,
    Mail,
    Phone,
    Save,
    Shield,
    User,
} from 'lucide-react';
import { useState } from 'react';

export default function ProfilePage() {
  const { user, church, setUser } = useAuthStore();
  const { toast } = useToast();
  const userRole = useUserRole();
  const isPlatformAdmin = useIsPlatformAdmin();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: user?.phone ?? '',
  });

  const handleSave = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const response = await api.patch(`/users/${user.id}`, formData);
      
      if (response.success && response.data) {
        setUser(response.data as typeof user);
        setIsEditing(false);
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          View and manage your account information.
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-2xl">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {user.firstName} {user.lastName}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  {userRole && (
                    <Badge className={getRoleBadgeColor(userRole)}>
                      {getRoleDisplayName(userRole)}
                    </Badge>
                  )}
                  {isPlatformAdmin && (
                    <Badge variant="outline" className="border-purple-500 text-purple-600">
                      <Shield className="h-3 w-3 mr-1" />
                      System Admin
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {!isEditing && (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Separator className="mb-6" />
          
          {isEditing ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      firstName: user.firstName,
                      lastName: user.lastName,
                      phone: user.phone ?? '',
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{user.phone || 'Not set'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Church</p>
                    <p className="font-medium">{church?.name || 'Not assigned'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium">
                      {userRole ? getRoleDisplayName(userRole) : 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Security Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>
            Manage your password and security settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground">
                Last changed: Unknown
              </p>
            </div>
            <Button variant="outline">Change Password</Button>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Church Access (if applicable) */}
      {user.churchIds && user.churchIds.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Church Access</CardTitle>
            <CardDescription>
              You have access to multiple churches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user.churchIds.map((churchId, index) => (
                <div
                  key={churchId}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <span>Church {index + 1}</span>
                    {churchId === user.churchId && (
                      <Badge variant="secondary">Current</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
