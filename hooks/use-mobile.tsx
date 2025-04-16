"use client"

import { useState, useEffect } from "react"

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Function to check if the screen is mobile-sized
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    // Initial check
    checkIsMobile()

    // Add event listener for window resize
    window.addEventListener("resize", checkIsMobile)

    // Clean up event listener
    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])

  return isMobile
}
