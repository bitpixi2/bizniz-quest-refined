"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface HotdogItem {
  id: number
  name: string
  description: string
  image: string
  acquired: boolean
  count: number // Added count property
}

export default function InventorySystem() {
  // Hotdog inventory items with random counts
  const [hotdogs, setHotdogs] = useState<HotdogItem[]>([
    {
      id: 1,
      name: "Classic Hotdog",
      description: "The original. Simple ketchup on a juicy hotdog.",
      image: "/images/hotdog1.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1, // Random count between 1-10
    },
    {
      id: 2,
      name: "Mustard Dog",
      description: "A tangy twist on the classic with yellow mustard.",
      image: "/images/hotdog2.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1,
    },
    {
      id: 3,
      name: "Relish Dog",
      description: "Sweet pickle relish adds a crunchy, tangy kick.",
      image: "/images/hotdog3.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1,
    },
    {
      id: 4,
      name: "Chili Dog",
      description: "Topped with spicy chili - a hearty classic.",
      image: "/images/hotdog4.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1,
    },
    {
      id: 5,
      name: "Cheese Dog",
      description: "Melted cheese makes everything better.",
      image: "/images/hotdog5.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1,
    },
    {
      id: 6,
      name: "Sauerkraut Dog",
      description: "Tangy fermented cabbage for a German twist.",
      image: "/images/hotdog6.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1,
    },
    {
      id: 7,
      name: "Bacon Dog",
      description: "Wrapped in crispy bacon for extra flavor.",
      image: "/images/hotdog7.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1,
    },
    {
      id: 8,
      name: "Jalapeño Dog",
      description: "Spicy jalapeños for those who like it hot.",
      image: "/images/hotdog8.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1,
    },
    {
      id: 9,
      name: "BBQ Dog",
      description: "Sweet and smoky BBQ sauce for a Southern touch.",
      image: "/images/hotdog9.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1,
    },
    {
      id: 10,
      name: "Grape Jelly Dog",
      description: "A surprisingly sweet and savory combination.",
      image: "/images/hotdog10.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1,
    },
    {
      id: 11,
      name: "Coleslaw Dog",
      description: "Topped with creamy, crunchy coleslaw.",
      image: "/images/hotdog11.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1,
    },
    {
      id: 12,
      name: "Mac & Cheese Dog",
      description: "Comfort food on comfort food. What's not to love?",
      image: "/images/hotdog12.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1,
    },
    {
      id: 13,
      name: "Guacamole Dog",
      description: "Creamy avocado goodness with a Mexican flair.",
      image: "/images/hotdog13.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1,
    },
    {
      id: 14,
      name: "Peanut Butter Dog",
      description: "A unique sweet and savory experience.",
      image: "/images/hotdog14.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1,
    },
    {
      id: 15,
      name: "Sriracha Dog",
      description: "Spicy Thai-style hot sauce for heat lovers.",
      image: "/images/hotdog15.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1,
    },
    {
      id: 16,
      name: "Fried Onion Dog",
      description: "Crispy fried onions add texture and flavor.",
      image: "/images/hotdog16.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1,
    },
    {
      id: 17,
      name: "Kimchi Dog",
      description: "Korean fermented cabbage for an umami punch.",
      image: "/images/hotdog17.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1,
    },
    {
      id: 18,
      name: "Honey Mustard Dog",
      description: "Sweet and tangy honey mustard sauce.",
      image: "/images/hotdog18.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1,
    },
    {
      id: 19,
      name: "Truffle Mayo Dog",
      description: "Luxurious truffle-infused mayonnaise for the gourmet.",
      image: "/images/hotdog19.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1,
    },
    {
      id: 20,
      name: "Rainbow Dog",
      description: "A colorful celebration of all flavors!",
      image: "/images/hotdog20.png",
      acquired: true,
      count: Math.floor(Math.random() * 10) + 1,
    },
  ])

  return (
    <div className="p-4 bg-[#f8f3e3] rounded-lg max-w-5xl mx-auto border-4 border-[#6b5839] pixel-borders">
      <div className="flex justify-center items-center mb-4">
        <h2 className="text-2xl font-pixel text-[#6b5839] text-center">BIZNIZ QUEST INVENTORY</h2>
      </div>

      <Card className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders">
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-xl font-pixel text-[#6b5839]">Hotdog Collection</CardTitle>
          <CardDescription className="font-pixel text-xs text-[#6b5839]">
            Your delicious business rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {hotdogs.map((hotdog) => (
              <div
                key={hotdog.id}
                className={`relative cursor-pointer p-3 rounded-lg border-2 
                  border-[#6b5839] bg-[#f0e6d2] pixel-borders transition-all hover:bg-[#e9dfc7]`}
              >
                <div className="relative">
                  <img
                    src={hotdog.image || "/placeholder.svg?height=48&width=48"}
                    alt={hotdog.name}
                    className={`w-full h-16 object-contain pixelated ${!hotdog.acquired ? "opacity-60" : ""}`}
                  />
                  {/* Count indicator - only show if count > 1 */}
                  {hotdog.count > 1 && (
                    <div className="absolute top-0 right-0 bg-[#7cb518] text-white w-6 h-6 flex items-center justify-center font-pixel text-xs border-2 border-[#6b5839] pixel-borders">
                      {hotdog.count}
                    </div>
                  )}
                </div>
                <p className="font-pixel text-xs text-center mt-2 text-[#6b5839] min-h-[2.5rem] line-clamp-2">
                  {hotdog.name}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
