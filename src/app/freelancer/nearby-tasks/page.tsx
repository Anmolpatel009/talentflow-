'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface NearbyTask {
  id: string
  title: string
  description: string
  category: string
  mode: string
  budget: number
  distance_meters: number
  client?: {
    full_name: string
    average_rating: number
  }
}

export default function NearbyTasksPage() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<NearbyTask[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [acceptingTask, setAcceptingTask] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
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
          fetchNearbyTasks(lng, lat)
          return
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
        setLoading(true)
        
        if (profile?.id) {
          await supabase
            .from('profiles')
            .update({
              location: `SRID=4326;POINT(${longitude} ${latitude})`,
              last_location_update: new Date().toISOString()
            })
            .eq('id', profile.id)
        }

        fetchNearbyTasks(longitude, latitude)
      },
      (error) => {
        setLocationError('Could not get your location')
        setLoading(false)
      }
    )
  }

  const fetchNearbyTasks = async (lng: number, lat: number) => {
    try {
      console.log('Fetching nearby tasks for:', lng, lat)
      
      // Try PostGIS function
      const { data: funcData, error: funcError } = await supabase
        .rpc('find_nearby_tasks', {
          user_lat: lat,
          user_lng: lng,
          radius_meters: 5000
        })

      if (funcError) {
        console.warn('find_nearby_tasks function error:', funcError)
        // Fallback query
        const { data: fallbackData } = await supabase
          .from('tasks')
          .select('*, client:client_id(full_name, average_rating)')
          .eq('status', 'open')
          .eq('is_nearby', true)
          .limit(20)

        console.log('Fallback tasks found:', fallbackData?.length)
        setTasks((fallbackData || []).map((t: any) => ({
          ...t,
          distance_meters: 0
        })))
      } else {
        console.log('Function returned:', funcData?.length, 'tasks')
        
        if (funcData && funcData.length > 0) {
          const taskIds = funcData.map((t: any) => t.id)
          const { data: taskDetails } = await supabase
            .from('tasks')
            .select('*, client:client_id(full_name, average_rating)')
            .in('id', taskIds)

          setTasks((taskDetails || []).map((t: any) => ({
            ...t,
            distance_meters: funcData.find((d: any) => d.id === t.id)?.distance_meters || 0
          })))
        } else {
          setTasks([])
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setTasks([])
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }

  const handleAcceptTask = async (taskId: string) => {
    try {
      setAcceptingTask(taskId)

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profileData) {
        alert('Profile not found')
        return
      }

      const { error } = await supabase
        .from('task_handshakes')
        .insert({
          task_id: taskId,
          freelancer_id: profileData.id,
        })

      if (error) {
        if (error.code === '23505') {
          alert('You have already accepted this task')
        } else {
          alert(`Error: ${error.message}`)
        }
        return
      }

      await supabase
        .from('tasks')
        .update({ status: 'assigned' })
        .eq('id', taskId)

      alert('Task accepted! You can now start working on it.')
      router.push('/freelancer/dashboard')
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setAcceptingTask(null)
    }
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m away`
    return `${(meters / 1000).toFixed(1)}km away`
  }

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
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">📍 Nearby Tasks</h1>
              <p className="text-sm text-gray-500">Tasks within 5km</p>
            </div>
            {!location && (
              <button
                onClick={getLocation}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                📍 Enable Location
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {locationError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
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
            <div className="text-6xl mb-4">📍</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Enable Location</h3>
            <p className="text-gray-500 mb-6">We need your location to find tasks near you</p>
            <button
              onClick={getLocation}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              📍 Get My Location
            </button>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Finding nearby tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Tasks Nearby</h3>
            <p className="text-gray-500 mb-6">No immediate mode tasks near you right now</p>
            <Link href="/freelancer/all-tasks" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg">
              Browse All Tasks
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        ⚡ Immediate
                      </span>
                      <span className="text-sm text-gray-500">{formatDistance(task.distance_meters)}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">₹{Number(task.budget).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Budget</div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm line-clamp-2 mb-4">{task.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span>👤 {task.client?.full_name || 'Anonymous'}</span>
                  <span>⭐ {task.client?.average_rating || 0}</span>
                  <span className="capitalize">{task.category?.replace('_', ' ')}</span>
                </div>
                <button
                  onClick={() => handleAcceptTask(task.id)}
                  disabled={acceptingTask === task.id}
                  className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {acceptingTask === task.id ? 'Accepting...' : '✓ Accept Task'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
