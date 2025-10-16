import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

console.log('[Supabase] Initializing Supabase client...');
console.log('[Supabase] URL configured:', supabaseUrl ? 'Yes' : 'No');
console.log('[Supabase] Anon key configured:', supabaseAnonKey ? 'Yes' : 'No');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] CRITICAL: Missing Supabase configuration!');
  console.error('[Supabase] URL:', supabaseUrl);
  console.error('[Supabase] Key:', supabaseAnonKey ? '[REDACTED]' : 'undefined');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log('[Supabase] Client initialized successfully');
