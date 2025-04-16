"use client"

import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// This component uses useSearchParams and needs to be wrapped in Suspense
function NotFoundContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-4xl font-pixel mb-4 text-[#6b5839] pixel-text">404 - Page Not Found</h1>
      <p className="font-pixel text-[#6b5839] mb-8">Oops! This page seems to have wandered off to another dimension.</p>
      <Link href="/">
        <Button className="bg-[#ffe9b3] text-[#6b5839] border-2 border-[#6b5839] hover:bg-[#f0e6d2] font-pixel pixel-borders">
          Return to Home
        </Button>
      </Link>
    </div>
  )
}

export default function NotFound() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <h1 className="text-4xl font-pixel mb-4 text-[#6b5839] pixel-text">Loading...</h1>
        </div>
      }
    >
      <NotFoundContent />
    </Suspense>
  )
}
