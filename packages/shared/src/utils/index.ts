/**
 * Shared Utility Functions
 */

/**
 * Generate a URL-friendly slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Format a user's full name
 */
export function formatName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

/**
 * Calculate New Birth completion percentage
 */
export function calculateNewBirthProgress(status: {
  repentance: { completed: boolean };
  baptism: { completed: boolean };
  holyGhost: { completed: boolean };
}): number {
  const completed = [status.repentance.completed, status.baptism.completed, status.holyGhost.completed].filter(
    Boolean
  ).length;
  return Math.round((completed / 3) * 100);
}

/**
 * Calculate First Steps completion percentage
 */
export function calculateFirstStepsProgress(progress: Record<string, { completed: boolean }>): number {
  const steps = Object.values(progress);
  const completed = steps.filter(step => step.completed).length;
  return Math.round((completed / steps.length) * 100);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Check if a user has one of the required roles
 */
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Capitalize first letter of each word
 */
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
