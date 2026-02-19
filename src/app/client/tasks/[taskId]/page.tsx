'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Task {
  id: string
  title: string
  description: string
  status: string
  category: string
  mode: string
  budget: number
  address_text: string
  created_at: string
  acceptance_deadline: string
  portfolio_required: boolean
  revision_limit: number
}

interface Application {
  id: string
  freelancer_id: string
  cover_letter: string
  proposed_budget: number
  status: string
  created_at: string
  freelancer?: {
    full_name: string
    average_rating: number
    completed_tasks: number
    skills: string[]
  }
}

interface Chat {
  id: string
  freelancer_id: string
  freelancer?: {
    full_name: string
  }
}

export default function TaskDetailsPage() {
  const [loading, setLoading] = useState(true)
  const [task, setTask] = useState<Task | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'applications' | 'chat'>('details')
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpType, setOtpType] = useState<'start' | 'end'>('start')

  const router = useRouter()
  const params = useParams()
  const taskId = params.taskId as string
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [taskId])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profile?.role !== 'client') {
      router.push('/freelancer/dashboard')
      return
    }

    setUser(user)
    fetchTaskData(user.id)
  }

  const fetchTaskData = async (userId: string) => {
    try {
      // Get client profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!profile) {
        setLoading(false)
        return
      }

      // Get task
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('client_id', profile.id)
        .single()

      if (taskError || !taskData) {
        router.push('/client/dashboard')
        return
      }

      setTask(taskData)

      // Get applications (for standard mode)
      const { data: appData } = await supabase
        .from('task_applications')
        .select(`
          *,
          freelancer:freelancer_id (
            full_name,
            average_rating,
            completed_tasks,
            skills
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })

      if (appData) {
        setApplications(appData as any)
      }

      // Get chats
      const { data: chatData } = await supabase
        .from('chats')
        .select(`
          *,
          freelancer:freelancer_id (
            full_name
          )
        `)
        .eq('task_id', taskId)

      if (chatData) {
        setChats(chatData as any)
      }
    } catch (error) {
      console.error('Error fetching task:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptApplication = async (applicationId: string, freelancerId: string) => {
    try {
      // Update application status
      const { error: appError } = await supabase
        .from('task_applications')
        .update({ status: 'accepted' })
        .eq('id', applicationId)

      if (appError) throw appError

      // Create handshake
      const { error: handshakeError } = await supabase
        .from('task_handshakes')
        .insert({
          task_id: taskId,
          freelancer_id: freelancerId,
        })

      if (handshakeError) throw handshakeError

      // Update task status
      const { error: taskError } = await supabase
        .from('tasks')
        .update({ status: 'assigned' })
        .eq('id', taskId)

      if (taskError) throw taskError

      // Fetch fresh data
      fetchTaskData(user.id)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleRejectApplication = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('task_applications')
        .update({ status: 'rejected' })
        .eq('id', applicationId)

      if (error) throw error

      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: 'rejected' } : app
      ))
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleStartTask = async () => {
    setOtpType('start')
    setShowOTPModal(true)
  }

  const handleCompleteTask = async () => {
    setOtpType('end')
    setShowOTPModal(true)
  }

  const verifyOTP = async () => {
    try {
      // Verify OTP
      const { data: otpData, error: otpError } = await supabase
        .from('otps')
        .select('*')
        .eq('task_id', taskId)
        .eq('otp', otp)
        .eq('otp_type', otpType)
        .eq('is_used', false)
        .single()

      if (otpError || !otpData) {
        alert('Invalid OTP')
        return
      }

      // Mark OTP as used
      await supabase
        .from('otps')
        .update({ is_used: true })
        .eq('id', otpData.id)

      // Update task status
      if (otpType === 'start') {
        await supabase
          .from('tasks')
          .update({ status: 'in_progress', started_at: new Date().toISOString() })
          .eq('id', taskId)
      } else {
        await supabase
          .from('tasks')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', taskId)
      }

      setShowOTPModal(false)
      setOtp('')
      fetchTaskData(user.id)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const generateOTP = async () => {
    try {
      // Generate 4-digit OTP (1000-9999)
      const otpValue = Math.floor(1000 + Math.random() * 9000).toString()
      
      await supabase
        .from('otps')
        .insert({
          task_id: taskId,
          otp: otpValue,
          otp_type: otpType,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 mins
        })

      alert(`OTP generated: ${otpValue} (Share with freelancer)`)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Task not found</h2>
          <Link href="/client/dashboard" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/client/dashboard"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center"
          >
            ← Back to Dashboard
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </span>
                <span className="text-gray-500 capitalize">{task.category.replace('_', ' ')}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-500">{task.mode}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">₹{Number(task.budget).toLocaleString()}</div>
              <div className="text-sm text-gray-500">Budget</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          {['details', 'applications', 'chat'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-3 px-1 capitalize font-medium ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {tab === 'applications' && task.mode === 'standard' && (
                <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">
                  {applications.filter(a => a.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
              </div>

              {task.address_text && (
                <div className="bg-white rounded-xl shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
                  <p className="text-gray-600">{task.address_text}</p>
                </div>
              )}

              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Mode</div>
                    <div className="font-medium capitalize">{task.mode}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Portfolio Required</div>
                    <div className="font-medium">{task.portfolio_required ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Revision Limit</div>
                    <div className="font-medium">{task.revision_limit}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Created</div>
                    <div className="font-medium">{new Date(task.created_at).toLocaleDateString()}</div>
                  </div>
                  {task.acceptance_deadline && (
                    <div>
                      <div className="text-sm text-gray-500">Acceptance Deadline</div>
                      <div className="font-medium">
                        {new Date(task.acceptance_deadline).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Actions */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                <div className="space-y-3">
                  {task.status === 'open' && (
                    <button
                      onClick={handleStartTask}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Generate Start OTP
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button
                      onClick={handleCompleteTask}
                      className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Generate End OTP
                    </button>
                  )}
                  {task.status === 'open' && (
                    <button
                      onClick={async () => {
                        const { error } = await supabase
                          .from('tasks')
                          .update({ status: 'cancelled' })
                          .eq('id', taskId)
                        if (!error) fetchTaskData(user.id)
                      }}
                      className="w-full py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Cancel Task
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Budget</span>
                    <span className="font-medium">₹{Number(task.budget).toLocaleString()}</span>
                  </div>
                  {task.mode === 'standard' && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Applications</span>
                      <span className="font-medium">{applications.length}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Chats</span>
                    <span className="font-medium">{chats.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="space-y-4">
            {task.mode === 'immediate' ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <div className="text-6xl mb-4">⚡</div>
                <h3 className="text-lg font-medium text-gray-900">Immediate Mode</h3>
                <p className="text-gray-500">
                  In immediate mode, freelancers can accept the task directly.
                  They will see your task in their nearby tasks list.
                </p>
              </div>
            ) : applications.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-lg font-medium text-gray-900">No applications yet</h3>
                <p className="text-gray-500">
                  Applications from freelancers will appear here
                </p>
              </div>
            ) : (
              applications.map((application) => (
                <div key={application.id} className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-lg">
                          {application.freelancer?.full_name?.[0] || 'F'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {application.freelancer?.full_name || 'Unknown Freelancer'}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>⭐ {application.freelancer?.average_rating || 0}</span>
                          <span>✓ {application.freelancer?.completed_tasks || 0} tasks</span>
                        </div>
                        {application.freelancer?.skills && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {application.freelancer.skills.map((skill: string) => (
                              <span
                                key={skill}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {application.proposed_budget && (
                        <div className="font-medium text-blue-600">
                          ₹{Number(application.proposed_budget).toLocaleString()}
                        </div>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {application.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-gray-600">{application.cover_letter}</p>
                  </div>

                  {application.status === 'pending' && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleAcceptApplication(application.id, application.freelancer_id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectApplication(application.id)}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            {chats.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-medium text-gray-900">No chats yet</h3>
                <p className="text-gray-500">
                  Chats with freelancers will appear here once assigned
                </p>
              </div>
            ) : (
              chats.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/messages/${chat.id}`}
                  className="block bg-white rounded-xl shadow p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {chat.freelancer?.full_name?.[0] || 'F'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {chat.freelancer?.full_name || 'Unknown'}
                      </h3>
                      <p className="text-sm text-gray-500">Click to open chat</p>
                    </div>
                    <span className="text-blue-600">→</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* OTP Modal */}
        {showOTPModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {otpType === 'start' ? 'Start Task OTP' : 'Complete Task OTP'}
              </h3>
              <p className="text-gray-600 mb-4">
                Share this OTP with the freelancer to {otpType === 'start' ? 'start' : 'complete'} the task.
                They will enter this OTP to verify.
              </p>
              <button
                onClick={generateOTP}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-4"
              >
                Generate New OTP
              </button>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter OTP (for verification)
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter 4-digit OTP"
                  maxLength={4}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowOTPModal(false)
                    setOtp('')
                  }}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={verifyOTP}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Verify & {otpType === 'start' ? 'Start' : 'Complete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
