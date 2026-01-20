'use client';

import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/lib/auth';
import { useSwitchChurch, useUserChurches } from '@/lib/hooks';
import { Building2, Check, ChevronDown, Shield } from 'lucide-react';

export function DashboardHeader() {
  const { user, church, isAuthenticated, isLoading } = useAuthStore();
  const { data: userChurches = [], isLoading: churchesLoading } = useUserChurches();
  const switchChurch = useSwitchChurch();

  const isPlatformAdmin = user?.role === 'platform_admin';
  const hasMultipleChurches = userChurches.length > 1;

  // Don't render anything while auth is loading
  if (isLoading || !isAuthenticated) {
    return (
      <header className="h-14 border-b bg-card px-4 flex items-center justify-end">
        <Skeleton className="h-9 w-48" />
      </header>
    );
  }

  const handleSwitchChurch = async (churchId: string) => {
    if (churchId === church?.id) return;
    
    try {
      const result = await switchChurch.mutateAsync(churchId);
      if (result?.token) {
        // Update token and reload to get fresh data
        localStorage.setItem('auth_token', result.token);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to switch church:', error);
    }
  };

  return (
    <header className="h-14 border-b bg-card px-4 flex items-center justify-end">
      <div className="flex items-center gap-4">
        {/* Platform Admin Badge */}
        {isPlatformAdmin && (
          <Badge variant="outline" className="gap-1 border-amber-500 text-amber-600">
            <Shield className="h-3 w-3" />
            Platform Admin
          </Badge>
        )}

        {/* Church Selector or Display */}
        {hasMultipleChurches ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="font-semibold">{church?.name || 'Select Church'}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Switch Church</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {userChurches.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onClick={() => handleSwitchChurch(c.id)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{c.name}</span>
                    {c.address?.city && c.address?.state && (
                      <span className="text-xs text-muted-foreground">
                        {c.address.city}, {c.address.state}
                      </span>
                    )}
                  </div>
                  {c.id === church?.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted/30">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="font-semibold">{church?.name || 'No Church'}</span>
          </div>
        )}
      </div>
    </header>
  );
}
