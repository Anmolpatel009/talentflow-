import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // DEBUG: Log to browser console
  console.log("[Supabase Client] URL:", supabaseUrl ? "Set" : "MISSING");
  console.log("[Supabase Client] Key:", supabaseKey ? "Set" : "MISSING");

  if (!supabaseUrl || !supabaseKey) {
    console.error("[Supabase Client] ERROR: Missing environment variables!");
    console.error("[Supabase Client] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl);
    console.error("[Supabase Client] NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseKey ? "[PRESENT]" : "[MISSING]");
    throw new Error("Supabase URL or Key is missing. Check your .env.local file.");
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
}

// For backward compatibility
export const supabase = createClient()
