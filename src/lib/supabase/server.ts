import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server client with service role (bypasses RLS - use carefully)
export const createServerSupabaseClient = (): SupabaseClient => {
  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Server client with user context (respects RLS)
export const createServerClientWithUser = async (): Promise<SupabaseClient> => {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
  
  const client = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // If we have an access token, set it
  if (accessToken) {
    await client.auth.setSession({
      access_token: accessToken,
      refresh_token: ''
    })
  }

  return client
}

// Legacy export
export const supabaseServer = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
