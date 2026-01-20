/**
 * Common Types
 *
 * Shared utility types used across the application.
 */

export interface PaginatedResult<T> {
  items: T[];
  nextCursor?: string;
  total?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiPaginatedResponse<T> extends ApiResponse<T[]> {
  nextCursor?: string;
  total?: number;
}
