'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { StatsCard, MiniStats, ProgressRing } from '@/components/ui/Stats'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { EmptyState, Spinner, Divider } from '@/components/ui/Progress'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

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
  address_text: string
  geo_location: string
  client?: {
    full_name: string
    city: string
    phone: string
  }
}

interface Handshake {
  id: string
  task_id: string
  freelancer_id: string
  accepted_at: string
  is_cancelled: boolean
  cancelled_reason: string | null
  task?: Task
}

export default function FreelancerDashboard() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Handshake[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [enteredOTP, setEnteredOTP] = useState('')
  const [otpAction, setOtpAction] = useState<'start' | 'end'>('start')
  const [processing, setProcessing] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number} | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.log('Could not get location:', error.message)
        }
      )
    }
  }, [])

  const openDirections = (task: Task) => {
    let destLat: number | null = null
    let destLng: number | null = null

    if (task.geo_location) {
      const match = task.geo_location.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/)
      if (match) {
        destLng = parseFloat(match[1])
        destLat = parseFloat(match[2])
      }
    }

    if (destLat && destLng) {
      const baseUrl = 'https://www.google.com/maps/dir/?api=1'
      const params = new URLSearchParams()
      params.append('destination', `${destLat},${destLng}`)
      if (currentLocation) {
        params.append('origin', `${currentLocation.lat},${currentLocation.lng}`)
      }
      window.open(`${baseUrl}&${params.toString()}`, '_blank')
    } else if (task.address_text) {
      window.open(`https://www.google.com/maps/search/${encodeURIComponent(task.address_text)}`, '_blank')
    } else {
      alert('Location not available for this task')
    }
  }

  useEffect(() => {
    checkUser()
  }, [])

  const fetchTasks = useCallback(async (profileId: string) => {
    try {
      console.log('Fetching tasks for profile:', profileId)
      const { data, error } = await supabase
        .from('task_handshakes')
        .select(`
          *,
          tasks (
            *,
            client_id (
              full_name,
              city,
              phone
            )
          )
        `)
        .eq('freelancer_id', profileId)
        .eq('is_cancelled', false)
        .order('accepted_at', { ascending: false })

      if (error) {
        console.error('Supabase error fetching tasks:', error)
        throw error
      }
      
      console.log('Fetched tasks raw data:', data)
      
      // Fix the data structure to ensure consistency with the interface
      const formattedData = data.map(handshake => ({
        ...handshake,
        task: handshake.tasks || null
      }))
      
      console.log('Formatted tasks data:', formattedData)
      setTasks(formattedData || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (!profile?.id) return

    let isSubscribed = false
    let pollInterval: NodeJS.Timeout | null = null

    const channel = supabase
      .channel('freelancer-tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchTasks(profile.id)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_handshakes' },
        () => fetchTasks(profile.id)
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          isSubscribed = true
          if (pollInterval) {
            clearInterval(pollInterval)
            pollInterval = null
          }
        }
        
        if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && !isSubscribed) {
          if (!pollInterval) {
            pollInterval = setInterval(() => fetchTasks(profile.id), 5000)
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
      // 1. Get the Auth User (The 98be... ID)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }
  
      // 2. Fetch the actual Profile record (The 54fe... ID)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, verification_status')
        .eq('user_id', user.id)
        .single()
  
      if (profileError || !profileData) {
        console.error("Profile not found for this user")
        return
      }
  
      // 3. Update state and fetch tasks using the PROFILE ID
      setUser(user)
      setProfile(profileData) 
      fetchTasks(profileData.id) // <--- THIS is the 54fe... ID the DB wants
  
    } catch (error) {
      console.error('Logic Error:', error)
    }
  }

  const requestOTP = async (taskId: string, type: 'start' | 'end') => {
    setSelectedTask(tasks.find(t => t.task?.id === taskId)?.task || null)
    setOtpAction(type)
    setEnteredOTP('')
    setShowOTPModal(true)
  }

  const verifyOTPAndProceed = async () => {
    if (!selectedTask || !enteredOTP) return

    setProcessing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/tasks/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          taskId: selectedTask.id,
          newStatus: otpAction === 'start' ? 'in_progress' : 'review',
          otp: enteredOTP
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to verify OTP')
        return
      }

      setShowOTPModal(false)
      alert(otpAction === 'start' 
        ? 'Task started! Work on the task and submit when done.' 
        : 'Task submitted for review! Waiting for client approval.')
      
      if (profile?.id) {
        fetchTasks(profile.id)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to verify OTP'
      alert(message)
    } finally {
      setProcessing(false)
    }
  }

  const cancelTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to cancel this task?')) return

    try {
      const { error } = await supabase
        .from('task_handshakes')
        .update({ 
          is_cancelled: true,
          cancelled_reason: 'Cancelled by freelancer'
        })
        .eq('task_id', taskId)

      if (error) throw error

      await supabase
        .from('tasks')
        .update({ status: 'cancelled' })
        .eq('id', taskId)

      if (profile?.id) {
        fetchTasks(profile.id)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to cancel task'
      alert(message)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'primary' | 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
      open: { variant: 'info', label: 'Open' },
      assigned: { variant: 'warning', label: 'Assigned' },
      in_progress: { variant: 'primary', label: 'In Progress' },
      review: { variant: 'warning', label: 'In Review' },
      completed: { variant: 'success', label: 'Completed' },
      cancelled: { variant: 'danger', label: 'Cancelled' },
    }
    const config = statusConfig[status] || { variant: 'primary', label: status }
    return <Badge variant={config.variant} dot>{config.label}</Badge>
  }

  const getStatusInstructions = (status: string) => {
    switch (status) {
      case 'assigned':
        return { icon: '📍', text: 'Contact the client to get the START OTP code, then click "Start Task"' }
      case 'in_progress':
        return { icon: '🔧', text: 'Work on the task. When done, ask client for END OTP and click "Submit for Review"' }
      case 'review':
        return { icon: '⏳', text: 'Waiting for client to approve and mark as complete' }
      case 'completed':
        return { icon: '✅', text: 'Task completed! Payment will be processed.' }
      default:
        return { icon: '', text: '' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" variant="primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const activeTasks = tasks.filter(t => ['assigned', 'in_progress', 'review'].includes(t.task?.status || ''))
  const completedTasks = tasks.filter(t => t.task?.status === 'completed')
  const totalEarnings = completedTasks.reduce((sum, t) => sum + Number(t.task?.budget || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-xl font-bold text-foreground">TalentFlow</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <Link href="/freelancer/dashboard" className="sidebar-item active">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            <Link href="/freelancer/nearby-tasks" className="sidebar-item">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Nearby Tasks
            </Link>
            <Link href="/freelancer/all-tasks" className="sidebar-item">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Browse All Tasks
            </Link>
            <Link href="/freelancer/applications" className="sidebar-item">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              My Applications
            </Link>
            <Link href="/freelancer/profile" className="sidebar-item">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </Link>
            <Link href="/messages" className="sidebar-item">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Messages
            </Link>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <Avatar name={profile?.full_name || 'User'} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              </div>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/auth/login')
                }}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold text-foreground">TalentFlow</span>
          </Link>
          <Link href="/freelancer/nearby-tasks" className="p-2 rounded-lg bg-primary text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Freelancer Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back, {profile?.full_name?.split(' ')[0]}! 👋</p>
            </div>
            <div className="flex gap-3">
              <Link href="/freelancer/nearby-tasks">
                <Button variant="secondary" size="lg" leftIcon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                }>
                  Nearby Tasks
                </Button>
              </Link>
              <Link href="/freelancer/all-tasks">
                <Button size="lg" leftIcon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }>
                  Browse All
                </Button>
              </Link>
            </div>
          </div>

          {/* Verification Banner */}
          {profile?.verification_status !== 'verified' && (
            <Card variant="default" className="mb-8 bg-amber-500/5 border-amber-500/20">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Get Verified for 10% Commission</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your college ID and government ID to access nearby tasks with reduced commission.
                  </p>
                </div>
                <Link href="/freelancer/profile">
                  <Button variant="secondary">Get Verified</Button>
                </Link>
              </div>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Active Tasks"
              value={activeTasks.length}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />
            <StatsCard
              title="Completed"
              value={completedTasks.length}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
            />
            <StatsCard
              title="Total Earnings"
              value={`₹${totalEarnings.toLocaleString()}`}
              gradient
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatsCard
              title="Your Rating"
              value={profile?.average_rating ? profile.average_rating.toFixed(1) : 'N/A'}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
            />
          </div>

          {/* Tasks Section */}
          <Card variant="default" padding="none">
            <div className="p-6 border-b border-border">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-xl font-semibold text-foreground">Your Tasks</h2>
                
                {/* Tab Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('active')}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      activeTab === 'active'
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Active ({activeTasks.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('completed')}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      activeTab === 'completed'
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Completed ({completedTasks.length})
                  </button>
                </div>
              </div>
            </div>

            {activeTab === 'active' && activeTasks.length === 0 && (
              <EmptyState
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
                title="No active tasks"
                description="You don't have any active tasks right now. Find nearby tasks to start earning!"
                action={
                  <Link href="/freelancer/nearby-tasks">
                    <Button>Find Nearby Tasks</Button>
                  </Link>
                }
              />
            )}

            {activeTab === 'active' && activeTasks.length > 0 && (
              <div className="divide-y divide-border">
                {activeTasks.map((handshake, index) => (
                  <div
                    key={handshake.id}
                    className="p-6 hover:bg-muted/30 transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {getStatusBadge(handshake.task?.status || '')}
                          {handshake.task?.mode === 'immediate' && (
                            <Badge variant="danger">IMMEDIATE</Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">{handshake.task?.title}</h3>
                        <p className="text-muted-foreground text-sm mb-3">{handshake.task?.description}</p>

                        {/* Status Instructions */}
                        <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 mb-4">
                          <p className="text-sm text-foreground">
                            {getStatusInstructions(handshake.task?.status || '').icon}{' '}
                            {getStatusInstructions(handshake.task?.status || '').text}
                          </p>
                        </div>

                        {/* Task Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Client:</span>
                            <p className="font-medium text-foreground">{handshake.task?.client?.full_name || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Location:</span>
                            <p className="font-medium text-foreground">{handshake.task?.address_text || 'See directions'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Accepted:</span>
                            <p className="font-medium text-foreground">{new Date(handshake.accepted_at).toLocaleDateString()}</p>
                          </div>
                          {handshake.task?.started_at && (
                            <div>
                              <span className="text-muted-foreground">Started:</span>
                              <p className="font-medium text-foreground">{new Date(handshake.task.started_at).toLocaleTimeString()}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Budget & Actions */}
                      <div className="flex lg:flex-col items-center lg:items-end gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gradient">+₹{Number(handshake.task?.budget || 0).toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground capitalize">{handshake.task?.category?.replace('_', ' ')}</div>
                        </div>
                        
                        <div className="flex lg:flex-col gap-2">
                          {(handshake.task?.geo_location || handshake.task?.address_text) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDirections(handshake.task!)}
                              leftIcon={
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                              }
                            >
                              Directions
                            </Button>
                          )}
                          
                          {handshake.task?.status === 'assigned' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => requestOTP(handshake.task!.id, 'start')}
                              >
                                Start Task
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => cancelTask(handshake.task!.id)}
                                className="text-red-500 hover:text-red-600"
                              >
                                Cancel
                              </Button>
                            </>
                          )}
                          
                          {handshake.task?.status === 'in_progress' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => requestOTP(handshake.task!.id, 'end')}
                              >
                                Submit for Review
                              </Button>
                              <Link href={`/messages/${handshake.task!.id}`}>
                                <Button variant="ghost" size="sm">
                                  Chat
                                </Button>
                              </Link>
                            </>
                          )}
                          
                          {handshake.task?.status === 'review' && (
                            <Link href={`/messages/${handshake.task!.id}`}>
                              <Button variant="secondary" size="sm">
                                Chat with Client
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'completed' && completedTasks.length > 0 && (
              <div className="divide-y divide-border">
                {completedTasks.map((handshake, index) => (
                  <div
                    key={handshake.id}
                    className="p-6 hover:bg-muted/30 transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{handshake.task?.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Completed {handshake.task?.completed_at ? new Date(handshake.task.completed_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="text-xl font-bold text-emerald-500">
                        +₹{Number(handshake.task?.budget || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'completed' && completedTasks.length === 0 && (
              <EmptyState
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                }
                title="No completed tasks yet"
                description="Complete your active tasks to see them here."
              />
            )}
          </Card>
        </div>
      </main>

      {/* OTP Modal */}
      <Modal
        open={showOTPModal}
        onOpenChange={setShowOTPModal}
        title={otpAction === 'start' ? 'Start Task' : 'Submit for Review'}
        description={otpAction === 'start' 
          ? 'Ask the client for the 4-digit START OTP code to begin working on this task.'
          : 'Ask the client for the 4-digit END OTP code to submit this task for review.'}
      >
        <div className="space-y-4">
          <Input
            label="Enter OTP Code"
            placeholder="0000"
            value={enteredOTP}
            onChange={(e) => setEnteredOTP(e.target.value.replace(/\D/g, ''))}
            className="text-center text-2xl tracking-widest"
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowOTPModal(false)}>
              Cancel
            </Button>
            <Button 
              className="flex-1" 
              onClick={verifyOTPAndProceed}
              disabled={enteredOTP.length !== 4 || processing}
              isLoading={processing}
            >
              Verify & Proceed
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
