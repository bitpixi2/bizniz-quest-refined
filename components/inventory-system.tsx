"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface KeyboardItem {
  id: number
  name: string
  description: string
  image: string
  acquired: boolean
}

export default function InventorySystem() {
  // Keyboard keys inventory items without counts
  const [keyboardItems, setKeyboardItems] = useState<KeyboardItem[]>([
    {
      id: 1,
      name: "Escape Key",
      description: "For when you need to exit a situation quickly.",
      image: "/illuminated-escape-key.png",
      acquired: true,
    },
    {
      id: 2,
      name: "Enter Key",
      description: "Confirms your decisions, for better or worse.",
      image: "/illuminated-enter-key.png",
      acquired: true,
    },
    {
      id: 3,
      name: "Space Bar",
      description: "Creates breathing room between your thoughts.",
      image: "/keyboard-spacebar-close-up.png",
      acquired: true,
    },
    {
      id: 4,
      name: "Shift Key",
      description: "Changes your perspective on things.",
      image: "/keyboard-shift-key-close-up.png",
      acquired: true,
    },
    {
      id: 5,
      name: "Ctrl Key",
      description: "Helps you take control of the situation.",
      image: "/control-key-close-up.png",
      acquired: true,
    },
    {
      id: 6,
      name: "Alt Key",
      description: "Offers alternative solutions to problems.",
      image: "/alt-key-close-up.png",
      acquired: true,
    },
    {
      id: 7,
      name: "Tab Key",
      description: "Organizes your thoughts neatly.",
      image: "/keyboard-tab-key-close-up.png",
      acquired: true,
    },
    {
      id: 8,
      name: "Caps Lock",
      description: "MAKES EVERYTHING SEEM MORE IMPORTANT.",
      image: "/illuminated-caps-lock.png",
      acquired: true,
    },
    {
      id: 9,
      name: "Backspace",
      description: "Erases your mistakes, if only life were so simple.",
      image: "/backspace-key-close-up.png",
      acquired: true,
    },
    {
      id: 10,
      name: "Delete Key",
      description: "For permanently removing obstacles in your path.",
      image: "/keyboard-delete-closeup.png",
      acquired: true,
    },
    {
      id: 11,
      name: "Arrow Keys",
      description: "Navigate through life's challenges.",
      image: "/placeholder.svg?height=48&width=48&query=keyboard arrow keys",
      acquired: true,
    },
    {
      id: 12,
      name: "Function Key",
      description: "Serves special purposes when you need them most.",
      image: "/placeholder.svg?height=48&width=48&query=keyboard function key",
      acquired: true,
    },
    {
      id: 13,
      name: "Number Key",
      description: "For counting your successes (and occasional failures).",
      image: "/placeholder.svg?height=48&width=48&query=keyboard number key",
      acquired: true,
    },
    {
      id: 14,
      name: "Home Key",
      description: "Takes you back to where you started.",
      image: "/placeholder.svg?height=48&width=48&query=keyboard home key",
      acquired: true,
    },
    {
      id: 15,
      name: "End Key",
      description: "Jumps to the conclusion, sometimes prematurely.",
      image: "/placeholder.svg?height=48&width=48&query=keyboard end key",
      acquired: true,
    },
    {
      id: 16,
      name: "Page Up",
      description: "Helps you review what came before.",
      image: "/placeholder.svg?height=48&width=48&query=keyboard page up key",
      acquired: true,
    },
    {
      id: 17,
      name: "Page Down",
      description: "Shows you what's coming next.",
      image: "/placeholder.svg?height=48&width=48&query=keyboard page down key",
      acquired: true,
    },
    {
      id: 18,
      name: "Print Screen",
      description: "Captures moments worth remembering.",
      image: "/placeholder.svg?height=48&width=48&query=keyboard print screen key",
      acquired: true,
    },
    {
      id: 19,
      name: "Scroll Lock",
      description: "A mysterious relic from the ancient times.",
      image: "/placeholder.svg?height=48&width=48&query=keyboard scroll lock key",
      acquired: true,
    },
    {
      id: 20,
      name: "Pause Break",
      description: "Reminds you to take a moment for yourself.",
      image: "/placeholder.svg?height=48&width=48&query=keyboard pause break key",
      acquired: true,
    },
  ])

  const [selectedItem, setSelectedItem] = useState<KeyboardItem | null>(null)

  return (
    <div className="p-4 bg-[#f8f3e3] rounded-lg max-w-5xl mx-auto border-4 border-[#6b5839] pixel-borders">
      <div className="flex justify-center items-center mb-4">
        <h2 className="text-2xl font-pixel text-[#6b5839] text-center">BIZNIZ QUEST INVENTORY</h2>
      </div>

      <Card className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-xl font-pixel text-[#6b5839]">Keyboard Collection</CardTitle>
          <CardDescription className="font-pixel text-xs text-[#6b5839]">
            Your business productivity rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Details area in the top right - takes up space of 4 key modules */}
            <div className="md:col-span-1 md:row-span-2 md:col-start-5 md:row-start-1 order-1 md:order-1">
              <div className="h-full bg-[#f0e6d2] rounded-lg border-2 border-[#6b5839] pixel-borders p-3">
                <h3 className="font-pixel text-sm text-[#6b5839] mb-2">Key Details</h3>
                {selectedItem ? (
                  <div className="space-y-2">
                    <div className="flex justify-center mb-2">
                      <img
                        src={selectedItem.image || "/placeholder.svg"}
                        alt={selectedItem.name}
                        className="w-16 h-16 object-contain pixelated"
                      />
                    </div>
                    <h4 className="font-pixel text-xs text-[#6b5839] text-center">{selectedItem.name}</h4>
                    <p className="font-pixel text-xs text-[#6b5839] text-center">{selectedItem.description}</p>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="font-pixel text-xs text-[#6b5839] text-center">Select a key to view details</p>
                  </div>
                )}
              </div>
            </div>

            {/* Keyboard items grid */}
            <div className="md:col-span-4 order-2 md:order-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {keyboardItems.map((item) => (
                  <div
                    key={item.id}
                    className={`relative cursor-pointer p-3 rounded-lg border-2 
                      ${selectedItem?.id === item.id ? "border-[#7cb518] bg-[#d4e09b]" : "border-[#6b5839] bg-[#f0e6d2]"} 
                      pixel-borders transition-all hover:bg-[#e9dfc7]`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="relative">
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className={`w-full h-16 object-contain pixelated ${!item.acquired ? "opacity-60" : ""}`}
                      />
                      {/* Removed the count indicator */}
                    </div>
                    <p className="font-pixel text-xs text-center mt-2 text-[#6b5839] min-h-[2.5rem] line-clamp-2">
                      {item.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
