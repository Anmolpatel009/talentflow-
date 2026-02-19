'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function PaymentPage() {
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [task, setTask] = useState<any>(null)
  const [freelancer, setFreelancer] = useState<any>(null)
  
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const taskId = params.taskId as string
  const amount = searchParams.get('amount')
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [taskId])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Get task details
      const { data: taskData } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()

      setTask(taskData)

      // Get freelancer details
      const { data: handshake } = await supabase
        .from('task_handshakes')
        .select(`
          freelancer:freelancer_id (
            full_name,
            phone,
            average_rating,
            completed_tasks
          )
        `)
        .eq('task_id', taskId)
        .eq('is_cancelled', false)
        .single()

      if (handshake) {
        setFreelancer(handshake.freelancer)
      }

    } catch (error) {
      console.error('Error:', error)
      router.push('/client/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setProcessing(true)
    
    // Simulate payment processing
    // In production, integrate with Razorpay, Stripe, etc.
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    alert(`Payment of ₹${amount || task?.budget} will be processed. This is a placeholder - integrate with Razorpay/Stripe for real payments.`)
    
    router.push('/client/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const platformFee = task?.budget ? Math.round(task.budget * 0.1) : 0 // 10% platform fee
  const totalAmount = task?.budget || parseFloat(amount || '0')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/client/dashboard"
            className="text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Complete Payment</h1>
          <p className="text-gray-600 mt-2">Release payment to the freelancer</p>
        </div>

        {/* Task Summary */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Task</span>
              <span className="font-medium">{task?.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">Completed</span>
            </div>
          </div>
        </div>

        {/* Freelancer Info */}
        {freelancer && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Freelancer</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-medium">{freelancer.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rating</span>
                <span className="font-medium">⭐ {freelancer.average_rating?.toFixed(1) || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tasks Completed</span>
                <span className="font-medium">{freelancer.completed_tasks || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Breakdown */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Breakdown</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Task Budget</span>
              <span className="font-medium">₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Platform Fee (10%)</span>
              <span className="font-medium text-green-600">-₹{platformFee.toLocaleString()}</span>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between text-lg">
              <span className="font-semibold text-gray-900">Freelancer Receives</span>
              <span className="font-bold text-indigo-600">₹{(totalAmount - platformFee).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-medium text-yellow-800">Payment Integration Required</h3>
              <p className="text-sm text-yellow-700 mt-1">
                This is a placeholder payment page. Integrate with Razorpay, Stripe, or your preferred payment gateway to process real payments.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={processing}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processing...
            </span>
          ) : (
            `Pay ₹${totalAmount.toLocaleString()}`
          )}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          By clicking "Pay", you agree to release the payment to the freelancer.
        </p>
      </div>
    </div>
  )
}
