import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * 1. For App Router (Route Handlers, Server Actions, & Server Components)
 * This is the primary client for Next.js 14 App Router.
 * It uses 'next/headers' to handle session cookies automatically.
 */
export function createServerSupabaseClient() {
  // Reality Check: In Next.js 14, cookies() must be called inside the request scope.
  return createRouteHandlerClient({ cookies })
}

/**
 * 2. Service Role Client (STRICTLY SERVER-SIDE)
 * Used for admin tasks that bypass Row Level Security (RLS).
 * CAUTION: Do not use this for general user operations.
 */
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

/**
 * 3. For Pages Router (Legacy API Routes)
 * Only use if you have files under /pages/api/
 */
export function createPagesServerSupabaseClient(
  ctx: { req: NextApiRequest; res: NextApiResponse }
) {
  return createPagesServerClient(ctx)
}

/**
 * Alias for clarity in Server Components
 */
export const createServerComponentClient = createServerSupabaseClient;