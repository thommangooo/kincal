'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Mail, Loader2, AlertCircle } from 'lucide-react'

export default function SignInForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setMessage('')
    
    try {
      // First, check if the email is in the approved users list
      const { data: approvedUser, error: checkError } = await supabase
        .from('approved_users')
        .select('email, name, role')
        .eq('email', email.toLowerCase())
        .single()

      if (checkError || !approvedUser) {
        setMessage('This email address is not authorized to access the system. Please contact an administrator.')
        return
      }

      // If approved, send the magic link
      await signIn(email)
      setMessage('Check your email for an access link to sign in!')
    } catch (error) {
      setMessage('Error sending access link. Please try again.')
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm border p-6">
      <div className="text-center mb-6">
        <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
        <p className="text-gray-600">Enter your email to receive an access link</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your@email.com"
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending Access Link...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Send Access Link
            </>
          )}
        </button>
      </form>

      {message && (
        <div className={`mt-4 p-3 rounded-lg text-sm flex items-start ${
          message.includes('Error') || message.includes('not authorized')
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {(message.includes('Error') || message.includes('not authorized')) && (
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
          )}
          {message}
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Only pre-approved users can sign in. Contact an administrator to request access.
        </p>
      </div>
    </div>
  )
}
