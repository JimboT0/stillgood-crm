"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { User } from "@/lib/firebase/types"

interface UserCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (user: Omit<User, "id"> & { password: string }) => Promise<void>
}

export function UserCreateModal({ isOpen, onClose, onSave }: UserCreateModalProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<User["role"]>("operations")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await onSave({
        name,
        email,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        password,
      })

      setName("")
      setEmail("")
      setPassword("")
      setRole("operations")
      onClose()
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("This email address is already registered in the system.")
      } else if (err.code === "auth/weak-password") {
        setError("Password must be at least 6 characters long.")
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.")
      } else if (err.message?.includes("Only superadmins")) {
        setError("You don't have permission to create users.")
      } else {
        setError(err.message || "Failed to create user. Please try again.")
      }
      console.error("Error creating user:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1"
                disabled={isLoading}
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <Select value={role} onValueChange={(value: User["role"]) => setRole(value)} disabled={isLoading}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                  <SelectItem value="salesperson">Salesperson</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="media">Media Team</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
