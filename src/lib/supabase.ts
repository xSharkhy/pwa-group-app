import { createClient } from '@supabase/supabase-js';

// For client-side access in Astro/Vite, env vars need PUBLIC_ prefix
const supabaseUrl =
  import.meta.env.PUBLIC_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  '';

const supabasePublishableKey =
  import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  '';

// Create Supabase client with the Publishable key (safe for client-side)
export const supabase = createClient(supabaseUrl, supabasePublishableKey);
