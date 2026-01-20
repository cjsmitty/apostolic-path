/**
 * Church (Tenant) Entity
 *
 * The top-level entity in the multi-tenant architecture.
 * All other entities belong to a church.
 */

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface ChurchSettings {
  timezone: string;
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  enabledCurriculums: string[];
  customFields?: Record<string, string>;
}

export type SubscriptionTier = 'free' | 'starter' | 'growth' | 'enterprise';

export interface Church {
  id: string;
  name: string;
  slug: string;
  address: Address;
  pastorId: string;
  pastorName?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  settings: ChurchSettings;
  subscription: SubscriptionTier;
  createdAt: string;
  updatedAt: string;
}

export interface ChurchStats {
  totalStudents: number;
  activeStudies: number;
  completedJourneys: number;
  baptismsThisMonth: number;
  holyGhostThisMonth: number;
}
