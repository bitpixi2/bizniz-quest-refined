"use client"

import { useEffect, useState, useCallback } from "react"

// Define types for our floating items
interface FloatingItem {
  id: number
  x: number
  y: number
  flipped: boolean
  speed: number
  direction: { x: number; y: number }
  type: "chair" | "folder"
}

export default function FloatingItems() {
  const [items, setItems] = useState<FloatingItem[]>([])

  // Create a memoized function to initialize items
  const initializeItems = useCallback(() => {
    const initialItems: FloatingItem[] = []

    // Function to create a random item
    const createItem = (id: number, type: "chair" | "folder"): FloatingItem => ({
      id,
      x: Math.random() * window.innerWidth * 0.8,
      y: Math.random() * window.innerHeight * 0.8,
      flipped: Math.random() > 0.5,
      // Chairs move slightly faster than folders
      speed: type === "chair" ? 0.5 + Math.random() * 0.6 : 0.45 + Math.random() * 0.55,
      direction: {
        x: Math.random() > 0.5 ? 1 : -1,
        y: Math.random() > 0.5 ? 1 : -1,
      },
      type,
    })

    // Add 8 chairs
    for (let i = 0; i < 8; i++) {
      initialItems.push(createItem(i, "chair"))
    }

    // Add 8 folders
    for (let i = 0; i < 8; i++) {
      initialItems.push(createItem(i + 8, "folder"))
    }

    return initialItems
  }, [])

  useEffect(() => {
    // Initialize items
    setItems(initializeItems())

    // Animation loop with throttling
    let animationFrameId: number
    let lastUpdate = 0
    const fps = 60 // 60 FPS for smooth animation
    const fpsInterval = 1000 / fps

    const animate = (timestamp: number) => {
      // Throttle updates to the specified FPS
      if (timestamp - lastUpdate < fpsInterval) {
        animationFrameId = requestAnimationFrame(animate)
        return
      }

      lastUpdate = timestamp

      setItems((prevItems) =>
        prevItems.map((item) => {
          // Update position
          let newX = item.x + item.direction.x * item.speed
          let newY = item.y + item.direction.y * item.speed

          // Bounce off edges
          const itemWidth = item.type === "chair" ? 120 : 48
          const itemHeight = item.type === "chair" ? 120 : 48

          if (newX <= 0 || newX >= window.innerWidth - itemWidth) {
            item.direction.x *= -1
            newX = item.x + item.direction.x * item.speed
          }
          if (newY <= 0 || newY >= window.innerHeight - itemHeight) {
            item.direction.y *= -1
            newY = item.y + item.direction.y * item.speed
          }

          return {
            ...item,
            x: newX,
            y: newY,
          }
        }),
      )

      animationFrameId = requestAnimationFrame(animate)
    }

    animationFrameId = requestAnimationFrame(animate)

    // Handle window resize
    const handleResize = () => {
      setItems((prevItems) =>
        prevItems.map((item) => {
          // Keep items within bounds after resize
          const x = Math.min(item.x, window.innerWidth - 100)
          const y = Math.min(item.y, window.innerHeight - 100)
          return { ...item, x, y }
        }),
      )
    }

    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", handleResize)
    }
  }, [initializeItems])

  // Render the floating items
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" style={{ backgroundColor: "transparent" }}>
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute pixelated"
          style={{
            left: `${item.x}px`,
            top: `${item.y}px`,
            transform: item.flipped ? "scaleX(-1)" : "none",
          }}
        >
          {item.type === "chair" ? (
            <img src="/images/rollychair.png" alt="Office Chair" className="w-28 h-28 md:w-32 md:h-32 pixelated" />
          ) : (
            <img src="/images/manillafolder.png" alt="Folder" className="w-11 h-11 md:w-13 md:h-13 pixelated" />
          )}
        </div>
      ))}
    </div>
  )
}
