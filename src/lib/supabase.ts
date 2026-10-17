import { createClient } from '@supabase/supabase-js';

// Publishable key only – safe to be public. Never put the secret key here.
const SUPABASE_DIRECT = 'https://waorryrsgdfvhujreuvq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xZ4nFS-OrOyHDu8kkzJVYg_0y4I4ogh';

// On the live site, talk to Supabase through our own domain (functions/*/v1 forward it).
// Some internet providers block *.supabase.co, and this keeps the site working for those visitors.
// Locally (npm run dev) and during the build there is no forwarder, so connect directly.
const onLiveSite =
  typeof location !== 'undefined' &&
  /(^|\.)trekkingpartnersnepal\.com$|\.pages\.dev$/.test(location.hostname);

export const SUPABASE_URL = onLiveSite ? location.origin : SUPABASE_DIRECT;
export const SUPABASE_DIRECT_URL = SUPABASE_DIRECT;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  // Keep the same saved-login name as before, so nobody is signed out by this change
  auth: { storageKey: 'sb-waorryrsgdfvhujreuvq-auth-token' },
});

// Google OAuth Client ID (public). Used for "Sign in with Google" without leaving the site,
// so the sign-in also works where supabase.co is blocked.
export const GOOGLE_CLIENT_ID = '268906737904-fmjkvbh644j8l1djcle9ngpuhluanqs1.apps.googleusercontent.com';
