'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const TASK_CATEGORIES = [
  { value: 'content_engine', label: 'Content Writing', icon: '✍️' },
  { value: 'hyper_local_logistics', label: 'Delivery', icon: '📦' },
  { value: 'tech_neighbor', label: 'Tech Support', icon: '💻' },
  { value: 'academic_support', label: 'Tutoring', icon: '📚' },
  { value: 'event_support', label: 'Event Staff', icon: '🎪' },
  { value: 'ai_training', label: 'AI Training', icon: '🤖' },
  { value: 'digital_assistant', label: 'Virtual Assistant', icon: '📱' },
]

export default function CreateTaskPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mode: 'standard' as 'immediate' | 'standard',
    category: '',
    budget: '',
    acceptanceDeadline: '',
    portfolioRequired: false,
    revisionLimit: 2,
  })

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [address, setAddress] = useState('')

  useEffect(() => {
    checkUser()
  }, [])

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
    
    // Get user's saved location
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('location, city')
      .eq('user_id', user.id)
      .single()

    if (userProfile?.location) {
      // Parse PostGIS point
      const match = userProfile.location.match(/POINT\(([-\d.]+) ([-\d.]+)\)/)
      if (match) {
        setLocation({ lng: parseFloat(match[1]), lat: parseFloat(match[2]) })
      }
    }
  }

  const getLocation = () => {
    setLocationLoading(true)
    if (!navigator.geolocation) {
      setError('Geolocation is not supported')
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLocationLoading(false)
      },
      (error) => {
        setError('Could not get location')
        setLocationLoading(false)
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get client profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) {
        setError('Profile not found')
        setLoading(false)
        return
      }

      if (!location) {
        setError('Please capture your location')
        setLoading(false)
        return
      }

      const taskData = {
        client_id: profile.id,
        title: formData.title,
        description: formData.description,
        mode: formData.mode,
        category: formData.category,
        budget: parseFloat(formData.budget),
        geo_location: location 
          ? `SRID=4326;POINT(${location.lng} ${location.lat})` 
          : null,
        address_text: address,
        is_nearby: formData.mode === 'immediate',
        acceptance_deadline: formData.acceptanceDeadline 
          ? new Date(formData.acceptanceDeadline).toISOString() 
          : null,
        portfolio_required: formData.portfolioRequired,
        revision_limit: formData.revisionLimit,
        status: 'open' as const,
      }

      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single()

      if (taskError) {
        setError(`Error creating task: ${taskError.message}`)
        setLoading(false)
        return
      }

      // Redirect to task details
      router.push(`/client/tasks/${task.id}`)
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/client/dashboard"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
          <p className="text-gray-600 mt-1">Post a task and find freelancers nearby</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Help moving furniture, Tutoring session, etc."
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  id="description"
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the task in detail..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    id="category"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select category</option>
                    {TASK_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                    Budget (₹) *
                  </label>
                  <input
                    type="number"
                    id="budget"
                    required
                    min="1"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Mode</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, mode: 'standard' })}
                className={`p-4 border-2 rounded-xl text-left transition-colors ${
                  formData.mode === 'standard'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-lg">📋 Standard</div>
                <div className="text-sm text-gray-500 mt-1">
                  Receive applications from freelancers and choose the best fit
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Best for: Detailed work, hiring by skill
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, mode: 'immediate' })}
                className={`p-4 border-2 rounded-xl text-left transition-colors ${
                  formData.mode === 'immediate'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-lg">⚡ Immediate</div>
                <div className="text-sm text-gray-500 mt-1">
                  Broadcast to nearby freelancers - first to accept gets the task
                </div>
                <div className="text-xs text-orange-500 mt-2">
                  10% commission • Shown to freelancers within 5km
                </div>
              </button>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Location</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Full address for the task"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location Coordinates *
                </label>
                <div className="flex gap-4">
                  {location ? (
                    <div className="flex-1">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          <span className="text-green-800 font-medium">Location captured</span>
                        </div>
                        <div className="text-sm text-green-600 mt-1">
                          {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={getLocation}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                      >
                        Update location
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={getLocation}
                      disabled={locationLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {locationLoading ? 'Getting location...' : '📍 Get Current Location'}
                    </button>
                  )}
                </div>
                {!location && (
                  <p className="text-sm text-gray-500 mt-2">
                    Location is required to match freelancers near your task
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Options</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                  Acceptance Deadline
                </label>
                <input
                  type="datetime-local"
                  id="deadline"
                  value={formData.acceptanceDeadline}
                  onChange={(e) => setFormData({ ...formData, acceptanceDeadline: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Deadline for freelancers to accept this task (optional)
                </p>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.portfolioRequired}
                    onChange={(e) => setFormData({ ...formData, portfolioRequired: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Portfolio required</span>
                </label>
              </div>

              <div>
                <label htmlFor="revisions" className="block text-sm font-medium text-gray-700 mb-1">
                  Revision Limit
                </label>
                <select
                  id="revisions"
                  value={formData.revisionLimit}
                  onChange={(e) => setFormData({ ...formData, revisionLimit: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="0">No revisions</option>
                  <option value="1">1 revision</option>
                  <option value="2">2 revisions</option>
                  <option value="3">3 revisions</option>
                  <option value="5">5 revisions</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <Link
              href="/client/dashboard"
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 text-center hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !location}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
