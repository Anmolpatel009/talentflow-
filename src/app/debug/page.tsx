'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugPage() {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [message, setMessage] = useState('Initializing...')
  const [details, setDetails] = useState<string[]>([])

  useEffect(() => {
    const checkConnection = async () => {
      const logs: string[] = []
      
      // Check 1: Environment variables
      logs.push(`✓ NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'MISSING'}`)
      logs.push(`✓ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'MISSING'}`)
      
      try {
        // Check 2: Create client
        logs.push('Creating Supabase client...')
        const supabase = createClient()
        logs.push('✓ Client created successfully')
        
        // Check 3: Test connection
        logs.push('Testing connection to Supabase...')
        const startTime = Date.now()
        const { data, error } = await supabase.auth.getSession()
        const duration = Date.now() - startTime
        
        if (error) {
          logs.push(`✗ Connection failed: ${error.message}`)
          setStatus('error')
          setMessage(`Connection failed after ${duration}ms`)
        } else {
          logs.push(`✓ Connected successfully in ${duration}ms`)
          logs.push(`Session: ${data.session ? 'Active' : 'None'}`)
          setStatus('success')
          setMessage(`Connected to Supabase in ${duration}ms`)
        }
      } catch (err: any) {
        logs.push(`✗ Error: ${err.message}`)
        setStatus('error')
        setMessage(err.message)
      }
      
      setDetails(logs)
    }
    
    checkConnection()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-4">Supabase Connection Debug</h1>
        
        <div className={`p-4 rounded-lg mb-6 ${
          status === 'checking' ? 'bg-yellow-100 text-yellow-800' :
          status === 'success' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {status === 'checking' && (
              <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
            )}
            {status === 'success' && <span className="text-xl">✓</span>}
            {status === 'error' && <span className="text-xl">✗</span>}
            <span className="font-semibold">{message}</span>
          </div>
        </div>
        
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <h2 className="text-gray-400 mb-2">Debug Logs:</h2>
          {details.map((log, i) => (
            <div key={i} className={`${
              log.startsWith('✓') ? 'text-green-400' :
              log.startsWith('✗') ? 'text-red-400' :
              'text-gray-300'
            }`}>
              {log}
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-sm text-gray-600">
          <h3 className="font-semibold mb-2">Troubleshooting Steps:</h3>
          <ol className="list-decimal list-inside space-y-1">
            <li>Check browser console (F12) for detailed errors</li>
            <li>Clear browser cache and cookies for localhost</li>
            <li>Ensure .env.local has correct Supabase credentials</li>
            <li>Restart Next.js dev server after changing .env.local</li>
            <li>Check if Supabase project is paused (free tier auto-pauses)</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
