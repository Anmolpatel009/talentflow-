'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { TASK_CATEGORIES } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Divider } from '@/components/ui/Progress'
import { cn } from '@/lib/utils'

function SignupContent() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const role = (searchParams.get('role') as 'client' | 'freelancer') || 'client'

  // Step 1: Basic Info
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [selectedRole, setSelectedRole] = useState<'client' | 'freelancer'>(role)

  // Step 2: Freelancer Additional Info
  const [collegeName, setCollegeName] = useState('')
  const [collegeIdFile, setCollegeIdFile] = useState<File | null>(null)
  const [govIdFile, setGovIdFile] = useState<File | null>(null)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])

  // Step 3: Location
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (!authData.user) {
        setError('Signup failed')
        return
      }

      // 2. Upload Files if freelancer
      let collegeIdUrl = null
      let govIdUrl = null

      if (selectedRole === 'freelancer' && collegeIdFile && govIdFile) {
        const userId = authData.user.id

        // Upload College ID
        const collegeIdPath = `verification/${userId}/college_id_${Date.now()}`
        const { error: collegeUploadError } = await supabase.storage
          .from('documents')
          .upload(collegeIdPath, collegeIdFile)

        if (!collegeUploadError) {
          const collegeUrl = supabase.storage
            .from('documents')
            .getPublicUrl(collegeIdPath)
          collegeIdUrl = (collegeUrl as { data: { publicUrl: string } }).data.publicUrl
        }

        // Upload Gov ID
        const govIdPath = `verification/${userId}/gov_id_${Date.now()}`
        const { error: govUploadError } = await supabase.storage
          .from('documents')
          .upload(govIdPath, govIdFile)

        if (!govUploadError) {
          const govUrl = supabase.storage
            .from('documents')
            .getPublicUrl(govIdPath)
          govIdUrl = (govUrl as { data: { publicUrl: string } }).data.publicUrl
        }
      }

      // 3. Update or Insert Profile
      const updateResult = await supabase
        .from('profiles')
        .update({
          role: selectedRole,
          full_name: fullName,
          phone,
          city,
          location: location
            ? `SRID=4326;POINT(${location.lng} ${location.lat})`
            : null,
          last_location_update: location ? new Date().toISOString() : null,
          college_name: selectedRole === 'freelancer' ? collegeName : null,
          college_id_url: collegeIdUrl,
          gov_id_url: govIdUrl,
          skills: selectedRole === 'freelancer' ? selectedSkills : [],
          verification_status: selectedRole === 'freelancer' ? 'pending' : 'none',
        })
        .eq('user_id', authData.user.id)
        .select()

      if (updateResult.error) {
        setError(`Database error in saving new user: ${updateResult.error.message}`)
        return
      }

      if (!updateResult.data || updateResult.data.length === 0) {
        // Profile doesn't exist, create it instead
        const insertResult = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            email: email,
            role: selectedRole,
            full_name: fullName,
            phone,
            city,
            location: location
              ? `SRID=4326;POINT(${location.lng} ${location.lat})`
              : null,
            last_location_update: location ? new Date().toISOString() : null,
            college_name: selectedRole === 'freelancer' ? collegeName : null,
            college_id_url: collegeIdUrl,
            gov_id_url: govIdUrl,
            skills: selectedRole === 'freelancer' ? selectedSkills : [],
            verification_status: selectedRole === 'freelancer' ? 'pending' : 'none',
          })
        
        if (insertResult.error) {
          setError(`Database error in saving new user: ${insertResult.error.message}`)
          return
        }
      }

      // Success - redirect to dashboard
      router.push(selectedRole === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard')
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
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

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill))
    } else {
      setSelectedSkills([...selectedSkills, skill])
    }
  }

  const totalSteps = selectedRole === 'freelancer' ? 3 : 2

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
            Start Your
            <br />
            <span className="text-white/80">Journey Today</span>
          </h1>
          
          <p className="text-lg text-white/70 mb-8 max-w-md">
            {selectedRole === 'freelancer' 
              ? 'Join thousands of students earning while learning. Set your own hours, choose your projects.'
              : 'Find verified student freelancers in your neighborhood. Get quality work at fair prices.'}
          </p>
          
          {/* Benefits */}
          <div className="space-y-4">
            {selectedRole === 'freelancer' ? (
              <>
                {[
                  { icon: '💰', text: 'Earn on your own schedule' },
                  { icon: '🎓', text: 'Get verified for lower fees' },
                  { icon: '📍', text: 'Work locally, no commute' },
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 text-white/90">
                    <span className="text-xl">{benefit.icon}</span>
                    <span>{benefit.text}</span>
                  </div>
                ))}
              </>
            ) : (
              <>
                {[
                  { icon: '⚡', text: 'Instant task matching' },
                  { icon: '✅', text: 'Verified student talent' },
                  { icon: '🔒', text: 'Secure payments' },
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 text-white/90">
                    <span className="text-xl">{benefit.icon}</span>
                    <span>{benefit.text}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
        
        {/* Bottom Decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background relative overflow-y-auto">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-dots opacity-30" />
        
        <div className="w-full max-w-md relative z-10 py-8">
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
            <h2 className="text-3xl font-bold text-foreground mb-2">Create your account</h2>
            <p className="text-muted-foreground">Step {step} of {totalSteps}</p>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2 mb-8">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all duration-300',
                  index < step ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
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

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-5 animate-fade-in-up">
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    I want to
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('client')}
                      className={cn(
                        'p-4 rounded-xl border-2 text-center transition-all duration-200',
                        selectedRole === 'client'
                          ? 'border-primary bg-primary/5 shadow-soft'
                          : 'border-border hover:border-primary/30 hover:bg-muted/50'
                      )}
                    >
                      <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl mb-2">
                        💼
                      </div>
                      <div className="font-semibold text-foreground">Hire Help</div>
                      <div className="text-xs text-muted-foreground mt-1">I'm a client</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRole('freelancer')}
                      className={cn(
                        'p-4 rounded-xl border-2 text-center transition-all duration-200',
                        selectedRole === 'freelancer'
                          ? 'border-primary bg-primary/5 shadow-soft'
                          : 'border-border hover:border-primary/30 hover:bg-muted/50'
                      )}
                    >
                      <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl mb-2">
                        💪
                      </div>
                      <div className="font-semibold text-foreground">Work</div>
                      <div className="text-xs text-muted-foreground mt-1">I'm a freelancer</div>
                    </button>
                  </div>
                </div>

                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />

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
                  hint="At least 6 characters"
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required={selectedRole === 'client'}
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  }
                />

                <Input
                  label="City"
                  placeholder="Mumbai, Delhi, Bangalore..."
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                />

                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full"
                  size="lg"
                  rightIcon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  }
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Step 2: Freelancer Additional Info */}
            {step === 2 && selectedRole === 'freelancer' && (
              <div className="space-y-5 animate-fade-in-up">
                <Card variant="default" className="bg-primary/5 border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Student Verification</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload your documents to get verified and access nearby tasks with 10% commission.
                      </p>
                    </div>
                  </div>
                </Card>

                <Input
                  label="College Name"
                  placeholder="IIT Mumbai, DU, etc."
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  required
                  leftIcon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                  }
                />

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    College ID Card
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      required={!collegeIdFile}
                      onChange={(e) => setCollegeIdFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="collegeId"
                    />
                    <label
                      htmlFor="collegeId"
                      className="flex items-center justify-center gap-3 px-4 py-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors"
                    >
                      {collegeIdFile ? (
                        <>
                          <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-foreground font-medium">{collegeIdFile.name}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-muted-foreground">Upload College ID</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Government ID (Aadhaar/DigLocker)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      required={!govIdFile}
                      onChange={(e) => setGovIdFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="govId"
                    />
                    <label
                      htmlFor="govId"
                      className="flex items-center justify-center gap-3 px-4 py-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors"
                    >
                      {govIdFile ? (
                        <>
                          <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-foreground font-medium">{govIdFile.name}</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-muted-foreground">Upload Government ID</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Your Skills
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TASK_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => toggleSkill(cat.value)}
                        className={cn(
                          'p-3 rounded-xl text-sm text-left transition-all duration-200',
                          selectedSkills.includes(cat.value)
                            ? 'bg-primary/10 border-2 border-primary text-primary'
                            : 'border border-border hover:border-primary/30 hover:bg-muted/50'
                        )}
                      >
                        <span className="mr-2">{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(1)}
                    className="flex-1"
                    size="lg"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1"
                    size="lg"
                    disabled={selectedSkills.length === 0}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Client - skip to location */}
            {step === 2 && selectedRole === 'client' && (
              <div className="space-y-5 animate-fade-in-up">
                <Card variant="default" className="bg-emerald-500/5 border-emerald-500/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Enable Location</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Get matched with freelancers in your area for faster service.
                      </p>
                    </div>
                  </div>
                </Card>

                {location ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="font-medium text-foreground">Location captured</p>
                        <p className="text-sm text-muted-foreground">
                          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={getLocation}
                    variant="secondary"
                    className="w-full"
                    size="lg"
                    isLoading={locationLoading}
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                  >
                    {locationLoading ? 'Getting location...' : 'Get My Location'}
                  </Button>
                )}

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(1)}
                    className="flex-1"
                    size="lg"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    size="lg"
                    isLoading={loading}
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Location (Freelancer) */}
            {step === 3 && selectedRole === 'freelancer' && (
              <div className="space-y-5 animate-fade-in-up">
                <Card variant="default" className="bg-emerald-500/5 border-emerald-500/20">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Enable Location</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Get notified about tasks near you and improve your visibility.
                      </p>
                    </div>
                  </div>
                </Card>

                {location ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="font-medium text-foreground">Location captured</p>
                        <p className="text-sm text-muted-foreground">
                          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={getLocation}
                    variant="secondary"
                    className="w-full"
                    size="lg"
                    isLoading={locationLoading}
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                  >
                    {locationLoading ? 'Getting location...' : 'Get My Location'}
                  </Button>
                )}

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(2)}
                    className="flex-1"
                    size="lg"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    size="lg"
                    isLoading={loading}
                    disabled={selectedSkills.length === 0}
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            )}
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-semibold text-primary hover:text-primary/80">
              Sign in
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

function SignupLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center animate-pulse">
          <span className="text-white font-bold text-lg">T</span>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupLoading />}>
      <SignupContent />
    </Suspense>
  )
}
