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
  started_at?: string
  completed_at?: string
  address_text?: string
}

interface Handshake {
  freelancer_id: string
  freelancer?: {
    full_name: string
    phone: string
    average_rating: number
  }
}

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [handshakes, setHandshakes] = useState<Record<string, Handshake>>({})
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [generatedOTP, setGeneratedOTP] = useState<string>('')
  const [otpType, setOtpType] = useState<'start' | 'end'>('start')
  const [processing, setProcessing] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  // Define fetchTasks first with useCallback
  const fetchTasks = useCallback(async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('client_id', profileId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTasks(data || [])

      // Fetch handshakes for assigned tasks
      const assignedTaskIds = (data || [])
        .filter(t => ['assigned', 'in_progress', 'review'].includes(t.status))
        .map(t => t.id)

      if (assignedTaskIds.length > 0) {
        const { data: handshakeData } = await supabase
          .from('task_handshakes')
          .select(`
            task_id,
            freelancer:freelancer_id (
              full_name,
              phone,
              average_rating
            )
          `)
          .in('task_id', assignedTaskIds)
          .eq('is_cancelled', false)

        if (handshakeData) {
          const handshakeMap: Record<string, Handshake> = {}
          handshakeData.forEach((h: any) => {
            handshakeMap[h.task_id] = h
          })
          setHandshakes(handshakeMap)
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    checkUser()
  }, [])

  // Real-time subscription for task updates
  useEffect(() => {
    if (!profile?.id) return

    let isSubscribed = false
    let pollInterval: NodeJS.Timeout | null = null

    const channel = supabase
      .channel('client-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          console.log('Task change received:', payload)
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
          console.log('New handshake:', payload)
          fetchTasks(profile.id)
        }
      )
      .subscribe((status: string) => {
        console.log('Client dashboard subscription status:', status)
        
        if (status === 'SUBSCRIBED') {
          isSubscribed = true
          if (pollInterval) {
            clearInterval(pollInterval)
            pollInterval = null
          }
        }
        
        if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && !isSubscribed) {
          console.warn('Real-time failed, falling back to polling')
          if (!pollInterval) {
            pollInterval = setInterval(() => {
              fetchTasks(profile.id)
            }, 5000)
          }
        }
      })

    return () => {
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

      // Check if user is a client
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileData?.role && profileData.role !== 'client') {
        router.push('/freelancer/dashboard')
        return
      }

      setUser(user)
      setProfile(profileData)
      fetchTasks(profileData.id)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/auth/login')
    }
  }

  // Generate OTP for task
  const generateOTP = async (taskId: string, type: 'start' | 'end') => {
    setProcessing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/tasks/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ taskId, otpType: type })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to generate OTP')
        return
      }

      setSelectedTask(tasks.find(t => t.id === taskId) || null)
      setGeneratedOTP(data.otp)
      setOtpType(type)
      setShowOTPModal(true)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to generate OTP'
      alert(message)
    } finally {
      setProcessing(false)
    }
  }

  // Mark task as complete
  const markComplete = async (taskId: string, budget: number) => {
    if (!confirm('Are you sure you want to mark this task as complete? Payment will be released to the freelancer.')) return
    
    setProcessing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/tasks/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ taskId, newStatus: 'completed' })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to update task')
        return
      }

      // Redirect to payment page
      router.push(`/client/tasks/${taskId}/payment?amount=${budget}`)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update task'
      alert(message)
    } finally {
      setProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'assigned': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-purple-100 text-purple-800'
      case 'review': return 'bg-orange-100 text-orange-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Client Dashboard</h1>
          <div className="flex gap-4">
            <Link
              href="/client/tasks/create"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
            >
              Post New Task
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
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Open Tasks</p>
            <p className="text-2xl font-bold text-blue-600">
              {tasks.filter(t => t.status === 'open').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-purple-600">
              {tasks.filter(t => t.status === 'in_progress').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">In Review</p>
            <p className="text-2xl font-bold text-orange-600">
              {tasks.filter(t => t.status === 'review').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {tasks.filter(t => t.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Tasks</h2>
          </div>
          
          {tasks.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>No tasks yet. Create your first task to get started!</p>
              <Link
                href="/client/tasks/create"
                className="mt-4 inline-block text-indigo-600 hover:text-indigo-800"
              >
                Create a Task →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <div key={task.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          {task.mode}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                        <span>💰 ₹{task.budget}</span>
                        <span>📁 {task.category}</span>
                        {task.address_text && <span>📍 {task.address_text}</span>}
                      </div>
                      
                      {/* Show freelancer info for assigned tasks */}
                      {['assigned', 'in_progress', 'review'].includes(task.status) && handshakes[task.id]?.freelancer && (
                        <div className="mt-3 p-3 bg-green-50 rounded-md">
                          <p className="text-sm font-medium text-green-800">
                            Freelancer: {handshakes[task.id].freelancer?.full_name}
                          </p>
                          <p className="text-sm text-green-600">
                            📞 {handshakes[task.id].freelancer?.phone}
                            {handshakes[task.id].freelancer?.average_rating && (
                              <span className="ml-2">⭐ {handshakes[task.id].freelancer?.average_rating.toFixed(1)}</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Link
                        href={`/client/tasks/${task.id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        View Details
                      </Link>
                      
                      {task.status === 'assigned' && (
                        <button
                          onClick={() => generateOTP(task.id, 'start')}
                          disabled={processing}
                          className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
                        >
                          Generate Start OTP
                        </button>
                      )}
                      
                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => generateOTP(task.id, 'end')}
                          disabled={processing}
                          className="text-orange-600 hover:text-orange-800 text-sm font-medium disabled:opacity-50"
                        >
                          Generate End OTP
                        </button>
                      )}
                      
                      {task.status === 'review' && (
                        <button
                          onClick={() => markComplete(task.id, task.budget)}
                          disabled={processing}
                          className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
                        >
                          Mark Complete & Pay
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* OTP Modal */}
      {showOTPModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {otpType === 'start' ? 'Start Task' : 'End Task'} OTP
            </h3>
            <p className="text-gray-600 mb-2">
              Share this OTP with the freelancer to {otpType === 'start' ? 'start' : 'end'} the task:
            </p>
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <span className="text-3xl font-bold text-indigo-600 tracking-widest">
                {generatedOTP}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              This OTP expires in 30 minutes
            </p>
            <button
              onClick={() => setShowOTPModal(false)}
              className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
