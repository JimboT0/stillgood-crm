import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { DashboardProvider } from "@/components/dashboard-provider"

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
    <html lang="en">
      <DashboardProvider>
        <body className={inter.className}>{children}</body>
      </DashboardProvider>
    </html>
  )
}
