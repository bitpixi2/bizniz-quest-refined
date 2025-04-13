"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense } from "react"

function GlobalLoadingContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Create a timeout ID
    let timeoutId: NodeJS.Timeout

    const handleStart = () => {
      // Clear any existing timeout
      clearTimeout(timeoutId)
      setIsLoading(true)
    }

    const handleStop = () => {
      // Set a small delay before hiding the loader to prevent flashing
      timeoutId = setTimeout(() => {
        setIsLoading(false)
      }, 300)
    }

    // Add event listeners for route change events
    window.addEventListener("beforeunload", handleStart)
    document.addEventListener("nextjs:route-change-start", handleStart)
    document.addEventListener("nextjs:route-change-complete", handleStop)
    document.addEventListener("nextjs:route-change-error", handleStop)

    // Clean up event listeners
    return () => {
      window.removeEventListener("beforeunload", handleStart)
      document.removeEventListener("nextjs:route-change-start", handleStart)
      document.removeEventListener("nextjs:route-change-complete", handleStop)
      document.removeEventListener("nextjs:route-change-error", handleStop)
      clearTimeout(timeoutId)
    }
  }, [])

  // Also track changes to pathname and searchParams
  useEffect(() => {
    setIsLoading(false)
  }, [pathname, searchParams])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-pixel text-[#ffe9b3] pixel-text">Loading...</h2>
        <p className="font-pixel text-sm text-[#ffe9b3] mt-2">Please wait while we load your adventure</p>
      </div>
    </div>
  )
}

// Wrap the component in Suspense
export default function GlobalLoading() {
  return (
    <Suspense fallback={null}>
      <GlobalLoadingContent />
    </Suspense>
  )
}
