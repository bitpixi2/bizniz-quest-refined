"use client"

import type React from "react"

import { useState, Suspense } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

// Create a separate component for the content that uses useSearchParams
function LoginFormContent() {
  const [isNavigating, setIsNavigating] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)
  const { signIn, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams?.get("message")

  // Add a fallback login method using the API
  const fallbackLogin = async (email: string, password: string) => {
    setIsUsingFallback(true)
    try {
      const response = await fetch("/api/debug-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign in via API")
      }

      // If successful, reload the page to get the session
      window.location.href = "/"
      return true
    } catch (err: any) {
      console.error("Fallback login error:", err)
      throw err
    } finally {
      setIsUsingFallback(false)
    }
  }

  // Update the handleSubmit function to properly handle errors
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError("Please enter your email")
      return
    }

    if (!password.trim()) {
      setError("Please enter your password")
      return
    }

    try {
      console.log("Attempting to sign in with:", email)
      await signIn(email, password)
      setIsNavigating(true)
      router.push("/")
    } catch (err: any) {
      console.error("Primary login error:", err)
      setError("Trying alternative login method...")

      // Try fallback login if the primary method fails
      try {
        await fallbackLogin(email, password)
      } catch (fallbackErr: any) {
        console.error("Fallback login error:", fallbackErr)
        setError(fallbackErr.message || "Failed to sign in. Please check your credentials.")
      }
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders">
      <CardHeader>
        <CardTitle className="text-xl font-pixel text-center text-[#6b5839]">Did you remember your badge?</CardTitle>
      </CardHeader>
      <CardContent>
        {message && (
          <div className="bg-[#f9c74f] border border-[#f9c74f] text-[#6b5839] px-4 py-2 rounded mb-4 font-pixel text-xs">
            {message}
          </div>
        )}

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
          {/* Modify the button in the form */}
          <Button
            type="submit"
            disabled={isLoading || isUsingFallback || isNavigating}
            className="w-full bg-[#7cb518] text-white border-2 border-[#6b5839] hover:bg-[#6b9c16] font-pixel pixel-borders"
          >
            {isLoading || isUsingFallback || isNavigating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isNavigating ? "Redirecting..." : isUsingFallback ? "Trying alternative login..." : "Logging in..."}
              </>
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="font-pixel text-xs text-[#6b5839]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#7cb518] hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

// Wrap the component in Suspense
export default function LoginForm() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md mx-auto bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders">
          <CardHeader>
            <CardTitle className="text-xl font-pixel text-center text-[#6b5839]">Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6b5839]"></div>
            </div>
          </CardContent>
        </Card>
      }
    >
      <LoginFormContent />
    </Suspense>
  )
}
