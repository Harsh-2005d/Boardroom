import { createClient } from '@supabase/supabase-js';

const configuredUrl = import.meta.env.VITE_SUPABASE_URL;
const configuredKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabaseConfigError = !configuredUrl || !configuredKey
  ? 'Supabase frontend configuration is missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel, then redeploy.'
  : '';

export const supabase = createClient(
  configuredUrl || (import.meta.env.DEV ? 'http://127.0.0.1:54321' : 'https://missing-supabase-config.invalid'),
  configuredKey || 'missing-publishable-key'
);
