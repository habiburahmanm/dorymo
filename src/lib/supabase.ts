import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://itclpepebcnxwbsltuzs.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_y2dzG9RdTN-GNHMGJpZf2Q_VVD5Bhrw';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const isPlaceholderUrl =
  !rawUrl ||
  rawUrl.includes('placeholder') ||
  rawUrl.includes('your-project-id') ||
  rawUrl.includes('your-supabase-project');

const isPlaceholderKey =
  !rawAnonKey ||
  rawAnonKey.includes('placeholder') ||
  rawAnonKey.includes('your-anon-public-key');

const supabaseUrl = isPlaceholderUrl ? DEFAULT_SUPABASE_URL : rawUrl;
const supabaseAnonKey = isPlaceholderKey ? DEFAULT_SUPABASE_ANON_KEY : rawAnonKey;

/** .env বা ডিফল্ট ক্রেডেনশিয়াল সক্রিয় কি না */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    /^https?:\/\/.+\.supabase\.co/.test(supabaseUrl) &&
    !supabaseUrl.includes('placeholder')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'dorymo.auth',
  },
});
