"use client"

import type React from "react"
import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AuthWrapper } from "@/components/auth-wrapper"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardProvider, useDashboardData } from "@/components/dashboard/dashboard-provider"
import { Building, Menu } from "lucide-react"
import Loading from "@/app/(dashboard)/loading"

interface DashboardLayoutProps {
  children: React.ReactNode
}

function DashboardLayoutInner({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const { currentUser, stores, loading } = useDashboardData()

  // Get active tab from pathname
  const activeTab = useMemo(() => {
    if (pathname.startsWith("/leads")) return "leads"
    if (pathname.startsWith("/closed")) return "closed"
    if (pathname.startsWith("/rollout")) return "rollout"
    if (pathname.startsWith("/users")) return "users"
    if (pathname.startsWith("/completed")) return "completed"
    if (pathname.startsWith("/errors")) return "errors"
    if (pathname.startsWith("/documents")) return "documents"
    if (pathname.startsWith("/ops-calendar")) return "ops-calendar"
    if (pathname.startsWith("/key-accounts")) return "key-accounts"
    return "leads"
  }, [pathname])

  if (loading) {
    return (
          <Loading/>
    )
  }

  return (
    <AuthWrapper>
      <SidebarProvider>
        <div className="flex min-h-screen bg-gray-50 w-full">
          <DashboardSidebar
            stores={stores}
            currentUser={currentUser}
            activeTab={activeTab}
            onTabChange={() => {}} // Navigation handled by Next.js router
          />

          <SidebarTrigger className="fixed top-3 left-3 z-50 md:hidden bg-white shadow-md border rounded-lg p-2 hover:bg-gray-50 transition-colors">
            <Menu className="h-4 w-4" />
          </SidebarTrigger>

          <div className="flex-1 flex flex-col min-w-0 w-full">
            <main className="flex-1 pt-16 px-4 pb-4 md:p-4 lg:p-6 w-full">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </AuthWrapper>
  )
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <DashboardProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </DashboardProvider>
  )
}
