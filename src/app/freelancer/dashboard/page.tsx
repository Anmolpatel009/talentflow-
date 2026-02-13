'use client'

import { useEffect, useState } from 'react'
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
  client?: {
    full_name: string
    city: string
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
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

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

      if (profileData?.role !== 'freelancer') {
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

  const fetchTasks = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from('task_handshakes')
        .select(`
          *,
          task:tasks (
            *,
            client:client_id (
              full_name,
              city
            )
          )
        `)
        .eq('freelancer_id', profileId)
        .eq('is_cancelled', false)
        .order('accepted_at', { ascending: false })

      if (error) throw error

      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskAction = async (taskId: string, action: 'start' | 'end' | 'cancel') => {
    try {
      if (action === 'cancel') {
        const { error } = await supabase
          .from('task_handshakes')
          .update({ 
            is_cancelled: true,
            cancelled_reason: 'Cancelled by freelancer'
          })
          .eq('task_id', taskId)

        if (error) throw error
      } else if (action === 'start') {
        const { error } = await supabase
          .from('tasks')
          .update({ status: 'in_progress', started_at: new Date().toISOString() })
          .eq('id', taskId)

        if (error) throw error
      } else if (action === 'end') {
        const { error } = await supabase
          .from('tasks')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', taskId)

        if (error) throw error
      }

      fetchTasks(profile.id)
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const activeTasks = tasks.filter(t => t.task?.status === 'assigned' || t.task?.status === 'in_progress')
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
                📍 Nearby Tasks
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
            <div className="text-3xl font-bold text-yellow-600">₹{totalEarnings.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm text-gray-500">Your Rating</div>
            <div className="text-3xl font-bold text-purple-600">
              ⭐ {profile?.average_rating || 0}
            </div>
          </div>
        </div>

        {/* Verification Banner */}
        {profile?.verification_status !== 'verified' && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800">Verification Required</h3>
                <p className="text-sm text-yellow-600">
                  Upload your college ID and government ID to get verified and access nearby tasks with 10% commission.
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
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No active tasks</h3>
              <p className="text-gray-500 mb-6">
                Find nearby tasks to start earning
              </p>
              <div className="flex justify-center gap-4">
                <Link
                  href="/freelancer/nearby-tasks"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  📍 Find Nearby Tasks
                </Link>
                <Link
                  href="/freelancer/all-tasks"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Browse All Tasks
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeTasks.map((handshake) => (
                <div key={handshake.task_id} className="bg-white rounded-xl shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{handshake.task?.title}</h3>
                      <p className="text-sm text-gray-500">
                        by {handshake.task?.client?.full_name || 'Unknown'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(handshake.task?.status || '')}`}>
                      {handshake.task?.status?.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {handshake.task?.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span>📍 {handshake.task?.client?.city || 'N/A'}</span>
                    <span>💰 ₹{Number(handshake.task?.budget).toLocaleString()}</span>
                    <span className="capitalize">{handshake.task?.category?.replace('_', ' ')}</span>
                  </div>

                  <div className="flex gap-3">
                    {handshake.task?.status === 'assigned' && (
                      <>
                        <button
                          onClick={() => handleTaskAction(handshake.task_id, 'start')}
                          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Start Task
                        </button>
                        <button
                          onClick={() => handleTaskAction(handshake.task_id, 'cancel')}
                          className="py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {handshake.task?.status === 'in_progress' && (
                      <>
                        <button
                          onClick={() => handleTaskAction(handshake.task_id, 'end')}
                          className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Complete Task
                        </button>
                        <button
                          onClick={() => router.push(`/messages/${handshake.task_id}`)}
                          className="py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          💬 Chat
                        </button>
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
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Completed Tasks</h2>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {completedTasks.slice(0, 5).map((handshake) => (
                    <tr key={handshake.task_id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{handshake.task?.title}</div>
                        <div className="text-sm text-gray-500 capitalize">{handshake.task?.category?.replace('_', ' ')}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {handshake.task?.client?.full_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-green-600">
                        ₹{Number(handshake.task?.budget).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(handshake.task?.completed_at || '').toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
