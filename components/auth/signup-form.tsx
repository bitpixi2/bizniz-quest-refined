"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function SignupForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState<string | null>(null)
  const { signUp, isLoading } = useAuth()
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    try {
      await signUp(email, password, username)
      setIsNavigating(true)
      router.push("/login?message=CHECK YOUR EMAIL TO CONFIRM YOUR ACCOUNT")
    } catch (err: any) {
      setError(err.message || "Failed to sign up")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders">
      <CardHeader>
        <CardTitle className="text-xl font-pixel text-center text-[#6b5839]">Get your badge</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="font-pixel text-xs text-[#6b5839]">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-[#f0e6d2] border-2 border-[#6b5839] font-pixel text-sm text-[#6b5839] pixel-borders"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="username" className="font-pixel text-xs text-[#6b5839]">
              Username
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-[#f0e6d2] border-2 border-[#6b5839] font-pixel text-sm text-[#6b5839] pixel-borders"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="font-pixel text-xs text-[#6b5839]">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-[#f0e6d2] border-2 border-[#6b5839] font-pixel text-sm text-[#6b5839] pixel-borders"
            />
          </div>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded font-pixel text-xs flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Button
            type="submit"
            disabled={isLoading || isNavigating}
            className="w-full bg-[#7cb518] text-white border-2 border-[#6b5839] hover:bg-[#6b9c16] font-pixel pixel-borders"
          >
            {isLoading || isNavigating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isNavigating ? "Redirecting..." : "Signing up..."}
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="font-pixel text-xs text-[#6b5839]">
          Already have an account?{" "}
          <Link href="/login" className="text-[#7cb518] hover:underline">
            Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
