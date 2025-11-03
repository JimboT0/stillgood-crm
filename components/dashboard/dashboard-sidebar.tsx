"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Building2,
  Users,
  FileText,
  Calendar,
  AlertTriangle,
  Star,
  CheckCircle,
  XCircle,
  Package,
  ChevronUp,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  MessageCircle,
  Superscript,
  PercentDiamond,
  FlagIcon,
  BriefcaseBusiness,
  FerrisWheelIcon,
} from "lucide-react"
import { useDashboardData } from "@/components/dashboard/dashboard-provider"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase/config"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import sglogocrm from '../../public/sglogocrm.svg';

function SGlogocrm() {
  return <img src={sglogocrm.src} alt="Still Good Logo" className="w-10 h-10" />;
}


const navigationItems = [
    {
    title: "Rollout",
    url: "/rollout",
    icon: FerrisWheelIcon,
    roles: ["superadmin", "operations", "salesperson", "media"],
    getCount: (counts: Record<string, number>) => counts.rollout,
  },
  {
    title: "My Leads",
    url: "/leads",
    icon: Building2,
    roles: ["superadmin", "salesperson"],
    getCount: (counts: Record<string, number>) => counts.leads,
  },
  {
    title: "Closed",
    url: "/closed",
    icon: XCircle,
    roles: ["superadmin", "media", "salesperson"],
    getCount: (counts: Record<string, number>) => counts.closed,
  },
  {
    title: "Setup",
    url: "/setup",
    icon: Calendar,
    roles: ["superadmin", "operations", "media", "salesperson"],
    getCount: (counts: Record<string, number>) => counts.setup,
  },
  {
    title: "Completed",
    url: "/completed",
    icon: CheckCircle,
    roles: ["superadmin", "operations", "media", "salesperson"],
    getCount: (counts: Record<string, number>) => counts.completed,
  },
  {
    title: "Key Accounts",
    url: "/key-accounts",
    icon: Star,
    roles: ["superadmin", "salesperson"],
    getCount: (counts: Record<string, number>) => counts.keyAccounts,
  },
  {
    title: "Errors",
    url: "/errors",
    icon: AlertTriangle,
    roles: ["superadmin", "operations", "salesperson"],
    getCount: (counts: Record<string, number>) => counts.errors,
  },
  {
    title: "Bag Management",
    url: "/bags",
    icon: Package,
    roles: ["superadmin", "operations", "salesperson", "media"],
    getCount: (counts: Record<string, number>) => counts.bags,
  },
  {
    title: "Users",
    url: "/users",
    icon: Users,
    roles: ["superadmin"],
    getCount: (counts: Record<string, number>) => counts.users,
  },
  {
    title: "Documents",
    url: "/documents",
    icon: FileText,
    roles: ["superadmin", "operations", "salesperson"],
    getCount: (counts: Record<string, number>) => counts.documents,
  },
  {
    title: "Ops Calendar",
    url: "/",
    icon: Calendar,
    roles: ["superadmin", "operations", "media", "salesperson"],
    getCount: (counts: Record<string, number>) => counts.opsCalendar,
  },
  {
    title: "0 Comm",
    url: "/commissions",
    icon: PercentDiamond,
    roles: ["superadmin"],
  },
  {
    title: "Corporate",
    url: "/corporate",
    icon: BriefcaseBusiness,
    roles: ["superadmin"],
  },
  {
    title: "Performance",
    url: "/performance",
    icon: FlagIcon,
    roles: ["superadmin"],
  },
  {
    title: "Training & Intro",
    url: "/training",
    icon: MessageCircle,
    roles: ["superadmin", "operations", "salesperson"],
  },
  //   {
  //   title: "Refunds",
  //   url: "/refunds",
  //   icon: HandCoins,
  //   roles: ["superadmin", "operations", "media", "salesperson"],
  //   getCount: (counts: Record<string, number>) => counts.refunds,
  // },
  {
    title: "SuperLeads",
    url: "/superleads",
    icon: Superscript,
    roles: ["superadmin"],
  },
]

export function DashboardSidebar() {
  const { currentUser } = useDashboardData()
  const pathname = usePathname()
  const router = useRouter()
  const { state, toggleSidebar } = useSidebar()

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const filteredItems = navigationItems.filter((item) => item.roles.includes(currentUser?.role || ""))

  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b px-2 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <div className=" w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
              <SGlogocrm />
              </div>
            )}
            {!isCollapsed && (
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Still Good</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Dashboard</p>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 shrink-0"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="h-8 w-8" /> : <PanelLeftClose className="h-8 w-8" />}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={cn(isCollapsed && "sr-only")}>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => {
                const isActive = pathname === item.url
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={isCollapsed ? item.title : undefined}>
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {!isCollapsed && (
                          <>
                            <span>{item.title}</span>
                          </>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <SidebarMenu>

          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  tooltip={isCollapsed ? currentUser?.name || "User" : undefined}
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-[#ff5900] text-white">
                      {currentUser?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{currentUser?.name || "User"}</span>
                      <span className="truncate text-xs capitalize">{currentUser?.role || "user"}</span>
                    </div>
                  )}
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >

                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>

                  <ThemeToggle />

              </DropdownMenuContent>
            </DropdownMenu>

          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export function DashboardSidebarProvider({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex-1 p-6">{children}</div>
      </main>
    </SidebarProvider>
  )
}
