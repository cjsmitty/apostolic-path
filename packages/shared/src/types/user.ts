/**
 * User Entity
 *
 * Represents any user in the system - from pastors to students.
 */

/**
 * User roles in the system:
 * - platform_admin: Can manage all churches and system-wide settings (super admin)
 * - admin: Church-level admin, full access within their church
 * - pastor: Can manage their church(es) and view all data
 * - teacher: Can manage assigned studies and students
 * - member: Regular church member with limited access
 * - student: Someone going through the discipleship journey
 */
export type UserRole = 'platform_admin' | 'admin' | 'pastor' | 'teacher' | 'member' | 'student';

export interface User {
  id: string;
  churchId: string; // Primary/current church context
  churchIds?: string[]; // All churches user has access to (for multi-church pastors)
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User with password hash - only used server-side for auth
 */
export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface ListUsersOptions {
  role?: string;
  limit?: number;
  cursor?: string;
}
