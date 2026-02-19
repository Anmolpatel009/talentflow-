import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Generate a 4-digit OTP
function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get the authorization header or cookies
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value ||
                        cookieStore.get('supabase-auth-token')?.value
    
    // Get user from the access token in the request
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || accessToken
    
    let user = null
    if (token) {
      const { data } = await supabase.auth.getUser(token)
      user = data.user
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, otpType } = body

    if (!taskId || !otpType) {
      return NextResponse.json({ error: 'Task ID and OTP type required' }, { status: 400 })
    }

    if (!['start', 'end'].includes(otpType)) {
      return NextResponse.json({ error: 'OTP type must be "start" or "end"' }, { status: 400 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, status, client_id, mode')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Only client can generate OTP
    if (task.client_id !== profile.id) {
      return NextResponse.json({ error: 'Only the client can generate OTP' }, { status: 403 })
    }

    // Validate task status for OTP generation
    if (otpType === 'start' && task.status !== 'assigned') {
      return NextResponse.json({ 
        error: 'Task must be assigned to generate start OTP',
        status: task.status
      }, { status: 400 })
    }

    if (otpType === 'end' && task.status !== 'in_progress') {
      return NextResponse.json({ 
        error: 'Task must be in progress to generate end OTP',
        status: task.status
      }, { status: 400 })
    }

    // Check if there's an existing unused OTP
    const { data: existingOTP } = await supabase
      .from('otps')
      .select('*')
      .eq('task_id', taskId)
      .eq('otp_type', otpType)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (existingOTP) {
      return NextResponse.json({ 
        otp: existingOTP.otp,
        otpType,
        expiresAt: existingOTP.expires_at,
        message: 'Existing valid OTP returned'
      })
    }

    // Generate new OTP
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes expiry

    const { data: otpRecord, error: otpError } = await supabase
      .from('otps')
      .insert({
        task_id: taskId,
        otp,
        otp_type: otpType,
        is_used: false,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (otpError) {
      console.error('OTP creation error:', otpError)
      return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 })
    }

    return NextResponse.json({ 
      otp: otpRecord.otp,
      otpType,
      expiresAt: otpRecord.expires_at,
      message: 'OTP generated successfully'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Verify OTP
export async function GET(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get the authorization header or cookies
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value ||
                        cookieStore.get('supabase-auth-token')?.value
    
    // Get user from the access token in the request
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || accessToken
    
    let user = null
    if (token) {
      const { data } = await supabase.auth.getUser(token)
      user = data.user
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const otp = searchParams.get('otp')
    const otpType = searchParams.get('otpType')

    if (!taskId || !otp || !otpType) {
      return NextResponse.json({ error: 'Task ID, OTP, and OTP type required' }, { status: 400 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if user is the assigned freelancer
    const { data: handshake } = await supabase
      .from('task_handshakes')
      .select('freelancer_id')
      .eq('task_id', taskId)
      .eq('is_cancelled', false)
      .single()

    if (!handshake || handshake.freelancer_id !== profile.id) {
      return NextResponse.json({ error: 'Only assigned freelancer can verify OTP' }, { status: 403 })
    }

    // Verify OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from('otps')
      .select('*')
      .eq('task_id', taskId)
      .eq('otp_type', otpType)
      .eq('otp', otp)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (otpError || !otpRecord) {
      return NextResponse.json({ 
        valid: false,
        error: 'Invalid or expired OTP'
      }, { status: 400 })
    }

    return NextResponse.json({ 
      valid: true,
      message: 'OTP is valid'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
