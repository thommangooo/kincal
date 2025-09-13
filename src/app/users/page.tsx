'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import { 
  getApprovedUsers, 
  createUserWithPermissions,
  updateUserWithPermissions, 
  deleteApprovedUser,
  getUserWithPermissions,
  getAllEntitiesForAssignment,
  ApprovedUser,
  UserEntityPermission,
  Club,
  Zone,
  District
} from '@/lib/database'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  User as UserIcon,
  Mail,
  CheckCircle
} from 'lucide-react'
import Toast from '@/components/Toast'

interface UserFormData {
  email: string
  name: string
  role: 'superuser' | 'editor'
  entityIds: string[]
}

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [users, setUsers] = useState<ApprovedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<ApprovedUser | null>(null)
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    role: 'editor',
    entityIds: []
  })
  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [userPermissions, setUserPermissions] = useState<{ [userId: string]: UserEntityPermission[] }>({})
  const [entities, setEntities] = useState<{ clubs: Club[], zones: Zone[], districts: District[] }>({
    clubs: [],
    zones: [],
    districts: []
  })

  const showToastMessage = useCallback((message: string) => {
    setToastMessage(message)
    setShowToast(true)
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const usersData = await getApprovedUsers()
      setUsers(usersData)
      
      // Load permissions for each user
      const permissionsMap: { [userId: string]: UserEntityPermission[] } = {}
      for (const userData of usersData) {
        if (userData.role === 'editor') {
          const userWithPerms = await getUserWithPermissions(userData.id)
          if (userWithPerms) {
            permissionsMap[userData.id] = userWithPerms.permissions
          }
        }
      }
      setUserPermissions(permissionsMap)
    } catch (error) {
      console.error('Error loading users:', error)
      showToastMessage('Error loading users')
    } finally {
      setLoading(false)
    }
  }, [showToastMessage])

  const loadEntities = async () => {
    try {
      const entitiesData = await getAllEntitiesForAssignment()
      setEntities(entitiesData)
    } catch (error) {
      console.error('Error loading entities:', error)
    }
  }

  // Check if user is superuser
  useEffect(() => {
    if (!authLoading && user) {
      // Check user role - this would need to be implemented
      // For now, we'll allow access if user exists
      loadUsers()
      loadEntities()
    } else if (!authLoading && !user) {
      router.push('/signin')
    }
  }, [user, authLoading, router, loadUsers])

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      role: 'editor',
      entityIds: []
    })
    setEditingUser(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email.trim()) {
      showToastMessage('Email is required')
      return
    }

    // For editors, require at least one entity assignment
    if (formData.role === 'editor' && formData.entityIds.length === 0) {
      showToastMessage('Editor users must be assigned to at least one entity (club, zone, or district)')
      return
    }

    setSubmitting(true)
    try {
      if (editingUser) {
        await updateUserWithPermissions(editingUser.id, formData)
        showToastMessage('User updated successfully!')
      } else {
        await createUserWithPermissions(formData)
        showToastMessage('User created successfully!')
      }
      
      resetForm()
      loadUsers()
    } catch (error) {
      console.error('Error saving user:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      showToastMessage(`Error saving user: ${errorMessage}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (user: ApprovedUser) => {
    setEditingUser(user)
    // Get current entity IDs for this user
    const currentEntityIds = userPermissions[user.id]?.map(perm => perm.entity_id) || []
    setFormData({
      email: user.email,
      name: user.name || '',
      role: user.role,
      entityIds: currentEntityIds
    })
    setShowForm(true)
  }

  const handleDelete = async (user: ApprovedUser) => {
    if (!confirm(`Are you sure you want to delete user ${user.email}? This will also remove all their permissions.`)) {
      return
    }

    try {
      await deleteApprovedUser(user.id)
      showToastMessage('User deleted successfully!')
      loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      showToastMessage('Error deleting user')
    }
  }

  const getRoleIcon = (role: string) => {
    return role === 'superuser' ? <Shield className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />
  }

  const getRoleColor = (role: string) => {
    return role === 'superuser' ? 'text-purple-600 bg-purple-100' : 'text-blue-600 bg-blue-100'
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                  <Users className="h-8 w-8 mr-3 text-blue-600" />
                  User Management
                </h1>
                <p className="text-gray-600">
                  Manage approved users and their permissions for KinCal
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </button>
            </div>
          </div>

          {/* User Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="user@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="User's full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'superuser' | 'editor' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="editor">Editor</option>
                      <option value="superuser">Superuser</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Superusers can manage all content and users. Editors can only manage content for their assigned entities.
                    </p>
                  </div>

                  {formData.role === 'editor' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign to Entities * (Select at least one)
                      </label>
                      <div className="space-y-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {/* Clubs */}
                        {entities.clubs.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Clubs</h4>
                            <div className="space-y-1">
                              {entities.clubs.map((club) => (
                                <label key={club.id} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={formData.entityIds.includes(club.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData({ ...formData, entityIds: [...formData.entityIds, club.id] })
                                      } else {
                                        setFormData({ ...formData, entityIds: formData.entityIds.filter(id => id !== club.id) })
                                      }
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">{club.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Zones */}
                        {entities.zones.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Zones</h4>
                            <div className="space-y-1">
                              {entities.zones.map((zone) => (
                                <label key={zone.id} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={formData.entityIds.includes(zone.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData({ ...formData, entityIds: [...formData.entityIds, zone.id] })
                                      } else {
                                        setFormData({ ...formData, entityIds: formData.entityIds.filter(id => id !== zone.id) })
                                      }
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">{zone.name}, {zone.district?.name || 'Unknown District'}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Districts */}
                        {entities.districts.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Districts</h4>
                            <div className="space-y-1">
                              {entities.districts.map((district) => (
                                <label key={district.id} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={formData.entityIds.includes(district.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setFormData({ ...formData, entityIds: [...formData.entityIds, district.id] })
                                      } else {
                                        setFormData({ ...formData, entityIds: formData.entityIds.filter(id => id !== district.id) })
                                      }
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">{district.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Select the clubs, zones, or districts this editor can manage content for.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Saving...' : (editingUser ? 'Update User' : 'Create User')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <Mail className="h-4 w-4 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name || 'No name provided'}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          <span className="ml-1 capitalize">{user.role}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {user.role === 'superuser' ? (
                            <span className="inline-flex items-center text-purple-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              All permissions
                            </span>
                          ) : (
                            <div>
                              {userPermissions[user.id]?.length > 0 ? (
                                <div className="space-y-1">
                                  {userPermissions[user.id].map((perm, index) => (
                                    <div key={index} className="text-xs text-gray-600">
                                      {perm.entity_type}: {perm.entity?.name || perm.entity_id}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-500 text-xs">No permissions assigned</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Edit user"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">Get started by adding your first user.</p>
            </div>
          )}
        </div>
      </main>

      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  )
}
