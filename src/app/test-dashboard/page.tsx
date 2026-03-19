'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestDashboard() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setError('User not authenticated')
          setLoading(false)
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (profileData?.role !== 'freelancer') {
          setError('Not a freelancer account')
          setLoading(false)
          return
        }

        setProfile(profileData)
        
        const { data: handshakes, error: handshakesError } = await supabase
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
          .eq('freelancer_id', profileData.id)
          .eq('is_cancelled', false)
          .order('accepted_at', { ascending: false })

        if (handshakesError) throw handshakesError

        const activeTasks = handshakes.filter(t => ['assigned', 'in_progress', 'review'].includes(t.task?.status || ''))
        setTasks(activeTasks)
        
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    checkUser()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          Dashboard Test - Active Tasks
        </h1>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">User Profile</h2>
          <p><strong>Name:</strong> {profile?.full_name}</p>
          <p><strong>Role:</strong> {profile?.role}</p>
          <p><strong>Profile ID:</strong> {profile?.id}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Active Tasks ({tasks.length})</h2>
          
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No active tasks</p>
              <p className="text-sm mt-2">Try accepting a task to see it here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map(task => (
                <div key={task.id} className="border p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">
                        {task.task?.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{task.task?.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          task.task?.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                          task.task?.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {task.task?.status}
                        </span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          ${task.task?.budget}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {task.task?.client && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">Client</h4>
                      <p className="text-gray-600">{task.task.client.full_name}</p>
                      {task.task.client.phone && (
                        <p className="text-gray-600 text-sm">{task.task.client.phone}</p>
                      )}
                      {task.task.client.city && (
                        <p className="text-gray-600 text-sm">{task.task.client.city}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
