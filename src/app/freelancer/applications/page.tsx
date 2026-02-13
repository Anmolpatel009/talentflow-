'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Application {
  id: string
  task_id: string
  cover_letter: string
  proposed_budget: number
  status: string
  created_at: string
  task?: {
    title: string
    description: string
    category: string
    mode: string
    budget: number
    client?: {
      full_name: string
    }
  }
}

export default function ApplicationsPage() {
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')

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
      fetchApplications(profileData.id)
    } catch (error) {
      console.error('Error:', error)
      router.push('/auth/login')
    }
  }

  const fetchApplications = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from('task_applications')
        .select(`
          *,
          task:task_id (
            title,
            description,
            category,
            mode,
            budget,
            status,
            client:client_id (
              full_name
            )
          )
        `)
        .eq('freelancer_id', profileId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setApplications(data || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('task_applications')
        .update({ status: 'withdrawn' })
        .eq('id', applicationId)

      if (error) throw error

      setApplications(applications.map(app =>
        app.id === applicationId ? { ...app, status: 'withdrawn' } : app
      ))
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'withdrawn': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true
    return app.status === filter
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/freelancer/dashboard" className="text-blue-600 hover:text-blue-700 mb-2 inline-flex items-center">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">📋 My Applications</h1>
              <p className="text-sm text-gray-500">Track your task applications</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'accepted', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'all' && ` (${applications.length})`}
              {f === 'pending' && ` (${applications.filter(a => a.status === 'pending').length})`}
              {f === 'accepted' && ` (${applications.filter(a => a.status === 'accepted').length})`}
              {f === 'rejected' && ` (${applications.filter(a => a.status === 'rejected').length})`}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
            </h3>
            <p className="text-gray-500 mb-6">
              Start applying to tasks to see them here
            </p>
            <Link
              href="/freelancer/all-tasks"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Tasks
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <div key={application.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{application.task?.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      by {application.task?.client?.full_name || 'Unknown'} • 
                      {application.task?.category?.replace('_', ' ')} • 
                      {application.task?.mode}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      ₹{Number(application.task?.budget || 0).toLocaleString()}
                    </div>
                    {application.proposed_budget && application.proposed_budget !== application.task?.budget && (
                      <div className="text-sm text-gray-500">
                        Your bid: ₹{Number(application.proposed_budget).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                  {application.task?.description}
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600">{application.cover_letter}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Applied on {new Date(application.created_at).toLocaleDateString()}
                  </div>
                  {application.status === 'pending' && (
                    <button
                      onClick={() => handleWithdraw(application.id)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Withdraw Application
                    </button>
                  )}
                  {application.status === 'accepted' && (
                    <Link
                      href={`/freelancer/dashboard`}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Go to Task
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
