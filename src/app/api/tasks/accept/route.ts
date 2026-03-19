import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function handler(request: Request) {
  try {
    // 1. Identify the user using the standard client (Session/Cookie based)
    const supabase = createServerSupabaseClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Use Service Role Client to bypass RLS and break the recursion loop (42P17)
    // This is safe because we have already verified the user identity above.
    const adminSupabase = createServiceRoleClient()

    const body = await request.json()
    const { taskId } = body

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
    }

    // 3. Fetch Profile via Admin Client
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, verification_status, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // 4. Role Gate
    if (profile.role === 'client') {
      return NextResponse.json({ error: 'Only freelancers can accept tasks' }, { status: 403 })
    }

    // 5. Fetch Task & Check Status
    const { data: task, error: taskError } = await adminSupabase
      .from('tasks')
      .select('id, status, mode, is_nearby')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // If status is already 'assigned', return conflict (409)
    if (task.status !== 'open') {
      return NextResponse.json({ 
        error: 'Task taken', 
        message: 'This task has already been accepted by someone else.' 
      }, { status: 409 })
    }

    // 6. Verification Gate for Nearby Tasks
    if (task.is_nearby && profile.verification_status !== 'verified') {
      return NextResponse.json({ 
        error: 'Verification required',
        message: 'Please complete your ID verification to accept nearby tasks.'
      }, { status: 403 })
    }

    // 7. Atomic-like operation: Insert Handshake & Update Task
    // First, insert the handshake. If this fails due to a unique constraint, the 409 is triggered.
    const { data: handshake, error: handshakeError } = await adminSupabase
      .from('task_handshakes')
      .insert({
        task_id: taskId,
        freelancer_id: profile.id,
        accepted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (handshakeError) {
      // Check for Unique Constraint violation (23505)
      if (handshakeError.code === '23505') {
        return NextResponse.json({ error: 'Task already accepted' }, { status: 409 })
      }
      throw handshakeError
    }

    // 8. Update Task status
    const { error: updateError } = await adminSupabase
      .from('tasks')
      .update({ 
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('status', 'open') // Final safety check

    if (updateError) {
      // Rollback: Delete the handshake if the task update failed
      await adminSupabase.from('task_handshakes').delete().eq('id', handshake.id)
      return NextResponse.json({ error: 'Failed to update task status' }, { status: 500 })
    }

    // 9. Create Chat (Optional/Non-critical)
    await adminSupabase.from('chats').insert({ task_id: taskId })

    return NextResponse.json({ 
      success: true, 
      message: 'Task accepted!',
      handshake 
    })

  } catch (error) {
    console.error('Accept Task API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = handler