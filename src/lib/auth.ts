// Sign-in and profile helpers used across the site (browser only).
import { supabase } from './supabase';

export interface MyProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  birth_year: number | null;
  gender: string | null;
  nationality: string | null;
  bio: string | null;
}

export async function getUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

export async function getMyProfile(userId: string): Promise<MyProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, birth_year, gender, nationality, bio')
    .eq('id', userId)
    .maybeSingle();
  return data;
}

export const isComplete = (p: MyProfile | null) =>
  !!(p && p.display_name && p.birth_year && p.nationality);

const NEXT_KEY = 'tpn-next';

/** Send the visitor to sign in, then bring them back to `next` afterwards. */
export function goToLogin(next = location.pathname + location.search) {
  try { sessionStorage.setItem(NEXT_KEY, next); } catch {}
  location.href = '/login/';
}

/** Send the visitor to complete their profile, then back to `next`. */
export function goToAccount(next = location.pathname + location.search) {
  try { sessionStorage.setItem(NEXT_KEY, next); } catch {}
  location.href = '/account/?complete=1';
}

/** Read (and clear) the page to return to after sign-in or profile setup. */
export function takeNext(): string | null {
  try {
    const next = sessionStorage.getItem(NEXT_KEY);
    sessionStorage.removeItem(NEXT_KEY);
    // only allow paths on this site
    return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
  } catch {
    return null;
  }
}

export function peekNext(): string | null {
  try { return sessionStorage.getItem(NEXT_KEY); } catch { return null; }
}
