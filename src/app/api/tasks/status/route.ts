import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Task status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  'open': ['assigned', 'cancelled'],
  'assigned': ['in_progress', 'cancelled'],
  'in_progress': ['review', 'cancelled'],
  'review': ['completed', 'disputed'],
  'completed': [], // Terminal state
  'disputed': ['completed', 'cancelled'],
  'cancelled': [] // Terminal state
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
    const { taskId, newStatus, otp } = body

    if (!taskId || !newStatus) {
      return NextResponse.json({ error: 'Task ID and new status required' }, { status: 400 })
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

    // Get the task with current status
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, status, client_id')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Validate status transition
    const allowedTransitions = VALID_TRANSITIONS[task.status] || []
    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json({ 
        error: 'Invalid status transition',
        currentStatus: task.status,
        requestedStatus: newStatus,
        allowedTransitions
      }, { status: 400 })
    }

    // Check permissions based on role and transition
    const isClient = task.client_id === profile.id
    
    // Check if user is the assigned freelancer
    const { data: handshake } = await supabase
      .from('task_handshakes')
      .select('freelancer_id')
      .eq('task_id', taskId)
      .eq('is_cancelled', false)
      .single()
    
    const isFreelancer = handshake?.freelancer_id === profile.id

    // Permission checks
    if (newStatus === 'in_progress') {
      // Only assigned freelancer can start task (with OTP verification)
      if (!isFreelancer) {
        return NextResponse.json({ error: 'Only assigned freelancer can start the task' }, { status: 403 })
      }

      // Verify OTP if provided
      if (otp) {
        const { data: otpRecord, error: otpError } = await supabase
          .from('otps')
          .select('*')
          .eq('task_id', taskId)
          .eq('otp_type', 'start')
          .eq('otp', otp)
          .eq('is_used', false)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (otpError || !otpRecord) {
          return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 })
        }

        // Mark OTP as used
        await supabase
          .from('otps')
          .update({ is_used: true })
          .eq('id', otpRecord.id)
      }
    }

    if (newStatus === 'review' || newStatus === 'completed') {
      // Only freelancer can mark as review, only client can complete
      if (newStatus === 'review' && !isFreelancer) {
        return NextResponse.json({ error: 'Only freelancer can mark task for review' }, { status: 403 })
      }
      if (newStatus === 'completed' && !isClient) {
        return NextResponse.json({ error: 'Only client can mark task as completed' }, { status: 403 })
      }
    }

    if (newStatus === 'cancelled') {
      // Both client and freelancer can cancel
      if (!isClient && !isFreelancer) {
        return NextResponse.json({ error: 'Not authorized to cancel this task' }, { status: 403 })
      }
    }

    // Update task status
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    if (newStatus === 'in_progress') {
      updateData.started_at = new Date().toISOString()
    }

    if (newStatus === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)

    if (updateError) {
      console.error('Status update error:', updateError)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    // If task is completed, update freelancer stats
    if (newStatus === 'completed' && handshake) {
      await supabase.rpc('increment_completed_tasks', { 
        freelancer_id: handshake.freelancer_id 
      })
    }

    return NextResponse.json({ 
      success: true,
      message: `Task status updated to ${newStatus}`,
      previousStatus: task.status,
      newStatus
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
