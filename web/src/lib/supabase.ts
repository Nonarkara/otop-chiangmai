import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = (supabaseUrl && supabaseAnon)
  ? createClient(supabaseUrl, supabaseAnon)
  : null;

function isLoopback(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/** A loopback database is only reachable from this machine. A public page must not call it. */
export const isSupabaseEnabled = () => {
  if (!supabase || !supabaseUrl) return false;
  if (typeof window === 'undefined') return false;
  try {
    const apiHost = new URL(supabaseUrl).hostname;
    if (isLoopback(apiHost) && !isLoopback(window.location.hostname)) return false;
  } catch {
    return false;
  }
  return true;
};
