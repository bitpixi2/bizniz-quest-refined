"use client"

import { useState } from "react"
import CharacterSystem from "@/components/character-system"
import BackgroundMusic from "@/components/background-music"
import BackArrow from "@/components/back-arrow"
import ProtectedRoute from "@/components/auth/protected-route"
import { Card, CardContent } from "@/components/ui/card"

export default function CharacterPage() {
  const [error, setError] = useState<string | null>(null)

  return (
    <ProtectedRoute>
      <BackgroundMusic src="/sounds/doing_music.mp3" volume={0.3} />
      <main className="min-h-screen p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <BackArrow href="/" />
            <h1 className="text-4xl font-pixel text-center text-[#6b5839] pixel-text">Character</h1>
            <div className="w-[70px]"></div> {/* Spacer for alignment */}
          </div>

          {error && (
            <Card className="mb-6 bg-red-50 border-red-200">
              <CardContent className="p-4">
                <p className="font-pixel text-sm text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          <CharacterSystem onError={(msg) => setError(msg)} />
        </div>
      </main>
    </ProtectedRoute>
  )
}
