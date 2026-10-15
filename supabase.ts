import { createClient } from '@supabase/supabase-js';

// Publishable key only – safe to be public. Never put the secret key here.
const SUPABASE_URL = 'https://waorryrsgdfvhujreuvq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xZ4nFS-OrOyHDu8kkzJVYg_0y4I4ogh';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
