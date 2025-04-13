"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

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
