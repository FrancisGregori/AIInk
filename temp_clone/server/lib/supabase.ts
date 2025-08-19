import { createClient } from '@supabase/supabase-js';

if (!process.env.VITE_SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
}

// Server-side Supabase client with service role key
export const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Ensure bucket exists
async function ensureBucketExists() {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  
  if (listError) {
    console.error('Error listing buckets:', listError);
    return;
  }
  
  console.log('Available buckets:', buckets?.map(b => b.name));
  
  // Try to use 'avatars' bucket if it exists, otherwise create 'tattoo-renders'
  const avatarsBucket = buckets?.find(b => b.name === 'avatars');
  const tattooRendersBucket = buckets?.find(b => b.name === 'tattoo-renders');
  
  if (avatarsBucket) {
    console.log('Using existing avatars bucket for renders');
    return 'avatars';
  } else if (tattooRendersBucket) {
    console.log('Using existing tattoo-renders bucket');
    return 'tattoo-renders';
  } else {
    console.log('Creating tattoo-renders bucket...');
    const { data, error } = await supabaseAdmin.storage.createBucket('tattoo-renders', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 52428800 // 50MB
    });
    
    if (error) {
      console.error('Error creating bucket:', error);
      // If creation fails, try to use any existing public bucket
      const publicBucket = buckets?.find(b => b.public === true);
      if (publicBucket) {
        console.log(`Using fallback bucket: ${publicBucket.name}`);
        return publicBucket.name;
      }
    } else {
      console.log('tattoo-renders bucket created successfully');
      return 'tattoo-renders';
    }
  }
  return null;
}

// Initialize bucket on startup and export the bucket name
export let STORAGE_BUCKET = 'avatars'; // Default

ensureBucketExists().then(bucketName => {
  if (bucketName) {
    STORAGE_BUCKET = bucketName;
    console.log(`Storage bucket set to: ${STORAGE_BUCKET}`);
  }
}).catch(console.error);

// Types
export interface UserGallery {
  id?: string;
  user_id: string;
  app_type: 'ai' | 'stencil';
  image_url: string;
  prompt?: string;
  metadata?: any;
  created_at?: string;
}