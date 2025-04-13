"use client"

import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <h1 className="text-4xl font-pixel mb-4 text-[#6b5839] pixel-text">Something went wrong!</h1>
          <p className="font-pixel text-[#6b5839] mb-8">
            An unexpected error occurred. Our office gnomes are working on it!
          </p>
          <Button
            onClick={() => reset()}
            className="bg-[#ffe9b3] text-[#6b5839] border-2 border-[#6b5839] hover:bg-[#f0e6d2] font-pixel pixel-borders"
          >
            Try again
          </Button>
        </div>
      </body>
    </html>
  )
}
