'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  description: string
  status: string
  category: string
  mode: string
  budget: number
  created_at: string
  completed_at: string
  started_at: string
  address_text: string
  geo_location: string
  client?: {
    full_name: string
    city: string
    phone: string
  }
}

interface Handshake {
  task_id: string
  accepted_at: string
  task?: Task
}

export default function FreelancerDashboard() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Handshake[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [enteredOTP, setEnteredOTP] = useState('')
  const [otpAction, setOtpAction] = useState<'start' | 'end'>('start')
  const [processing, setProcessing] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const fetchTasks = useCallback(async (profileId: string) => {
    console.log('[Dashboard] Fetching tasks for profile:', profileId)
    try {
      const { data, error } = await supabase
        .from('task_handshakes')
        .select(`
          *,
          task:tasks (
            *,
            client:client_id (
              full_name,
              city,
              phone
            )
          )
        `)
        .eq('freelancer_id', profileId)
        .eq('is_cancelled', false)
        .order('accepted_at', { ascending: false })

      if (error) {
        console.error('[Dashboard] Error fetching tasks:', error)
        throw error
      }

      console.log('[Dashboard] Fetched tasks:', data?.length || 0, 'tasks')
      setTasks(data || [])
    } catch (error) {
      console.error('[Dashboard] Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Real-time subscription for task updates
  useEffect(() => {
    if (!profile?.id) {
      console.log('[Dashboard] No profile ID, skipping subscription')
      return
    }

    console.log('[Dashboard] Setting up real-time subscription for profile:', profile.id)

    let isSubscribed = false
    let pollInterval: NodeJS.Timeout | null = null

    const channel = supabase
      .channel('freelancer-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          console.log('[Dashboard] Task change received:', payload.eventType, payload.new)
          fetchTasks(profile.id)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_handshakes'
        },
        (payload: { new: Record<string, unknown> }) => {
          console.log('[Dashboard] New handshake received:', payload.new)
          fetchTasks(profile.id)
        }
      )
      .subscribe((status: string) => {
        console.log('[Dashboard] Subscription status:', status)
        
        if (status === 'SUBSCRIBED') {
          isSubscribed = true
          if (pollInterval) {
            clearInterval(pollInterval)
            pollInterval = null
          }
        }
        
        if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && !isSubscribed) {
          console.warn('[Dashboard] Real-time failed, falling back to polling')
          // Fallback: Poll every 5 seconds if realtime fails
          if (!pollInterval) {
            pollInterval = setInterval(() => {
              console.log('[Dashboard] Polling for task updates...')
              fetchTasks(profile.id)
            }, 5000)
          }
        }
      })

    return () => {
      console.log('[Dashboard] Cleaning up subscription')
      if (pollInterval) clearInterval(pollInterval)
      channel.unsubscribe()
    }
  }, [profile?.id, supabase, fetchTasks])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileData?.role && profileData.role !== 'freelancer') {
        router.push('/client/dashboard')
        return
      }

      setUser(user)
      setProfile(profileData)
      fetchTasks(profileData.id)
    } catch (error) {
      console.error('Error:', error)
      router.push('/auth/login')
    }
  }

  // Request OTP from client
  const requestOTP = async (taskId: string, type: 'start' | 'end') => {
    setSelectedTask(tasks.find(t => t.task?.id === taskId)?.task || null)
    setOtpAction(type)
    setEnteredOTP('')
    setShowOTPModal(true)
  }

  // Verify OTP and update task status
  const verifyOTPAndProceed = async () => {
    if (!selectedTask || !enteredOTP) return

    setProcessing(true)
    try {
      // Get session for auth
      const { data: { session } } = await supabase.auth.getSession()

      // Call the status API with OTP
      const response = await fetch('/api/tasks/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          taskId: selectedTask.id,
          newStatus: otpAction === 'start' ? 'in_progress' : 'review',
          otp: enteredOTP
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to verify OTP')
        return
      }

      setShowOTPModal(false)
      alert(otpAction === 'start' 
        ? 'Task started! Work on the task and submit when done.' 
        : 'Task submitted for review! Waiting for client approval.')
      
      // Refresh tasks
      if (profile?.id) {
        fetchTasks(profile.id)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to verify OTP'
      alert(message)
    } finally {
      setProcessing(false)
    }
  }

  // Complete task (client action, but we'll allow freelancer to mark complete for testing)
  const markComplete = async (taskId: string) => {
    if (!confirm('Mark this task as complete? This should normally be done by the client.')) return

    setProcessing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/tasks/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          taskId,
          newStatus: 'completed'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to complete task')
        return
      }

      alert('Task completed!')
      if (profile?.id) {
        fetchTasks(profile.id)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to complete task'
      alert(message)
    } finally {
      setProcessing(false)
    }
  }

  // Cancel task
  const cancelTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to cancel this task?')) return

    try {
      const { error } = await supabase
        .from('task_handshakes')
        .update({ 
          is_cancelled: true,
          cancelled_reason: 'Cancelled by freelancer'
        })
        .eq('task_id', taskId)

      if (error) throw error

      // Also update task status
      await supabase
        .from('tasks')
        .update({ status: 'cancelled' })
        .eq('id', taskId)

      if (profile?.id) {
        fetchTasks(profile.id)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to cancel task'
      alert(message)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800'
      case 'assigned': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'review': return 'bg-purple-100 text-purple-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusInstructions = (status: string) => {
    switch (status) {
      case 'assigned':
        return '📍 Contact the client to get the START OTP code, then click "Start Task"'
      case 'in_progress':
        return '🔧 Work on the task. When done, ask client for END OTP and click "Submit for Review"'
      case 'review':
        return '⏳ Waiting for client to approve and mark as complete'
      case 'completed':
        return '✅ Task completed! Payment will be processed.'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const activeTasks = tasks.filter(t => ['assigned', 'in_progress', 'review'].includes(t.task?.status || ''))
  const completedTasks = tasks.filter(t => t.task?.status === 'completed')
  const totalEarnings = completedTasks.reduce((sum, t) => sum + Number(t.task?.budget || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Freelancer Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, {profile?.full_name || 'Freelancer'}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/freelancer/nearby-tasks"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Nearby Tasks
              </Link>
              <Link
                href="/freelancer/all-tasks"
                className="text-gray-600 hover:text-gray-900"
              >
                Browse All
              </Link>
              <Link
                href="/freelancer/profile"
                className="text-gray-600 hover:text-gray-900"
              >
                Profile
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/auth/login')
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-gray-500">Active Tasks</div>
            <div className="text-3xl font-bold text-blue-600">{activeTasks.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-gray-500">Completed</div>
            <div className="text-3xl font-bold text-green-600">{completedTasks.length}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-gray-500">Total Earnings</div>
            <div className="text-3xl font-bold text-yellow-600">+{totalEarnings.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-gray-500">Your Rating</div>
            <div className="text-3xl font-bold text-purple-600">
              ({profile?.average_rating || 0})
            </div>
          </div>
        </div>

        {/* Verification Banner */}
        {profile?.verification_status !== 'verified' && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">Verification Required</span>
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800">Get Verified for 10% Commission</h3>
                <p className="text-sm text-yellow-600">
                  Upload your college ID and government ID to access nearby tasks with reduced commission.
                </p>
              </div>
              <Link
                href="/freelancer/profile"
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Get Verified
              </Link>
            </div>
          </div>
        )}

        {/* Active Tasks */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Active Tasks</h2>
          
          {activeTasks.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <div className="text-4xl mb-4">No Active Tasks</div>
              <p className="text-gray-500 mb-4">You don't have any active tasks right now</p>
              <Link
                href="/freelancer/nearby-tasks"
                className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Find Nearby Tasks
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTasks.map((handshake) => (
                <div key={handshake.task_id} className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(handshake.task?.status || '')}`}>
                          {handshake.task?.status?.replace('_', ' ').toUpperCase()}
                        </span>
                        {handshake.task?.mode === 'immediate' && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                            IMMEDIATE
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{handshake.task?.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{handshake.task?.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">+{Number(handshake.task?.budget || 0).toLocaleString()}</div>
                      <div className="text-sm text-gray-500 capitalize">{handshake.task?.category?.replace('_', ' ')}</div>
                    </div>
                  </div>

                  {/* Status Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      {getStatusInstructions(handshake.task?.status || '')}
                    </p>
                  </div>

                  {/* Task Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500">Client:</span>
                      <span className="ml-2 font-medium">{handshake.task?.client?.full_name || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <span className="ml-2">{handshake.task?.address_text || 'See map'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Accepted:</span>
                      <span className="ml-2">{new Date(handshake.accepted_at).toLocaleDateString()}</span>
                    </div>
                    {handshake.task?.started_at && (
                      <div>
                        <span className="text-gray-500">Started:</span>
                        <span className="ml-2">{new Date(handshake.task.started_at).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    {handshake.task?.status === 'assigned' && (
                      <>
                        <button
                          onClick={() => requestOTP(handshake.task!.id, 'start')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Start Task (Need OTP)
                        </button>
                        <button
                          onClick={() => cancelTask(handshake.task!.id)}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    
                    {handshake.task?.status === 'in_progress' && (
                      <>
                        <button
                          onClick={() => requestOTP(handshake.task!.id, 'end')}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Submit for Review (Need OTP)
                        </button>
                        <Link
                          href={`/messages/${handshake.task!.id}`}
                          className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
                        >
                          Chat with Client
                        </Link>
                      </>
                    )}
                    
                    {handshake.task?.status === 'review' && (
                      <>
                        <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                          Waiting for client approval...
                        </div>
                        <Link
                          href={`/messages/${handshake.task!.id}`}
                          className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
                        >
                          Chat with Client
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Tasks</h2>
            <div className="space-y-2">
              {completedTasks.slice(0, 5).map((handshake) => (
                <div key={handshake.task_id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{handshake.task?.title}</h3>
                    <p className="text-sm text-gray-500">
                      Completed {handshake.task?.completed_at ? new Date(handshake.task.completed_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="text-green-600 font-semibold">
                    +{Number(handshake.task?.budget || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* OTP Modal */}
      {showOTPModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-2">
              {otpAction === 'start' ? 'Start Task' : 'Submit for Review'}
            </h2>
            <p className="text-gray-600 mb-4">
              {otpAction === 'start' 
                ? 'Ask the client for the 4-digit START OTP code to begin working on this task.'
                : 'Ask the client for the 4-digit END OTP code to submit this task for review.'}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP Code
              </label>
              <input
                type="text"
                maxLength={4}
                value={enteredOTP}
                onChange={(e) => setEnteredOTP(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 text-center text-2xl letter-spacing-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0000"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowOTPModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={verifyOTPAndProceed}
                disabled={enteredOTP.length !== 4 || processing}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {processing ? 'Verifying...' : 'Verify & Proceed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
