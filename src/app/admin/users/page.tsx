'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { ArrowLeft, Plus, Trash2, User, Shield, Mail, Settings } from 'lucide-react'

interface ApprovedUser {
  id: string
  email: string
  name: string
  role: 'superuser' | 'editor'
  created_at: string
}

export default function AdminUsersPage() {
  const { user: _user } = useAuth()
  const [users, setUsers] = useState<ApprovedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'editor' as 'superuser' | 'editor' })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('approved_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUser.email || !newUser.name) return

    setAdding(true)
    try {
      const { error } = await supabase
        .from('approved_users')
        .insert({
          email: newUser.email.toLowerCase(),
          name: newUser.name,
          role: newUser.role
        })

      if (error) throw error

      setNewUser({ email: '', name: '', role: 'editor' })
      loadUsers()
    } catch (error) {
      console.error('Error adding user:', error)
      alert('Error adding user. Email might already exist.')
    } finally {
      setAdding(false)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const { error } = await supabase
        .from('approved_users')
        .delete()
        .eq('id', userId)

      if (error) throw error
      loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Users</h1>
            <p className="text-gray-600">Manage approved users who can sign in and create content</p>
          </div>

          {/* Add New User Form */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Add New User
            </h2>
            
            <form onSubmit={addUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Full Name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'superuser' | 'editor' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="editor">Editor</option>
                  <option value="superuser">Superuser</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={adding}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {adding ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Approved Users ({users.length})
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {user.role === 'superuser' ? (
                        <Shield className="h-8 w-8 text-red-600" />
                      ) : (
                        <User className="h-8 w-8 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {user.email}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                        user.role === 'superuser' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => window.open(`/admin/users/${user.id}/permissions`, '_blank')}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Manage entity permissions"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {users.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No approved users found.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}