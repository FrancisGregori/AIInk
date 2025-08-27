import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { supabase } from "./supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

async function getAuthHeaders() {
  // Primero intentar obtener la sesión actual
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  const headers: HeadersInit = {};
  
  if (currentSession?.access_token) {
    headers['Authorization'] = `Bearer ${currentSession.access_token}`;
    
    // Si la sesión existe pero está cerca de expirar, intentar refrescarla
    if (currentSession.expires_at) {
      const expiresAt = new Date(currentSession.expires_at * 1000);
      const now = new Date();
      const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / 1000 / 60;
      
      // Si quedan menos de 5 minutos, intentar refrescar
      if (minutesUntilExpiry < 5) {
        const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
        if (!error && refreshedSession?.access_token) {
          headers['Authorization'] = `Bearer ${refreshedSession.access_token}`;
        }
      }
    }
  }
  
  return headers;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  
  console.log('Sending request to:', url);
  console.log('Auth headers:', authHeaders);
  
  const res = await fetch(url, {
    method,
    headers: {
      ...authHeaders,
      ...(data ? { "Content-Type": "application/json" } : {})
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(queryKey[0] as string, {
      headers: authHeaders,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
