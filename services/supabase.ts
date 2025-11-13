// FIX: Added a triple-slash directive to include Vite client types, which defines `import.meta.env` for TypeScript.
/// <reference types="vite/client" />

import { createClient } from '@supabase/supabase-js';

// These variables would be in a .env.local file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is missing. Please check your .env.local file.");
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce'
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        }
    }
});