import { supabase } from '../lib/supabase';

const configuredBaseURL = import.meta.env.VITE_API_URL?.trim();
const baseURL = (configuredBaseURL || (import.meta.env.DEV ? 'http://localhost:4000' : '')).replace(/\/$/, '');
export async function api(path, options = {}) {
  if (!baseURL) throw new Error('API URL is not configured. Set VITE_API_URL in Vercel and redeploy the frontend.');
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${baseURL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...options.headers
    }
  });
  if (response.status === 204) return null;
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.');
  return result;
}
export const json = (method, body) => ({ method, body: JSON.stringify(body) });
