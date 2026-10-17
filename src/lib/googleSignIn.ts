// "Sign in with Google" using Google's own button (Google Identity Services).
// Google gives the browser a signed ID token, which goes to Supabase through our own domain.
// Unlike the old redirect flow, nothing ever loads from supabase.co, so it works on networks that block it.
import { supabase, GOOGLE_CLIENT_ID } from './supabase';

declare const google: any;

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.id) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Google sign-in could not load'));
    document.head.append(s);
  });
}

async function sha256Hex(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Puts Google's sign-in button into `container`. Returns false if it couldn't
 * (no Client ID set, or Google's script blocked) so the caller can keep its old button.
 */
export async function mountGoogleButton(
  container: HTMLElement,
  opts: { onSignedIn: () => void; onError: (msg: string) => void; onStart?: () => void },
): Promise<boolean> {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.startsWith('PASTE_')) return false;
  try {
    await loadScript();
  } catch {
    return false;
  }
  const raw = crypto.randomUUID() + crypto.randomUUID();
  const hashed = await sha256Hex(raw);
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    nonce: hashed,
    ux_mode: 'popup',
    use_fedcm_for_button: true,
    callback: async ({ credential }: { credential: string }) => {
      opts.onStart?.();
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: credential, nonce: raw });
      if (error) opts.onError(error.message);
      else opts.onSignedIn();
    },
  });
  const width = Math.min(Math.max(container.clientWidth || 300, 200), 400);
  google.accounts.id.renderButton(container, {
    type: 'standard', theme: 'outline', size: 'large', shape: 'pill',
    text: 'continue_with', logo_alignment: 'center', width,
  });
  return true;
}
