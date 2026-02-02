import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabasePublishableKey = import.meta.env.SUPABASE_PUBLISHABLE_KEY || import.meta.env.SUPABASE_ANON_KEY || '';

// Create Supabase client with the Publishable key (safe for client-side)
// Type safety is enforced at the component level with explicit types
export const supabase = createClient(supabaseUrl, supabasePublishableKey);
