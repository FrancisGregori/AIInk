import { createClient } from '@supabase/supabase-js';

if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL');
}

if (!import.meta.env.VITE_SUPABASE_KEY) {
  throw new Error('Missing VITE_SUPABASE_KEY');
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY
);

// Types for our database
export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  subscription_plan?: 'free' | 'basic' | 'pro' | 'premium';
  can_access_ai?: boolean;
  can_access_stencil?: boolean;
}

export interface Gallery {
  id: string;
  user_id: string;
  app_type: 'ai' | 'stencil';
  image_url: string;
  prompt?: string;
  created_at: string;
  metadata?: any;
}