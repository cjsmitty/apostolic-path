'use client';

import { AdminOnly } from '@/components/auth/role-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import {
    Building2,
    Globe,
    Mail,
    MapPin,
    Phone,
    Save,
    User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ChurchSettingsPage() {
  const router = useRouter();
  const { church } = useAuthStore();
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: church?.name ?? '',
    pastorName: church?.pastorName ?? '',
    email: church?.email ?? '',
    phone: church?.phone ?? '',
    website: church?.website ?? '',
    street: church?.address?.street ?? '',
    city: church?.address?.city ?? '',
    state: church?.address?.state ?? '',
    zip: church?.address?.zip ?? '',
    country: church?.address?.country ?? 'USA',
  });

  const handleSave = async () => {
    if (!church) return;
    
    setIsSaving(true);
    try {
      const response = await api.patch(`/churches/${church.id}`, {
        name: formData.name,
        pastorName: formData.pastorName,
        email: formData.email,
        phone: formData.phone,
        website: formData.website,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
        },
      });
      
      if (response.success) {
        toast({
          title: 'Church updated',
          description: 'Church settings have been updated successfully.',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update church settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminOnly showAccessDenied>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Church Settings</h1>
            <p className="text-muted-foreground">
              Manage your church information and preferences.
            </p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              General information about your church.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Church Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="First Apostolic Church"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pastorName">Pastor Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pastorName"
                    value={formData.pastorName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, pastorName: e.target.value }))
                    }
                    placeholder="Pastor John Smith"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Information
            </CardTitle>
            <CardDescription>
              How people can reach your church.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="church@example.com"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="(555) 123-4567"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, website: e.target.value }))
                  }
                  placeholder="https://www.yourchurch.com"
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Address
            </CardTitle>
            <CardDescription>
              Your church&apos;s physical location.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, street: e.target.value }))
                }
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, state: e.target.value }))
                  }
                  placeholder="CA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={formData.zip}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, zip: e.target.value }))
                  }
                  placeholder="12345"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions. Please be careful.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Church</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this church and all associated data.
                </p>
              </div>
              <Button variant="destructive" disabled>
                Delete Church
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminOnly>
  );
}
