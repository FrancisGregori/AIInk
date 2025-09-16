import { auth } from '@/lib/firebaseConfig';

// Use VITE_API_URL in production, empty string in development (same origin)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface CreditsData {
  available: number;
  monthlyAllowance: number;
  used: number;
  subscriptionTier: string;
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch(url: string, options: FetchOptions = {}) {
  const { skipAuth = false, ...fetchOptions } = options;

  // Initialize headers
  const headers = new Headers(fetchOptions.headers);

  // Add auth token if user is authenticated and not skipped
  if (!skipAuth && auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers.set('Authorization', `Bearer ${token}`);
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
  }

  // Construct full URL with API base
  const fullUrl = API_BASE_URL + url;

  // Make the request
  return await fetch(fullUrl, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });
}

export async function apiRequest<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  const response = await apiFetch(url, options);

  if (!response.ok) {
    const error = await response.text().catch(() => 'Request failed');
    throw new Error(error);
  }

  return response.json();
}