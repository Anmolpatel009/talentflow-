'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const TASK_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'content_engine', label: 'Content Writing' },
  { value: 'hyper_local_logistics', label: 'Delivery' },
  { value: 'tech_neighbor', label: 'Tech Support' },
  { value: 'academic_support', label: 'Tutoring' },
  { value: 'event_support', label: 'Event Staff' },
  { value: 'ai_training', label: 'AI Training' },
  { value: 'digital_assistant', label: 'Virtual Assistant' },
]

interface Task {
  id: string
  title: string
  description: string
  category: string
  mode: string
  budget: number
  created_at: string
  portfolio_required: boolean
  client?: {
    full_name: string
    average_rating: number
    city: string
  }
}

export default function AllTasksPage() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [proposedBudget, setProposedBudget] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (selectedCategory || searchQuery) {
      fetchTasks()
    }
  }, [selectedCategory, searchQuery])

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
      fetchTasks()
    } catch (error) {
      console.error('Error:', error)
      router.push('/auth/login')
    }
  }

  const fetchTasks = async () => {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          client:client_id (
            full_name,
            average_rating,
            city
          )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(50)

      if (selectedCategory) {
        query = query.eq('category', selectedCategory)
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error

      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = (task: Task) => {
    setSelectedTask(task)
    setCoverLetter('')
    setProposedBudget(task.budget.toString())
    setShowApplyModal(true)
  }

  const submitApplication = async () => {
    if (!selectedTask || !profile) return

    try {
      setSubmitting(true)

      const { error } = await supabase
        .from('task_applications')
        .insert({
          task_id: selectedTask.id,
          freelancer_id: profile.id,
          cover_letter: coverLetter,
          proposed_budget: proposedBudget ? parseFloat(proposedBudget) : null,
          status: 'pending',
        })

      if (error) {
        if (error.code === '23505') {
          alert('You have already applied to this task')
        } else {
          throw error
        }
        return
      }

      setShowApplyModal(false)
      alert('Application submitted successfully!')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const getModeColor = (mode: string) => {
    return mode === 'immediate' 
      ? 'bg-orange-100 text-orange-800' 
      : 'bg-blue-100 text-blue-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/freelancer/dashboard" className="text-blue-600 hover:text-blue-700 mb-2 inline-flex items-center">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">📋 All Tasks</h1>
              <p className="text-sm text-gray-500">Browse and apply to available tasks</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/freelancer/nearby-tasks"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                📍 Nearby Tasks
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="w-full md:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {TASK_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Tasks Found</h3>
            <p className="text-gray-500">
              {searchQuery || selectedCategory 
                ? 'Try adjusting your filters'
                : 'Check back later for new tasks'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getModeColor(task.mode)}`}>
                      {task.mode === 'immediate' ? '⚡ Immediate' : '📋 Standard'}
                    </span>
                    {task.portfolio_required && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                        📁 Portfolio
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(task.created_at).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">{task.title}</h3>
                
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {task.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span>👤 {task.client?.full_name || 'Anonymous'}</span>
                  <span>⭐ {task.client?.average_rating || 0}</span>
                  <span>📍 {task.client?.city || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <div className="text-xl font-bold text-blue-600">
                      ₹{Number(task.budget).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {task.category?.replace('_', ' ')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleApply(task)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {showApplyModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Apply for Task</h2>
              <p className="text-sm text-gray-500 mt-1">{selectedTask.title}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Letter *
                </label>
                <textarea
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Explain why you're a good fit for this task..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proposed Budget (₹)
                </label>
                <input
                  type="number"
                  value={proposedBudget}
                  onChange={(e) => setProposedBudget(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={selectedTask.budget.toString()}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Original budget: ₹{Number(selectedTask.budget).toLocaleString()}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Task Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-2 capitalize">{selectedTask.category?.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Mode:</span>
                    <span className="ml-2 capitalize">{selectedTask.mode}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Client:</span>
                    <span className="ml-2">{selectedTask.client?.full_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Rating:</span>
                    <span className="ml-2">⭐ {selectedTask.client?.average_rating || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitApplication}
                disabled={!coverLetter || submitting}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
