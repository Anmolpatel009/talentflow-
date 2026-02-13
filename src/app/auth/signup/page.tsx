'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { TASK_CATEGORIES } from '@/types'

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
      // First try to update, if no rows affected then insert
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
          <p className="mt-2 text-gray-600">
            Step {step} of 3
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I want to
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('client')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      selectedRole === 'client'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">💼</span>
                    <div className="font-medium">Hire Help</div>
                    <div className="text-xs text-gray-500">I'm a client</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('freelancer')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      selectedRole === 'freelancer'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">💪</span>
                    <div className="font-medium">Work</div>
                    <div className="text-xs text-gray-500">I'm a freelancer</div>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number {selectedRole === 'client' && <span className="text-red-500">*</span>}
                </label>
                <input
                  id="phone"
                  type="tel"
                  required={selectedRole === 'client'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mumbai, Delhi, Bangalore..."
                />
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Freelancer Additional Info */}
          {step === 2 && selectedRole === 'freelancer' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800">Student Verification</h3>
                <p className="text-sm text-blue-600 mt-1">
                  Upload your documents to get verified and access nearby tasks with 10% commission.
                </p>
              </div>

              <div>
                <label htmlFor="collegeName" className="block text-sm font-medium text-gray-700">
                  College Name
                </label>
                <input
                  id="collegeName"
                  type="text"
                  required
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="IIT Mumbai, DU, etc."
                />
              </div>

              <div>
                <label htmlFor="collegeId" className="block text-sm font-medium text-gray-700">
                  College ID Card
                </label>
                <input
                  id="collegeId"
                  type="file"
                  accept="image/*,.pdf"
                  required={!collegeIdFile}
                  onChange={(e) => setCollegeIdFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {collegeIdFile && (
                  <p className="text-sm text-green-600 mt-1">✓ {collegeIdFile.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="govId" className="block text-sm font-medium text-gray-700">
                  Government ID (Aadhaar/DigLocker)
                </label>
                <input
                  id="govId"
                  type="file"
                  accept="image/*,.pdf"
                  required={!govIdFile}
                  onChange={(e) => setGovIdFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {govIdFile && (
                  <p className="text-sm text-green-600 mt-1">✓ {govIdFile.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Skills
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TASK_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => toggleSkill(cat.value)}
                      className={`p-2 border rounded-lg text-sm transition-colors ${
                        selectedSkills.includes(cat.value)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/2 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-1/2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Client - skip to step 3 */}
          {step === 2 && selectedRole === 'client' && (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/2 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-1/2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-800">📍 Location</h3>
                <p className="text-sm text-green-600 mt-1">
                  {location
                    ? `✓ Location captured: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                    : 'Get your current location to find nearby tasks/freelancers'}
                </p>
              </div>

              {location ? (
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={locationLoading}
                  className="w-full py-3 px-4 border border-green-500 rounded-lg shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {locationLoading ? 'Getting location...' : 'Update Location'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={locationLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {locationLoading ? 'Getting location...' : '📍 Get My Location'}
                </button>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(selectedRole === 'freelancer' ? 2 : 1)}
                  className="w-1/2 py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || (selectedRole === 'freelancer' && selectedSkills.length === 0)}
                  className="w-1/2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

function SignupLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-lg w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Loading...</h2>
        </div>
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
