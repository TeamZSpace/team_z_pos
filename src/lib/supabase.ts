import { createClient } from '@supabase/supabase-js';

const cleanValue = (val: string | undefined) => {
  if (!val) return undefined;
  let cleaned = val.trim();
  
  // If it looks like a .env line (e.g. KEY=VALUE), take the VALUE
  // But only if it doesn't start with http (to avoid splitting URLs with query params if any)
  if (cleaned.includes('=') && !cleaned.startsWith('http')) {
    const parts = cleaned.split('=');
    cleaned = parts[parts.length - 1].trim();
  }
  
  // Take only the first part if multiple values are separated by spaces or newlines
  const parts = cleaned.split(/[\s\n]+/);
  cleaned = parts[0] || '';
  
  // Remove quotes if they exist (common when copying from .env files)
  cleaned = cleaned.replace(/^["']|["']$/g, '');
  
  return cleaned || undefined;
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

// Auto-fix URL if missing protocol
let finalUrl = supabaseUrl;
if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
  finalUrl = 'https://' + finalUrl;
}

export const supabase = (isValidUrl(finalUrl) && supabaseAnonKey) 
  ? createClient(finalUrl!, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = () => !!supabase;
