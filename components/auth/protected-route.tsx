"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoading && !user) {
        // If there's no user after loading is complete, redirect to login
        router.push("/login?message=Your session has expired. Please log in again.")
      } else if (user) {
        // Only check token expiration if we have a user
        // But do it less frequently - only if token is about to expire in 1 minute
        try {
          const { data } = await getSupabaseBrowserClient().auth.getSession()
          if (data.session?.expires_at) {
            const expiresAt = new Date(data.session.expires_at * 1000)
            const now = new Date()
            const timeUntilExpiry = expiresAt.getTime() - now.getTime()

            // Only refresh if token expires in less than 1 minute (instead of 5 minutes)
            if (timeUntilExpiry < 60 * 1000) {
              console.log("Session about to expire, refreshing...")
              const { data: refreshData, error } = await getSupabaseBrowserClient().auth.refreshSession()
              if (error) {
                console.error("Error refreshing session:", error)
                // If refresh fails, redirect to login
                router.push("/login?message=Your session has expired. Please log in again.")
              }
            }
          }
        } catch (error) {
          console.error("Error checking session:", error)
        }
      }
    }

    // Only run the check once when the component mounts
    checkAuth()

    // We're not setting up any interval or repeated checks here
  }, [user, isLoading, router, getSupabaseBrowserClient().auth])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-pixel text-[#6b5839]">Loading...</h2>
          <p className="font-pixel text-sm text-[#6b5839] mt-2">Please wait while we load your adventure</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
