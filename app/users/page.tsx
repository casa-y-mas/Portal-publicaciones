'use client'

import { useState } from 'react'
import { Edit2, Plus, Trash2 } from 'lucide-react'

import { AppModal } from '@/components/base/app-modal'
import { StatusBadge } from '@/components/base/status-badge'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { users } from '@/lib/mock-data'

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

  const handleDeleteUser = (id: string) => {
    setUsersList((prev) => prev.filter((user) => user.id !== id))
  }

  return (
    <div>
      <Breadcrumbs />

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="view-title">Users</h1>
          <p className="view-subtitle">Manage team members and permissions</p>
        </div>
        <Button onClick={() => setCreatingUser(true)}>
          <Plus size={16} className="mr-2" />
          Add User
        </Button>
      </div>

      <div className="surface-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersList.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {user.avatar}
                    </div>
                    <span className="font-semibold">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <StatusBadge status={user.role} className="capitalize" />
                </TableCell>
                <TableCell>
                  <StatusBadge status={user.status} label={user.status === 'active' ? 'Active' : 'Inactive'} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setEditingUser({ id: user.id, name: user.name, email: user.email, role: user.role })}
                    >
                      <Edit2 size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDeleteUser(user.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AppModal
        open={Boolean(editingUser)}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null)
        }}
        title="Edit User"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={() => setEditingUser(null)}>Save Changes</Button>
          </>
        }
      >
        {editingUser ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold block mb-2">Name</label>
              <Input value={editingUser.name} onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, name: e.target.value } : null))} />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Email</label>
              <Input
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, email: e.target.value } : null))}
              />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Role</label>
              <select className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground">
                <option value="admin">Admin</option>
                <option value="supervisor">Supervisor</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
        ) : null}
      </AppModal>

      <AppModal
        open={creatingUser}
        onOpenChange={setCreatingUser}
        title="Add User"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreatingUser(false)}>
              Cancel
            </Button>
            <Button onClick={() => setCreatingUser(false)}>Create User</Button>
          </>
        }
      >
        <div className="space-y-4">
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
              <option value="viewer">Solo lectura</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </AppModal>
    </div>
  )
}
