import { createPagesServerClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextApiRequest, NextApiResponse } from 'next'
import { cookies } from 'next/headers'

// Define these at the top level so all functions can see them
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 1. For App Router (API Routes/Server Actions)
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createRouteHandlerClient({ cookies: () => cookieStore })
}

// 2. For Pages Router API routes
export function createPagesServerSupabaseClient(
  ctx: { req: NextApiRequest; res: NextApiResponse }
) {
  return createPagesServerClient(ctx)
}

// 3. Service Role Client (STRICTLY SERVER-SIDE)
export function createServiceRoleClient() {
  return createSupabaseClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// 4. Server Component Client (For read-only operations)
export function createServerClientWithUser() {
  return createSupabaseClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}