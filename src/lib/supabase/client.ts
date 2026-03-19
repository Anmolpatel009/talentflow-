import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // DEBUG: These will show in your Browser Console (F12)
  if (!supabaseUrl || !supabaseKey) {
    console.error("[Supabase Client] MISSING ENV VARIABLES");
  }

  // This is the CRITICAL change. 
  // It ensures the session is saved in cookies so the Middleware can see it.
  return createClientComponentClient();
}

// For backward compatibility in your components
export const supabase = createClient();