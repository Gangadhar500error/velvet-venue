/**
 * API utility functions for making authenticated requests
 */

const getApiBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';
};

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('auth_token');
};

interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | null | undefined>;
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;
  const token = getAuthToken();
  const baseUrl = getApiBaseUrl();

  // Build URL with query parameters
  let url = `${baseUrl}${endpoint}`;
  if (params) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Set default headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Include cookies for session-based auth
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `HTTP error! status: ${response.status}`,
    }));
    throw new Error(errorData.message || errorData.error || 'API request failed');
  }

  return response.json();
}

/**
 * Fetch users (colleges) with pagination, sorting, and search
 */
export interface FetchUsersParams {
  search?: string;
  column?: string;
  dir?: 'asc' | 'desc';
  length?: number;
  draw?: number;
  page?: number;
}

export interface UserData {
  id: number;
  name: string;
  user_name: string;
  email: string;
  status: string;
  slug: string;
  role?: {
    id?: number;
    title?: string;
    slug?: string;
  };
  contact_type?: {
    id?: number;
    title?: string;
  };
}

export interface UsersResponse {
  data: UserData[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
  };
  payload: Record<string, any>;
}

export async function fetchUsers(
  params: FetchUsersParams = {}
): Promise<UsersResponse> {
  const {
    search = '',
    column = 'id',
    dir = 'desc',
    length = 10,
    draw = 1,
    page = 1,
  } = params;

  return apiRequest<UsersResponse>('/v1/users', {
    params: {
      search: search || undefined,
      column,
      dir,
      length,
      draw,
      page,
    },
  });
}

