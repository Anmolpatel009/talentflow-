'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Divider } from '@/components/ui/Progress'
import { useToastContext } from '@/contexts/ToastContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  console.log("Supabase URL Check:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabase = createClient()
  const { showToast } = useToastContext()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log('🔐 Attempting login with:', email)

      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Login error:', error)
        if (error.message.includes('Failed to fetch') || error.message.includes('Network') || error.message.includes('timeout')) {
          showToast('error', 'Network connection error. Please check your internet connection and try again.')
        } else {
          showToast('error', error.message)
        }
        return
      }

      // Use user from sign-in response
      const user = signInData.user
      
      if (user) {
        console.log('✅ Login successful for user:', user.id)
        
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        // Determine redirect path
        let redirectPath = '/client/dashboard'
        if (profileError) {
          console.warn('⚠️ Profile not found:', profileError)
          // Profile might not exist, use role from user metadata
          const role = user.user_metadata?.role || 'client'
          redirectPath = role === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard'
        } else if (profile?.role === 'freelancer') {
          redirectPath = '/freelancer/dashboard'
        }

        // Show success toast and redirect
        showToast('success', 'Login successful! Redirecting...')
        
        // Use Next.js router for proper navigation
        router.push(redirectPath)
      }
    } catch (err: any) {
      console.error('🚨 Unexpected login error:', err)
      console.error('🚨 Error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack,
        cause: err.cause
      })
      
      if (err.message?.includes('Failed to fetch') || err.message?.includes('Network') || err.message?.includes('timeout')) {
        showToast('error', 'Network connection error. Please check your internet connection and try again.')
      } else {
        showToast('error', `An unexpected error occurred: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }



  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float delay-300" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-pink-400/20 rounded-full blur-2xl animate-float delay-500" />
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid opacity-10" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-2xl font-bold text-white">TalentFlow</span>
            </Link>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Connect with Local
            <br />
            <span className="text-white/80">Student Talent</span>
          </h1>
          
          <p className="text-lg text-white/70 mb-8 max-w-md">
            Join thousands of students and clients using TalentFlow to find and offer local services.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { value: '10K+', label: 'Freelancers' },
              { value: '50K+', label: 'Tasks Done' },
              { value: '4.9', label: 'Avg Rating' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom Decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-dots opacity-30" />
        
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-2xl font-bold text-foreground">TalentFlow</span>
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to continue to your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm flex items-start gap-3 animate-scale-in">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20" />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-primary hover:text-primary/80 font-medium">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={loading}>
              Sign In
            </Button>
          </form>



          {/* Sign Up Link */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="font-semibold text-primary hover:text-primary/80">
              Create an account
            </Link>
          </p>

          {/* Back to Home */}
          <Link 
            href="/" 
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground mt-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
