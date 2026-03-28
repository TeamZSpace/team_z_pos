import { createClient } from '@supabase/supabase-js';

const cleanValue = (val: string | undefined) => {
  if (!val) return undefined;
  // Take only the first part if multiple values are separated by spaces or newlines
  const parts = val.trim().split(/[\s\n]+/);
  return parts[0] || undefined;
};

const supabaseUrl = cleanValue(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = cleanValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

// Robust check to ensure URL is valid before initializing
const isValidUrl = (url: string | undefined) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const supabase = (isValidUrl(supabaseUrl) && supabaseAnonKey) 
  ? createClient(supabaseUrl!, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = () => !!supabase;
