"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lock, Package } from "lucide-react"

interface HotdogItem {
  id: number
  name: string
  description: string
  image: string
  acquired: boolean
}

export default function InventorySystem() {
  // Hotdog inventory items
  const [hotdogs, setHotdogs] = useState<HotdogItem[]>([
    {
      id: 1,
      name: "Classic Hotdog",
      description: "The original. Simple ketchup on a juicy hotdog.",
      image: "/images/hotdog1.png",
      acquired: true,
    },
    {
      id: 2,
      name: "Mustard Dog",
      description: "A tangy twist on the classic with yellow mustard.",
      image: "/images/hotdog2.png",
      acquired: true,
    },
    {
      id: 3,
      name: "Relish Dog",
      description: "Sweet pickle relish adds a crunchy, tangy kick.",
      image: "/images/hotdog3.png",
      acquired: true,
    },
    {
      id: 4,
      name: "Chili Dog",
      description: "Topped with spicy chili - a hearty classic.",
      image: "/images/hotdog4.png",
      acquired: true,
    },
    {
      id: 5,
      name: "Cheese Dog",
      description: "Melted cheese makes everything better.",
      image: "/images/hotdog5.png",
      acquired: true,
    },
    {
      id: 6,
      name: "Sauerkraut Dog",
      description: "Tangy fermented cabbage for a German twist.",
      image: "/images/hotdog6.png",
      acquired: true,
    },
    {
      id: 7,
      name: "Bacon Dog",
      description: "Wrapped in crispy bacon for extra flavor.",
      image: "/images/hotdog7.png",
      acquired: true,
    },
    {
      id: 8,
      name: "Jalapeño Dog",
      description: "Spicy jalapeños for those who like it hot.",
      image: "/images/hotdog8.png",
      acquired: true,
    },
    {
      id: 9,
      name: "BBQ Dog",
      description: "Sweet and smoky BBQ sauce for a Southern touch.",
      image: "/images/hotdog9.png",
      acquired: true,
    },
    {
      id: 10,
      name: "Grape Jelly Dog",
      description: "A surprisingly sweet and savory combination.",
      image: "/images/hotdog10.png",
      acquired: true,
    },
    {
      id: 11,
      name: "Coleslaw Dog",
      description: "Topped with creamy, crunchy coleslaw.",
      image: "/images/hotdog11.png",
      acquired: true,
    },
    {
      id: 12,
      name: "Mac & Cheese Dog",
      description: "Comfort food on comfort food. What's not to love?",
      image: "/images/hotdog12.png",
      acquired: true,
    },
    {
      id: 13,
      name: "Guacamole Dog",
      description: "Creamy avocado goodness with a Mexican flair.",
      image: "/images/hotdog13.png",
      acquired: true,
    },
    {
      id: 14,
      name: "Peanut Butter Dog",
      description: "A unique sweet and savory experience.",
      image: "/images/hotdog14.png",
      acquired: true,
    },
    {
      id: 15,
      name: "Sriracha Dog",
      description: "Spicy Thai-style hot sauce for heat lovers.",
      image: "/images/hotdog15.png",
      acquired: true,
    },
    {
      id: 16,
      name: "Fried Onion Dog",
      description: "Crispy fried onions add texture and flavor.",
      image: "/images/hotdog16.png",
      acquired: true,
    },
    {
      id: 17,
      name: "Kimchi Dog",
      description: "Korean fermented cabbage for an umami punch.",
      image: "/images/hotdog17.png",
      acquired: true,
    },
    {
      id: 18,
      name: "Honey Mustard Dog",
      description: "Sweet and tangy honey mustard sauce.",
      image: "/images/hotdog18.png",
      acquired: true,
    },
    {
      id: 19,
      name: "Truffle Mayo Dog",
      description: "Luxurious truffle-infused mayonnaise for the gourmet.",
      image: "/images/hotdog19.png",
      acquired: true,
    },
    {
      id: 20,
      name: "Rainbow Dog",
      description: "A colorful celebration of all flavors!",
      image: "/images/hotdog20.png",
      acquired: true,
    },
  ])

  const [selectedHotdog, setSelectedHotdog] = useState<HotdogItem | null>(null)

  return (
    <div className="p-4 bg-[#f8f3e3] rounded-lg max-w-5xl mx-auto border-4 border-[#6b5839] pixel-borders">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-pixel text-[#6b5839]">Hotdog Collection</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Hotdog Inventory */}
        <div className="md:col-span-1">
          <Card className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders h-full">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-xl font-pixel text-[#6b5839]">Hotdog Collection</CardTitle>
              <CardDescription className="font-pixel text-xs text-[#6b5839]">
                Your delicious business rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {hotdogs.map((hotdog) => (
                  <div
                    key={hotdog.id}
                    onClick={() => setSelectedHotdog(hotdog)}
                    className={`relative cursor-pointer p-2 rounded-lg border-2 ${
                      selectedHotdog?.id === hotdog.id
                        ? "border-[#7cb518] bg-[#d4e09b]"
                        : "border-[#6b5839] bg-[#f0e6d2]"
                    } pixel-borders transition-all hover:bg-[#e9dfc7]`}
                  >
                    <div className="relative">
                      <img
                        src={hotdog.image || "/placeholder.svg?height=48&width=48"}
                        alt={hotdog.name}
                        className={`w-full h-12 object-contain pixelated ${!hotdog.acquired ? "opacity-60" : ""}`}
                      />
                      {!hotdog.acquired && (
                        <div className="absolute top-0 right-0 bg-[#6b5839] text-white p-1 rounded-full">
                          <Lock className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <p className="font-pixel text-xs text-center mt-1 text-[#6b5839] truncate">{hotdog.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hotdog Details */}
        <div className="md:col-span-2">
          <Card className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders h-full">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-xl font-pixel text-[#6b5839]">Hotdog Details</CardTitle>
              <CardDescription className="font-pixel text-xs text-[#6b5839]">
                Examine your delicious rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {selectedHotdog ? (
                <div className="flex flex-col items-center">
                  <div className="bg-[#f0e6d2] p-4 rounded-lg border-2 border-[#6b5839] pixel-borders w-full mb-4">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="relative w-32 h-32 bg-white border-2 border-[#6b5839] pixel-borders overflow-hidden flex justify-center items-center">
                        <img
                          src={selectedHotdog.image || "/placeholder.svg?height=96&width=96"}
                          alt={selectedHotdog.name}
                          className="h-24 pixelated"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-pixel text-[#6b5839] mb-2">{selectedHotdog.name}</h3>
                        <p className="font-pixel text-sm text-[#6b5839]">{selectedHotdog.description}</p>
                        <div className="mt-4">
                          <Badge
                            className={`font-pixel text-xs ${
                              selectedHotdog.acquired ? "bg-[#7cb518] text-white" : "bg-[#d0c8b0] text-[#6b5839]"
                            }`}
                          >
                            {selectedHotdog.acquired ? "Acquired" : "Not Yet Acquired"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f0e6d2] p-4 rounded-lg border-2 border-[#6b5839] pixel-borders w-full">
                    <h3 className="text-lg font-pixel text-[#6b5839] mb-3">How to Earn</h3>
                    <p className="font-pixel text-xs text-[#6b5839]">
                      Complete business tasks and achievements to earn delicious hotdog rewards! Each hotdog represents
                      a milestone in your business journey.
                    </p>
                    <div className="mt-4 p-3 bg-[#ffe9b3] rounded-lg border border-[#6b5839]">
                      <p className="font-pixel text-xs text-[#6b5839] italic">
                        "In the world of business, success tastes like a well-earned hotdog."
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64">
                  <Package className="h-12 w-12 text-[#6b5839] opacity-50 mb-4" />
                  <p className="font-pixel text-sm text-[#6b5839] text-center">
                    Select a hotdog from your collection to view details
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
