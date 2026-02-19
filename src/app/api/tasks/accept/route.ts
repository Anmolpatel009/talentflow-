import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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
    const { taskId } = body

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, verification_status, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if user is a freelancer (allow null role for testing)
    if (profile.role === 'client') {
      return NextResponse.json({ error: 'Only freelancers can accept tasks' }, { status: 403 })
    }

    // Get the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, status, mode, is_nearby')
      .eq('id', taskId)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check if task is still open
    if (task.status !== 'open') {
      return NextResponse.json({ 
        error: 'Task is no longer available',
        status: task.status 
      }, { status: 409 })
    }

    // Verification gate: Only verified freelancers can accept nearby tasks
    if (task.is_nearby && profile.verification_status !== 'verified') {
      return NextResponse.json({ 
        error: 'Verification required',
        message: 'Only verified freelancers can accept nearby tasks. Please upload your College ID and Government ID to get verified.',
        verification_status: profile.verification_status
      }, { status: 403 })
    }

    // Start a transaction-like flow
    // 1. Try to create a handshake record (unique constraint prevents duplicates)
    const { data: handshake, error: handshakeError } = await supabase
      .from('task_handshakes')
      .insert({
        task_id: taskId,
        freelancer_id: profile.id,
        accepted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (handshakeError) {
      // Unique constraint violation - someone else already accepted
      if (handshakeError.code === '23505') {
        return NextResponse.json({ 
          error: 'Task already taken',
          message: 'Another freelancer has already accepted this task.'
        }, { status: 409 })
      }
      
      console.error('Handshake error:', handshakeError)
      return NextResponse.json({ error: 'Failed to accept task' }, { status: 500 })
    }

    // 2. Update task status to 'assigned'
    const { error: updateError } = await supabase
      .from('tasks')
      .update({ 
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('status', 'open') // Double-check it's still open

    if (updateError) {
      // Rollback handshake
      await supabase
        .from('task_handshakes')
        .delete()
        .eq('id', handshake.id)
      
      console.error('Task update error:', updateError)
      return NextResponse.json({ 
        error: 'Task no longer available',
        message: 'The task was taken by another freelancer.'
      }, { status: 409 })
    }

    // 3. Create a chat session for the task
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .insert({
        task_id: taskId
      })
      .select()
      .single()

    if (chatError) {
      console.error('Chat creation error:', chatError)
      // Non-critical error, continue
    }

    return NextResponse.json({ 
      success: true,
      message: 'Task accepted successfully!',
      handshake,
      chat
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
