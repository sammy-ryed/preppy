import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

let client: SupabaseClient | undefined;

// Lazy initialization lets Valli run the UI scaffold before backend configuration exists.
export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) throw new Error('Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to mobile/.env, then restart Expo.');
  if (!key.startsWith('sb_publishable_')) throw new Error('Use a Supabase publishable key (sb_publishable_), never a secret or service-role key.');
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname))) throw new Error('Supabase URL must use HTTPS (except local development).');
  const created = createClient(url, key, {
    auth: { ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}), persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  if (Platform.OS !== 'web') {
    if (AppState.currentState === 'active') void created.auth.startAutoRefresh();
    else void created.auth.stopAutoRefresh();
    AppState.addEventListener('change', state => {
      if (state === 'active') void created.auth.startAutoRefresh();
      else void created.auth.stopAutoRefresh();
    });
  }
  client = created;
  return created;
}
