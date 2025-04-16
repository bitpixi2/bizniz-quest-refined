"use client"

import { useState, useEffect, useRef } from "react"
import { useIsMobile } from "@/hooks/use-mobile" // Fixed import name
import { Volume2, VolumeX } from "lucide-react"

export default function BackgroundMusic() {
  const isMobile = useIsMobile() // Using the correct hook name
  const [isMuted, setIsMuted] = useState(isMobile)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create audio element
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/elevator-music.mp3")
      audioRef.current.loop = true
    }

    // Set initial volume based on device type
    if (isMobile) {
      audioRef.current.volume = 0
      audioRef.current.autoplay = false
    } else {
      audioRef.current.volume = 0.3
      audioRef.current.autoplay = true

      // Try to play (browsers may block autoplay)
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Auto-play was prevented
          // Show unmute button to encourage user interaction
          setIsMuted(true)
        })
      }
    }

    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
        audioRef.current = null
      }
    }
  }, [isMobile])

  // Toggle mute/unmute
  const toggleMute = () => {
    if (!audioRef.current) return

    if (isMuted) {
      audioRef.current.volume = 0.3
      audioRef.current.play().catch((error) => {
        console.error("Error playing audio:", error)
      })
    } else {
      audioRef.current.volume = 0
    }

    setIsMuted(!isMuted)
  }

  return (
    <button
      onClick={toggleMute}
      className="fixed top-4 right-4 z-50 bg-[#2a2a2a] p-2 rounded-full shadow-md hover:bg-[#3a3a3a] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#d75e38] focus:ring-opacity-50"
      aria-label={isMuted ? "Unmute background music" : "Mute background music"}
    >
      {isMuted ? <VolumeX className="w-6 h-6 text-[#d75e38]" /> : <Volume2 className="w-6 h-6 text-[#ffe9b3]" />}
    </button>
  )
}
