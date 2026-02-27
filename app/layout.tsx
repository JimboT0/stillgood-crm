import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { DashboardProvider } from "@/components/dashboard/dashboard-provider"
import { FilterProvider } from "@/contexts/filter-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Onboarding Dashboard",
  description: "Store onboarding and management dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <DashboardProvider>
            <FilterProvider>{children}</FilterProvider>
          </DashboardProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
