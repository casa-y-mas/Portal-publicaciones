'use client'

import { useState } from 'react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { users } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit2, Trash2, Plus, Check, X } from 'lucide-react'

interface EditingUser {
  id: string
  name: string
  email: string
  role: string
}

export default function UsersPage() {
  const [usersList, setUsersList] = useState(users)
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null)
  const [creatingUser, setCreatingUser] = useState(false)

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500/10 text-red-600 dark:text-red-400',
      supervisor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      editor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    }
    return colors[role] || 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
  }

  const handleDeleteUser = (id: string) => {
    setUsersList(usersList.filter(u => u.id !== id))
  }

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Users</h1>
          <p className="text-muted-foreground">Manage team members and permissions</p>
        </div>
        <Button onClick={() => setCreatingUser(true)}>
          <Plus size={16} className="mr-2" />
          Add User
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map(user => (
                <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                        {user.avatar}
                      </div>
                      <span className="font-semibold">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      user.status === 'active'
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
                    }`}>
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setEditingUser({ id: user.id, name: user.name, email: user.email, role: user.role })}
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">Edit User</h2>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Name</label>
                <Input
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser(prev => prev ? { ...prev, name: e.target.value } : null)
                  }
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Email</label>
                <Input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)
                  }
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Role</label>
                <select className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground">
                  <option value="admin">Admin</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="editor">Editor</option>
                </select>
              </div>
            </div>

            <div className="border-t border-border p-6 flex gap-3 justify-end bg-muted/30">
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button onClick={() => setEditingUser(null)}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {creatingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">Add User</h2>
              <button
                onClick={() => setCreatingUser(false)}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Name</label>
                <Input placeholder="Full name" />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Email</label>
                <Input type="email" placeholder="email@example.com" />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Role</label>
                <select className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground">
                  <option value="editor">Editor</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="border-t border-border p-6 flex gap-3 justify-end bg-muted/30">
              <Button variant="outline" onClick={() => setCreatingUser(false)}>
                Cancel
              </Button>
              <Button onClick={() => setCreatingUser(false)}>
                Create User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
