"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase/config"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import ParticleBackground from "@/components/particle-background"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSigningIn(true)
    setError("")

    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-50">
      <ParticleBackground />
      <div className="container mx-auto px-4 relative z-10">
        <div 
          className="flex flex-col lg:flex-row bg-white/90 items-center justify-between max-w-5xl mx-auto shadow-lg p-8"
        >
          {/* Logo Section */}
          <div className="flex flex-col items-center lg:items-start mb-8 lg:mb-0 lg:w-1/2 relative lg:static -mt-[30%] lg:mt-0 ">
            <div className="w-20 h-20 flex items-center justify-center mb-1">
              <img src="/images/sglogocrm.svg" alt="Still Good CRM" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">still good CRM</h1>
            <p className="text-gray-600 mt-2 text-center lg:text-left">Track your leads and manage your sales</p>
          </div>

          {/* Login Form Section */}
          <div className="w-full lg:w-1/2 max-w-md">
            <form onSubmit={handleSignIn} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-1 bg-white border-none shadow-sm focus:ring-2 focus:ring-[#ff5900] rounded-none"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="mt-1 bg-white border-none shadow-sm focus:ring-2 focus:ring-[#ff5900] rounded-none"
                  required
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button 
                type="submit" 
                className="w-full bg-[#ff5900] hover:bg-[#e54f00] text-white font-medium rounded-none shadow-sm"
                disabled={isSigningIn}
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
