'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useRealtimeTasks, useTaskAcceptance } from '@/lib/hooks/useRealtimeTasks'
import { generateFuzzyLocation, formatDistance } from '@/lib/utils/geo'

const VERIFICATION_TIERS = {
  none: { label: 'Unverified', commission: 50, color: 'red' },
  pending: { label: 'Pending', commission: 50, color: 'yellow' },
  verified: { label: 'Verified Student', commission: 10, color: 'green' }
}

export default function NearbyTasksPage() {
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()
  
  const { tasks, loading, error, verificationStatus, refetch } = useRealtimeTasks({
    lat: location?.lat || null,
    lng: location?.lng || null,
    radius: 5000,
    enabled: !!location
  })
  
  const { acceptTask, accepting, error: acceptError } = useTaskAcceptance()

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

      if (!profileData) {
        router.push('/auth/signup')
        return
      }

      // Allow NULL role for testing
      if (profileData.role && profileData.role !== 'freelancer') {
        router.push('/client/dashboard')
        return
      }

      setUser(user)
      setProfile(profileData)

      // Get saved location
      if (profileData.location) {
        const match = profileData.location.match(/POINT\(([-\d.]+) ([-\d.]+)\)/)
        if (match) {
          const lng = parseFloat(match[1])
          const lat = parseFloat(match[2])
          setLocation({ lng, lat })
        }
      }
      
      setInitialLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setInitialLoading(false)
    }
  }

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ lat: latitude, lng: longitude })
        setLocationError(null)
        
        if (profile?.id) {
          await supabase
            .from('profiles')
            .update({
              location: `SRID=4326;POINT(${longitude} ${latitude})`,
              last_location_update: new Date().toISOString()
            })
            .eq('id', profile.id)
        }
      },
      (error) => {
        setLocationError('Could not get your location')
      }
    )
  }

  const handleViewTask = (task: any) => {
    setSelectedTask(task)
    setShowTaskModal(true)
  }

  const handleAcceptTask = async (taskId: string) => {
    // Check verification status first
    if (verificationStatus !== 'verified') {
      const tier = VERIFICATION_TIERS[verificationStatus as keyof typeof VERIFICATION_TIERS] || VERIFICATION_TIERS.none
      const confirm = window.confirm(
        `You are ${tier.label}. Your commission rate will be ${tier.commission}%. ` +
        `Would you like to proceed? Get verified to reduce commission to 10%.`
      )
      if (!confirm) return
    }

    const result = await acceptTask(taskId)
    
    if (result.success) {
      alert('Task accepted! Check your dashboard for details.')
      setShowTaskModal(false)
      router.push('/freelancer/dashboard')
    } else {
      alert(result.message)
    }
  }

  const getVerificationTier = () => {
    const status = verificationStatus || profile?.verification_status || 'none'
    return VERIFICATION_TIERS[status as keyof typeof VERIFICATION_TIERS] || VERIFICATION_TIERS.none
  }

  const tier = getVerificationTier()

  if (initialLoading) {
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/freelancer/dashboard" className="text-blue-600 hover:text-blue-700 mb-2 inline-flex items-center">
                {`< Back to Dashboard`}
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Nearby Tasks</h1>
              <p className="text-sm text-gray-500">Tasks within 5km radius</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Verification Status Badge */}
              <div className={`px-3 py-1 rounded-full text-sm font-medium bg-${tier.color}-100 text-${tier.color}-800`}>
                {tier.label} ({tier.commission}% fee)
              </div>
              {!location && (
                <button
                  onClick={getLocation}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Enable Location
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Verification Warning */}
        {verificationStatus && verificationStatus !== 'verified' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">Verification Required</span>
              <div>
                <h3 className="font-medium text-yellow-800">
                  {verificationStatus === 'pending' 
                    ? 'Your verification is being reviewed'
                    : 'Get verified to access all nearby tasks'}
                </h3>
                <p className="text-sm text-yellow-600">
                  {verificationStatus === 'none' 
                    ? 'Upload your College ID and Government ID to reduce commission from 50% to 10%'
                    : 'You will be notified once your documents are approved'}
                </p>
              </div>
              {verificationStatus === 'none' && (
                <Link 
                  href="/freelancer/profile"
                  className="ml-auto px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Verify Now
                </Link>
              )}
            </div>
          </div>
        )}

        {locationError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">Location Required</span>
              <div>
                <h3 className="font-medium text-red-800">Location Required</h3>
                <p className="text-sm text-red-600">{locationError}</p>
              </div>
              <button onClick={getLocation} className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg">
                Try Again
              </button>
            </div>
          </div>
        )}

        {!location ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="text-6xl mb-4">Location Needed</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Enable Location</h3>
            <p className="text-gray-500 mb-6">We need your location to find tasks near you</p>
            <button
              onClick={getLocation}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Get My Location
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Finding nearby tasks...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="text-6xl mb-4">Error</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={refetch}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Try Again
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="text-6xl mb-4">No Tasks Nearby</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Immediate Tasks Near You</h3>
            <p className="text-gray-500 mb-6">No immediate mode tasks within 5km. Check back soon!</p>
            <Link href="/freelancer/all-tasks" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg">
              Browse All Tasks
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        Immediate
                      </span>
                      <span className="text-sm text-gray-500">{formatDistance(task.distance_meters)}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">+{Number(task.budget).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Budget</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2 mb-4">{task.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span>{task.client?.full_name || 'Anonymous'}</span>
                  <span>({task.client?.average_rating || 0} rating)</span>
                  <span className="capitalize">{task.category?.replace('_', ' ')}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewTask(task)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleAcceptTask(task.id)}
                    disabled={accepting === task.id}
                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {accepting === task.id ? 'Accepting...' : 'Accept Task'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                    Immediate Mode
                  </span>
                  <h2 className="text-xl font-semibold text-gray-900 mt-2">{selectedTask.title}</h2>
                </div>
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{selectedTask.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500">Budget</div>
                  <div className="text-xl font-bold text-blue-600">+{Number(selectedTask.budget).toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500">Distance</div>
                  <div className="text-xl font-bold text-gray-900">{formatDistance(selectedTask.distance_meters)}</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-500 mb-1">Location</div>
                <div className="text-gray-900">{selectedTask.address_text || 'Address not provided'}</div>
                <p className="text-xs text-gray-400 mt-1">
                  Exact location will be shown after acceptance
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-500 mb-1">Client</div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedTask.client?.full_name || 'Anonymous'}</span>
                  <span className="text-yellow-500">({selectedTask.client?.average_rating || 0})</span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-sm text-yellow-800">
                  <strong>Your Commission:</strong> {tier.commission}% 
                  ({tier.commission === 10 ? 'Verified rate' : 'Unverified rate'})
                </div>
                {tier.commission > 10 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Get verified to reduce commission to 10%
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => setShowTaskModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => handleAcceptTask(selectedTask.id)}
                disabled={accepting === selectedTask.id}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {accepting === selectedTask.id ? 'Accepting...' : 'Accept Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
