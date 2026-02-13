'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TASK_CATEGORIES } from '@/types'

interface Profile {
  id: string
  email: string
  full_name: string
  phone: string
  city: string
  role: string
  verification_status: string
  college_name: string
  college_id_url: string
  gov_id_url: string
  skills: string[]
  average_rating: number
  completed_tasks: number
  created_at: string
}

export default function FreelancerProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    city: '',
    collegeName: '',
  })
  
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [collegeIdFile, setCollegeIdFile] = useState<File | null>(null)
  const [govIdFile, setGovIdFile] = useState<File | null>(null)

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

      if (profileData.role !== 'freelancer') {
        router.push('/client/dashboard')
        return
      }

      setProfile(profileData)
      setUser(user)
      setFormData({
        fullName: profileData.full_name || '',
        phone: profileData.phone || '',
        city: profileData.city || '',
        collegeName: profileData.college_name || '',
      })
      setSelectedSkills(profileData.skills || [])
    } catch (error) {
      console.error('Error:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill))
    } else {
      setSelectedSkills([...selectedSkills, skill])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      let collegeIdUrl = profile?.college_id_url || null
      let govIdUrl = profile?.gov_id_url || null

      // Upload college ID if new file selected
      if (collegeIdFile) {
        const path = `verification/${profile?.id}/college_id_${Date.now()}`
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(path, collegeIdFile)

        if (!uploadError) {
          const { data } = supabase.storage.from('documents').getPublicUrl(path)
          collegeIdUrl = data.publicUrl
        }
      }

      // Upload government ID if new file selected
      if (govIdFile) {
        const path = `verification/${profile?.id}/gov_id_${Date.now()}`
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(path, govIdFile)

        if (!uploadError) {
          const { data } = supabase.storage.from('documents').getPublicUrl(path)
          govIdUrl = data.publicUrl
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
          city: formData.city,
          college_name: formData.collegeName,
          skills: selectedSkills,
          college_id_url: collegeIdUrl,
          gov_id_url: govIdUrl,
          verification_status: (collegeIdUrl && govIdUrl) ? 'pending' : profile?.verification_status,
        })
        .eq('id', profile?.id)

      if (updateError) {
        setError(`Error updating profile: ${updateError.message}`)
        return
      }

      setSuccess('Profile updated successfully!')
      setCollegeIdFile(null)
      setGovIdFile(null)
    } catch (err: any) {
      setError(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/freelancer/dashboard"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-flex items-center"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Stats Card */}
        <div className="bg-white rounded-xl shadow mb-6">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Freelancer Stats</h2>
          </div>
          <div className="p-6 grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">⭐ {profile?.average_rating || 0}</div>
              <div className="text-sm text-gray-500">Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{profile?.completed_tasks || 0}</div>
              <div className="text-sm text-gray-500">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${profile?.verification_status === 'verified' ? 'text-green-600' : 'text-yellow-600'}`}>
                {profile?.verification_status === 'verified' ? '✓' : '⏳'}
              </div>
              <div className="text-sm text-gray-500">
                {profile?.verification_status === 'verified' ? 'Verified' : 'Unverified'}
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        {profile?.verification_status !== 'verified' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-medium text-yellow-800">Get Verified</h3>
                <p className="text-sm text-yellow-600 mt-1">
                  Upload your college ID and government ID to get verified.
                  Verified freelancers enjoy 10% commission instead of 50%!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Account Info */}
        <div className="bg-white rounded-xl shadow mb-6">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <div className="text-gray-900">{profile?.email}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Account Type</label>
              <div className="capitalize text-gray-900">{profile?.role}</div>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Mumbai, Delhi, Bangalore..."
                />
              </div>
            </div>
          </div>

          {/* Verification Documents */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Verification Documents</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="collegeName" className="block text-sm font-medium text-gray-700 mb-1">
                  College Name
                </label>
                <input
                  type="text"
                  id="collegeName"
                  value={formData.collegeName}
                  onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="IIT Mumbai, DU, etc."
                />
              </div>

              <div>
                <label htmlFor="collegeId" className="block text-sm font-medium text-gray-700 mb-1">
                  College ID Card
                </label>
                <input
                  type="file"
                  id="collegeId"
                  accept="image/*,.pdf"
                  onChange={(e) => setCollegeIdFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {profile?.college_id_url && (
                  <p className="text-sm text-green-600 mt-1">✓ Current: {profile.college_id_url.split('/').pop()}</p>
                )}
                {collegeIdFile && (
                  <p className="text-sm text-blue-600 mt-1">New: {collegeIdFile.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="govId" className="block text-sm font-medium text-gray-700 mb-1">
                  Government ID (Aadhaar/DigLocker)
                </label>
                <input
                  type="file"
                  id="govId"
                  accept="image/*,.pdf"
                  onChange={(e) => setGovIdFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {profile?.gov_id_url && (
                  <p className="text-sm text-green-600 mt-1">✓ Current: {profile.gov_id_url.split('/').pop()}</p>
                )}
                {govIdFile && (
                  <p className="text-sm text-blue-600 mt-1">New: {govIdFile.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Your Skills</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-2">
                {TASK_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggleSkill(cat.value)}
                    className={`p-3 border rounded-lg text-sm transition-colors ${
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
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Sign Out */}
        <div className="mt-6 bg-white rounded-xl shadow p-6">
          <button
            onClick={handleSignOut}
            className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
