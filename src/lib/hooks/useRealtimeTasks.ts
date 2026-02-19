'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NearbyTask {
  id: string
  title: string
  description: string
  budget: number
  category: string
  mode: string
  distance_meters: number
  address_text?: string
  acceptance_deadline?: string
  client?: {
    full_name: string
    average_rating: number
    verification_status: string
  }
}

interface UseRealtimeTasksOptions {
  lat: number | null
  lng: number | null
  radius?: number
  enabled?: boolean
}

interface UseRealtimeTasksReturn {
  tasks: NearbyTask[]
  loading: boolean
  error: string | null
  verificationStatus: string | null
  refetch: () => Promise<void>
}

export function useRealtimeTasks({
  lat,
  lng,
  radius = 5000,
  enabled = true
}: UseRealtimeTasksOptions): UseRealtimeTasksReturn {
  const [tasks, setTasks] = useState<NearbyTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null)
  
  const supabase = createClient()

  const fetchTasks = useCallback(async () => {
    if (!lat || !lng) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Get the current session to pass auth token
      const { data: { session } } = await supabase.auth.getSession()
      
      const params = new URLSearchParams({
        lat: lat.toString(),
        lng: lng.toString(),
        radius: radius.toString()
      })

      const response = await fetch(`/api/tasks/nearby?${params}`, {
        headers: {
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tasks')
      }

      setTasks(data.tasks || [])
      setVerificationStatus(data.verification_status)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks'
      console.error('Error fetching nearby tasks:', err)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [lat, lng, radius])

  // Initial fetch
  useEffect(() => {
    if (enabled && lat && lng) {
      fetchTasks()
    }
  }, [enabled, lat, lng, radius, fetchTasks])

  // Real-time subscription
  useEffect(() => {
    if (!enabled || !lat || !lng) return

    // Subscribe to task changes
    const taskChannel = supabase
      .channel('nearby-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: 'status=eq.open'
        },
        (payload: { new: Record<string, unknown> }) => {
          console.log('New task inserted:', payload)
          // Refetch to get distance calculation
          fetchTasks()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks'
        },
        (payload: { new: Record<string, unknown> }) => {
          console.log('Task updated:', payload)
          const updatedTask = payload.new as { id: string; status: string }
          
          if (updatedTask.status !== 'open') {
            // Remove from list if no longer open
            setTasks(prev => prev.filter(t => t.id !== updatedTask.id))
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tasks'
        },
        (payload: { old: Record<string, unknown> }) => {
          console.log('Task deleted:', payload)
          const deletedTask = payload.old as { id: string }
          setTasks(prev => prev.filter(t => t.id !== deletedTask.id))
        }
      )
      .subscribe((status: string) => {
        console.log('Subscription status:', status)
      })

    return () => {
      taskChannel.unsubscribe()
    }
  }, [enabled, lat, lng, supabase, fetchTasks])

  return {
    tasks,
    loading,
    error,
    verificationStatus,
    refetch: fetchTasks
  }
}

// Hook for task acceptance with optimistic updates
export function useTaskAcceptance() {
  const [accepting, setAccepting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const acceptTask = async (taskId: string): Promise<{ success: boolean; message: string }> => {
    setAccepting(taskId)
    setError(null)

    try {
      // Get the current session to pass auth token
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/tasks/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ taskId })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || data.error)
        return { success: false, message: data.message || data.error }
      }

      return { success: true, message: 'Task accepted successfully!' }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to accept task'
      setError(message)
      return { success: false, message }
    } finally {
      setAccepting(null)
    }
  }

  return {
    acceptTask,
    accepting,
    error
  }
}
