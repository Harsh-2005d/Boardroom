import '../env.js';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn('Supabase is not configured. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.');
}

export const supabase = createClient(url || 'http://127.0.0.1:54321', key || 'missing-key', {
  auth: { autoRefreshToken: false, persistSession: false }
});
export function userClient(token) {
  return createClient(url || 'http://127.0.0.1:54321', key || 'missing-key', {
    auth: { autoRefreshToken: false, persistSession: false },
     global: { headers: { Authorization: `Bearer ${token}` } }
  });
}
