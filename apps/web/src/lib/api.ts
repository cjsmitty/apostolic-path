/**
 * API client configuration and utilities
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  nextCursor?: string;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error?.code || 'UNKNOWN_ERROR',
      data.error?.message || 'An unexpected error occurred',
      response.status
    );
  }

  return data;
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};

  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  get: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });
    return handleResponse<T>(response);
  },

  post: async <T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> => {
    const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  patch: async <T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> => {
    const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  },

  delete: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });
    return handleResponse<T>(response);
  },
};
