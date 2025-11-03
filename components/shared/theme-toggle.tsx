"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { DropdownMenuItem } from "../ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Set theme based on time of day only on initial mount
  useEffect(() => {
    if (mounted) return // Don't override user preference
    
    const now = new Date()
    const hour = now.getHours()
    
    // 6am-6pm = light mode, 6pm-6am = dark mode
    const shouldBeDark = hour < 6 || hour >= 18
    const timeBasedTheme = shouldBeDark ? "dark" : "light"
    
    setTheme(timeBasedTheme)
    setMounted(true)
  }, [setTheme, mounted])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon">
        <Sun className="h-3 w-3" /> 
      </Button>
    )
  }

  return (
    <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      {theme === "dark" ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
      {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    </DropdownMenuItem>
  )
}
