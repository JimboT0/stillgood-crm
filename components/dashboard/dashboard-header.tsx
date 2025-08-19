"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Bell, Settings, LogOut, UserIcon } from "lucide-react"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import type { User } from "@/lib/firebase"

interface DashboardHeaderProps {
  currentUser: User | null
}

export function DashboardHeader({ currentUser }: DashboardHeaderProps) {
  // Debug currentUser
  const handleSignOut = async () => {
    if (auth) {
      try {
        console.log("DashboardHeader - Signing out user:", auth.currentUser?.uid)
        await signOut(auth)
      } catch (error) {
        console.error("DashboardHeader - Error signing out:", error)
        alert("Failed to sign out. Please try again.")
      }
    } else {
      console.warn("DashboardHeader - Auth not initialized, reloading page")
      window.location.reload()
    }
  }

  // Helper function to get display role
  const getDisplayRole = (role?: string) => {
    switch (role) {
      case "superadmin":
        return { text: "Admin", variant: "default" as const }
      case "mediateam":
        return { text: "Media", variant: "secondary" as const }
      case "salesperson":
        return { text: "Salesperson", variant: "secondary" as const }
      default:
        return { text: "Unknown Role", variant: "secondary" as const }
    }
  }

  const { text: roleText, variant: roleVariant } = getDisplayRole(currentUser?.role)

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-orange-100 px-4">
      <SidebarTrigger className="-ml-1" />

      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">Store Onboarding Dashboard</h1>
        </div>

        <div className="flex items-center gap-4">


          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-orange-100 text-orange-700">
                    {currentUser?.email
                      ? currentUser.email
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                      : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {currentUser?.name || "Unknown User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {currentUser?.email || "No email"}
                  </p>
                  <Badge variant={roleVariant} className="w-fit mt-1">
                    {roleText}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator /> */}
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
