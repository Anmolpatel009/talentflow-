'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { StatsCard, MiniStats } from '@/components/ui/Stats'
import { Avatar } from '@/components/ui/Avatar'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { EmptyState, Spinner } from '@/components/ui/Progress'
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
  started_at?: string
  completed_at?: string
  address_text?: string
}

interface Handshake {
  freelancer_id: string
  freelancer?: {
    full_name: string
    phone: string
    average_rating: number
  }
}

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [handshakes, setHandshakes] = useState<Record<string, Handshake>>({})
  const [showOTPModal, setShowOTPModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [generatedOTP, setGeneratedOTP] = useState<string>('')
  const [otpType, setOtpType] = useState<'start' | 'end'>('start')
  const [processing, setProcessing] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string>('all')
  
  const router = useRouter()
  const supabase = createClient()

  const fetchTasks = useCallback(async (profileId: string) => {
    if (!profileId) return; // Reality check: don't fetch without an ID
    
    setLoading(true);
    try {
      // 1. Fetch only tasks where THIS client is the owner
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('client_id', profileId) // Crucial: Filter by the Profile ID, not Auth ID
        .order('created_at', { ascending: false });
  
      if (error) throw error;
      setTasks(data || []);
  
      // 2. Extract IDs for tasks that have a freelancer assigned
      const assignedTaskIds = (data || [])
        .filter(t => ['assigned', 'in_progress', 'review'].includes(t.status))
        .map(t => t.id);
  
      if (assignedTaskIds.length > 0) {
        const { data: handshakeData, error: handshakeError } = await supabase
          .from('task_handshakes')
          .select(`
            task_id,
            freelancer:freelancer_id (
              full_name,
              phone,
              average_rating
            )
          `)
          .in('task_id', assignedTaskIds)
          .eq('is_cancelled', false);
  
        if (handshakeError) throw handshakeError;
  
        if (handshakeData) {
          const handshakeMap: Record<string, Handshake> = {};
          handshakeData.forEach((h: any) => {
            handshakeMap[h.task_id] = h;
          });
          setHandshakes(handshakeMap);
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (!profile?.id) return

    let isSubscribed = false
    let pollInterval: NodeJS.Timeout | null = null

    const channel = supabase
      .channel('client-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          fetchTasks(profile.id)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_handshakes'
        },
        (payload: { new: Record<string, unknown> }) => {
          fetchTasks(profile.id)
        }
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
            pollInterval = setInterval(() => {
              fetchTasks(profile.id)
            }, 5000)
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

      if (profileData?.role && profileData.role !== 'client') {
        router.push('/freelancer/dashboard')
        return
      }

      setUser(user)
      setProfile(profileData)
      fetchTasks(profileData.id)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/auth/login')
    }
  }

  const generateOTP = async (taskId: string, type: 'start' | 'end') => {
    setProcessing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/tasks/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ taskId, otpType: type })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to generate OTP')
        return
      }

      setSelectedTask(tasks.find(t => t.id === taskId) || null)
      setGeneratedOTP(data.otp)
      setOtpType(type)
      setShowOTPModal(true)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to generate OTP'
      alert(message)
    } finally {
      setProcessing(false)
    }
  }

  const markComplete = async (taskId: string, budget: number) => {
    setProcessing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/tasks/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ taskId, newStatus: 'completed' })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Failed to update task')
        return
      }

      router.push(`/client/tasks/${taskId}/payment?amount=${budget}`)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update task'
      alert(message)
    } finally {
      setProcessing(false)
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

  const filteredTasks = activeFilter === 'all' 
    ? tasks 
    : tasks.filter(t => t.status === activeFilter)

  const stats = {
    open: tasks.filter(t => t.status === 'open').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    completed: tasks.filter(t => t.status === 'completed').length,
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
            <Link href="/client/dashboard" className="sidebar-item active">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            <Link href="/client/tasks/create" className="sidebar-item">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Post New Task
            </Link>
            <Link href="/client/profile" className="sidebar-item">
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
          <Link href="/client/tasks/create" className="p-2 rounded-lg bg-primary text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back, {profile?.full_name?.split(' ')[0]}! 👋</p>
            </div>
            <Link href="/client/tasks/create">
              <Button size="lg" leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }>
                Post New Task
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Open Tasks"
              value={stats.open}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <StatsCard
              title="In Progress"
              value={stats.inProgress}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />
            <StatsCard
              title="In Review"
              value={stats.review}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              }
            />
            <StatsCard
              title="Completed"
              value={stats.completed}
              gradient
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
            />
          </div>

          {/* Tasks Section */}
          <Card variant="default" padding="none">
            <div className="p-6 border-b border-border">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-xl font-semibold text-foreground">Your Tasks</h2>
                
                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'open', label: 'Open' },
                    { key: 'in_progress', label: 'In Progress' },
                    { key: 'completed', label: 'Completed' },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setActiveFilter(filter.key)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                        activeFilter === filter.key
                          ? 'bg-primary text-white'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
                title="No tasks found"
                description={activeFilter === 'all' ? "You haven't created any tasks yet. Get started by posting your first task!" : `No ${activeFilter.replace('_', ' ')} tasks.`}
                action={
                  activeFilter === 'all' && (
                    <Link href="/client/tasks/create">
                      <Button>Create Your First Task</Button>
                    </Link>
                  )
                }
              />
            ) : (
              <div className="divide-y divide-border">
                {filteredTasks.map((task, index) => (
                  <div
                    key={task.id}
                    className="p-6 hover:bg-muted/30 transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{task.title}</h3>
                          {getStatusBadge(task.status)}
                          <Badge variant="outline">{task.mode}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{task.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="text-lg">💰</span>
                            ₹{task.budget.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="text-lg">📁</span>
                            {task.category}
                          </span>
                          {task.address_text && (
                            <span className="flex items-center gap-1">
                              <span className="text-lg">📍</span>
                              {task.address_text}
                            </span>
                          )}
                        </div>

                        {/* Freelancer Info */}
                        {['assigned', 'in_progress', 'review'].includes(task.status) && handshakes[task.id]?.freelancer && (
                          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <div className="flex items-center gap-3">
                              <Avatar name={handshakes[task.id].freelancer?.full_name} size="md" />
                              <div>
                                <p className="font-medium text-foreground">
                                  {handshakes[task.id].freelancer?.full_name}
                                </p>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span>📞 {handshakes[task.id].freelancer?.phone}</span>
                                  {handshakes[task.id].freelancer?.average_rating && (
                                    <span className="flex items-center gap-1">
                                      <span className="text-amber-400">★</span>
                                      {handshakes[task.id].freelancer?.average_rating.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex lg:flex-col gap-2">
                        <Link href={`/client/tasks/${task.id}`}>
                          <Button variant="secondary" size="sm">
                            View Details
                          </Button>
                        </Link>
                        
                        {task.status === 'assigned' && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => generateOTP(task.id, 'start')}
                            isLoading={processing}
                          >
                            Start OTP
                          </Button>
                        )}
                        
                        {task.status === 'in_progress' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => generateOTP(task.id, 'end')}
                            isLoading={processing}
                          >
                            End OTP
                          </Button>
                        )}
                        
                        {task.status === 'review' && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => markComplete(task.id, task.budget)}
                            isLoading={processing}
                          >
                            Complete & Pay
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* OTP Modal */}
      <Modal
        open={showOTPModal}
        onOpenChange={setShowOTPModal}
        title={`${otpType === 'start' ? 'Start' : 'End'} Task OTP`}
        description={`Share this OTP with the freelancer to ${otpType === 'start' ? 'start' : 'end'} the task:`}
      >
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-full p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
            <span className="text-4xl font-bold text-primary tracking-widest">
              {generatedOTP}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            This OTP expires in 30 minutes
          </p>
        </div>
        <Button className="w-full" onClick={() => setShowOTPModal(false)}>
          Close
        </Button>
      </Modal>
    </div>
  )
}
