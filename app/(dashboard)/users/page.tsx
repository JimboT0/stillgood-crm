"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { useDashboardData } from "@/components/dashboard/dashboard-provider"
import { UserCreateModal } from "@/components/modals/user-create-modal"
import { UserEditModal } from "@/components/modals/user-edit-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Search, Users, Shield, Briefcase, Camera } from 'lucide-react'
import type { User } from "@/lib/firebase/types"

function UsersPageContent() {
  const { users, handleCreateUser, handleUpdateUser, handleDeleteUser } = useDashboardData()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false) // State for edit modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null) // State for selected user
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getRoleIcon = (role: User["role"]) => {
    switch (role) {
      case "superadmin": return <Shield className="w-4 h-4" />
      case "salesperson": return <Briefcase className="w-4 h-4" />
      case "operations": return <Users className="w-4 h-4" />
      case "media": return <Camera className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: User["role"]) => {
    switch (role) {
      case "superadmin": return "bg-red-100 text-red-800"
      case "salesperson": return "bg-blue-100 text-blue-800"
      case "operations": return "bg-green-100 text-green-800"
      case "media": return "bg-purple-100 text-purple-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const roleStats = {
    superadmin: users.filter(u => u.role === "superadmin").length,
    salesperson: users.filter(u => u.role === "salesperson").length,
    ops: users.filter(u => u.role === "operations").length,
    media: users.filter(u => u.role === "media").length,
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage team members and their roles</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
              <Shield className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roleStats.superadmin}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales Team</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roleStats.salesperson}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operations</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roleStats.ops}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Media Team</CardTitle>
              <Camera className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roleStats.media}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                  <SelectItem value="salesperson">salesperson</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="media">Media Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-base">{user.name}</CardTitle>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className={getRoleColor(user.role)}>
                    <div className="flex items-center gap-1">
                      {getRoleIcon(user.role)}
                      <span className="capitalize">{user.role}</span>
                    </div>
                  </Badge>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedUser(user) // Set the user to edit
                      setIsEditModalOpen(true) // Open the edit modal
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-600 hover:text-red-700"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${user.name}?`)) {
                        handleDeleteUser(user.id)
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-600">
                {users.length === 0 
                  ? "No users have been created yet."
                  : "No users match your current filters."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <UserCreateModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateUser}
      />
      <UserEditModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedUser(null) // Clear selected user when closing
        }}
        onSave={handleUpdateUser} // Use handleUpdateUser from useDashboardData
        user={selectedUser}
      />
    </>
  )
}

export default function UsersPage() {
  return (
    <UsersPageContent />
  )
}
