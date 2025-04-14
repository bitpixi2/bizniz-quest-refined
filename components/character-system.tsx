"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Heart,
  Save,
  Lock,
  CheckCircle,
  BookOpen,
  Briefcase,
  Users,
  Home,
  Baby,
  Coffee,
  Sparkles,
  Pizza,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { saveCharacterData, loadUserData } from "@/lib/actions"
import { Textarea } from "@/components/ui/textarea"

interface LifeBalanceCategory {
  id: string
  name: string
  level: number
  maxLevel: number
  description: string
  icon: React.ReactNode
}

interface Character {
  id: number
  name: string
  description: string
  sprite: string
  unlocked: boolean
}

interface CharacterSystemProps {
  onError?: (message: string) => void
}

export default function CharacterSystem({ onError }: CharacterSystemProps = {}) {
  const { user } = useAuth()
  const [lifeBalanceNotes, setLifeBalanceNotes] = useState("")
  const [totalPointsUsed, setTotalPointsUsed] = useState(0)
  const [totalPointsAvailable] = useState(20)
  const [isSaving, setIsSaving] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  // Character selection state
  const [characters, setCharacters] = useState<Character[]>([
    {
      id: 1,
      name: "Business Rookie",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character1",
      description: "Just starting out in the business world. Eager to learn and full of energy!",
      unlocked: true,
    },
    {
      id: 2,
      name: "Tech Wizard",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character2",
      description: "A coding genius with a passion for innovation and problem-solving.",
      unlocked: true,
    },
    {
      id: 3,
      name: "Creative Mind",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character3",
      description: "An artistic soul who brings fresh ideas and unique perspectives.",
      unlocked: true,
    },
    {
      id: 4,
      name: "Finance Guru",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character4",
      description: "Master of numbers and financial strategies. Always counting the beans.",
      unlocked: false,
    },
    {
      id: 5,
      name: "Marketing Maven",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character5",
      description: "Expert in branding and promotion. Knows how to make a splash!",
      unlocked: false,
    },
    {
      id: 6,
      name: "Sales Star",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character6",
      description: "Could sell ice to penguins. Charismatic and persuasive.",
      unlocked: false,
    },
    {
      id: 7,
      name: "HR Hero",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character7",
      description: "People person extraordinaire. Builds teams and resolves conflicts.",
      unlocked: false,
    },
    {
      id: 8,
      name: "Operations Ace",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character8",
      description: "Efficiency expert who keeps everything running smoothly.",
      unlocked: false,
    },
    {
      id: 9,
      name: "Strategy Sage",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character9",
      description: "Visionary thinker with a knack for long-term planning.",
      unlocked: false,
    },
    {
      id: 10,
      name: "Legal Eagle",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character10",
      description: "Sharp mind for regulations and contracts. Keeps you out of trouble.",
      unlocked: false,
    },
    {
      id: 11,
      name: "Startup Founder",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character11",
      description: "Risk-taker with big dreams and the drive to make them happen.",
      unlocked: false,
    },
    {
      id: 12,
      name: "Corporate Climber",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character12",
      description: "Ambitious professional climbing the corporate ladder one rung at a time.",
      unlocked: false,
    },
    {
      id: 13,
      name: "Freelance Nomad",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character13",
      description: "Independent worker who values freedom and flexibility.",
      unlocked: false,
    },
    {
      id: 14,
      name: "Data Scientist",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character14",
      description: "Analytics expert who finds patterns in the numbers.",
      unlocked: false,
    },
    {
      id: 15,
      name: "Product Manager",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character15",
      description: "Jack of all trades who shepherds ideas from concept to launch.",
      unlocked: false,
    },
    {
      id: 16,
      name: "Customer Support",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character16",
      description: "Patient problem-solver with excellent people skills.",
      unlocked: false,
    },
    {
      id: 17,
      name: "UX Designer",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character17",
      description: "Creates intuitive, user-friendly experiences with style.",
      unlocked: false,
    },
    {
      id: 18,
      name: "Content Creator",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character18",
      description: "Storyteller who crafts compelling narratives across media.",
      unlocked: false,
    },
    {
      id: 19,
      name: "Investor",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character19",
      description: "Shrewd money manager with an eye for opportunity.",
      unlocked: false,
    },
    {
      id: 20,
      name: "Executive",
      sprite: "https://api.dicebear.com/7.x/pixel-art/png?seed=character20",
      description: "Seasoned leader who makes tough decisions and inspires teams.",
      unlocked: false,
    },
  ])

  const [selectedCharacter, setSelectedCharacter] = useState<Character>(characters[0])
  const [showUnlockModal, setShowUnlockModal] = useState<number | null>(null)
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)

  // Function to unlock a character
  const handleUnlockCharacter = (characterId: number) => {
    // In a real app, this would handle payment processing
    setCharacters(characters.map((char) => (char.id === characterId ? { ...char, unlocked: true } : char)))

    // Set the newly unlocked character as selected
    const unlockedChar = characters.find((c) => c.id === characterId)
    if (unlockedChar) {
      setSelectedCharacter({ ...unlockedChar, unlocked: true })
    }

    setShowUnlockModal(null)
    setPurchaseSuccess(true)
  }

  // Load unlocked characters from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCharacters = localStorage.getItem("bizquest-unlocked-characters")
      if (savedCharacters) {
        const unlockedIds = JSON.parse(savedCharacters)
        setCharacters((chars) =>
          chars.map((char) => ({
            ...char,
            unlocked: char.unlocked || unlockedIds.includes(char.id),
          })),
        )
      }
    }
  }, [])

  // Save unlocked characters to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const unlockedIds = characters.filter((c) => c.unlocked).map((c) => c.id)
      localStorage.setItem("bizquest-unlocked-characters", JSON.stringify(unlockedIds))
    }
  }, [characters])

  // Initialize life balance categories
  const [lifeBalanceCategories, setLifeBalanceCategories] = useState<LifeBalanceCategory[]>([
    {
      id: "love-life",
      name: "LOVE LIFE",
      level: 0,
      maxLevel: 5,
      description: "Because swiping right on spreadsheets doesn't count as romance",
      icon: <Heart className="h-5 w-5 text-red-500" />,
    },
    {
      id: "energy",
      name: "ENERGY",
      level: 0,
      maxLevel: 5,
      description: "For when coffee just isn't cutting it anymore",
      icon: <Coffee className="h-5 w-5 text-amber-500" />,
    },
    {
      id: "learning",
      name: "LEARNING",
      level: 0,
      maxLevel: 5,
      description: "Watching YouTube tutorials at 2x speed and still understanding nothing",
      icon: <BookOpen className="h-5 w-5 text-blue-500" />,
    },
    {
      id: "job",
      name: "JOB",
      level: 0,
      maxLevel: 5,
      description: "That thing you do between checking social media",
      icon: <Briefcase className="h-5 w-5 text-purple-500" />,
    },
    {
      id: "friendships",
      name: "FRIENDSHIPS",
      level: 0,
      maxLevel: 5,
      description: "People who tolerate your jokes and eat your cooking",
      icon: <Users className="h-5 w-5 text-green-500" />,
    },
    {
      id: "clean-house",
      name: "CLEAN HOUSE",
      level: 0,
      maxLevel: 5,
      description: "The mythical state your home reaches 5 minutes before guests arrive",
      icon: <Home className="h-5 w-5 text-orange-500" />,
    },
    {
      id: "dependents",
      name: "DEPENDENTS",
      level: 0,
      maxLevel: 5,
      description: "Kids, pets, plants, or that one friend who always needs help moving",
      icon: <Baby className="h-5 w-5 text-pink-500" />,
    },
    {
      id: "snack-time",
      name: "SNACK TIME",
      level: 0,
      maxLevel: 5,
      description: "The sacred ritual of staring into the fridge every 20 minutes hoping food materializes",
      icon: <Pizza className="h-5 w-5 text-yellow-500" />,
    },
  ])

  // Calculate total points used whenever life balance categories change
  useEffect(() => {
    const pointsUsed = lifeBalanceCategories.reduce((total, category) => total + category.level, 0)
    setTotalPointsUsed(pointsUsed)
  }, [lifeBalanceCategories])

  // Load data from the database when the component mounts
  useEffect(() => {
    if (user) {
      loadDataFromDatabase()
    }
  }, [user])

  // Function to load data from the database
  const loadDataFromDatabase = async () => {
    if (!user) return

    try {
      const data = await loadUserData(user.id)

      if (data.error) {
        console.error(`Error loading data: ${data.error}`)

        // Check if it's an auth error
        if (data.isAuthError) {
          setSyncMessage("Your session has expired. Please refresh the page.")
          if (onError) onError("Authentication expired. Please refresh the page or log in again.")
          return
        }

        setSyncMessage(`Error: ${data.error}. Using local data.`)
        if (onError) onError(`Failed to load character data: ${data.error}`)
        setTimeout(() => setSyncMessage(null), 3000)
        return
      }

      // Update life balance categories if available
      if (data.lifeBalanceCategories && data.lifeBalanceCategories.length > 0) {
        // Make sure we preserve the Snack Time category if it's not in the loaded data
        const formattedCategories = data.lifeBalanceCategories.map((category: any) => ({
          ...category,
          icon: getIconForCategory(category.id),
        }))

        // Check if Snack Time is in the loaded categories
        const hasSnackTime = formattedCategories.some((cat: any) => cat.id === "snack-time")

        // If not, add it to the formatted categories
        if (!hasSnackTime) {
          formattedCategories.push({
            id: "snack-time",
            name: "SNACK TIME",
            level: 0,
            maxLevel: 5,
            description: "The sacred ritual of staring into the fridge every 20 minutes hoping food materializes",
            icon: <Pizza className="h-5 w-5 text-yellow-500" />,
          })
        }

        setLifeBalanceCategories(formattedCategories)
      }

      // Update life balance notes if available
      if (data.lifeBalanceNotes) {
        setLifeBalanceNotes(data.lifeBalanceNotes)
      }

      // Update selected character if available
      if (data.selectedCharacterId) {
        const character = characters.find((c) => c.id === data.selectedCharacterId)
        if (character) {
          setSelectedCharacter(character)
        }
      }

      setSyncMessage("Data loaded successfully!")
      setTimeout(() => setSyncMessage(null), 2000)
    } catch (error) {
      console.error("Error loading data:", error)
      setSyncMessage("Error loading data. Using local data.")
      setTimeout(() => setSyncMessage(null), 3000)
    }
  }

  // Function to save data to the database
  const saveDataToDatabase = async () => {
    if (!user) return

    setIsSaving(true)
    setSyncMessage("Saving...")

    try {
      // Format life balance categories for saving (without React elements)
      const categoriesData = lifeBalanceCategories.map((category) => ({
        id: category.id,
        name: category.name,
        level: category.level,
        maxLevel: category.maxLevel,
        description: category.description,
      }))

      const result = await saveCharacterData(user.id, {
        lifeBalanceCategories: categoriesData,
        lifeBalanceNotes,
        selectedCharacterId: selectedCharacter.id,
      })

      if (result.error) {
        console.error(`Error saving data: ${result.error}`)
        setSyncMessage(`Error: ${result.error}`)
        setTimeout(() => setSyncMessage(null), 3000)
        return
      }

      setSyncMessage("Saved successfully!")
      setTimeout(() => setSyncMessage(null), 2000)
    } catch (error) {
      console.error("Error saving data:", error)
      setSyncMessage("Error saving data.")
      setTimeout(() => setSyncMessage(null), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // Helper function to get the appropriate icon for a category
  function getIconForCategory(id: string) {
    switch (id) {
      case "love-life":
        return <Heart className="h-5 w-5 text-red-500" />
      case "energy":
        return <Coffee className="h-5 w-5 text-amber-500" />
      case "learning":
        return <BookOpen className="h-5 w-5 text-blue-500" />
      case "job":
        return <Briefcase className="h-5 w-5 text-purple-500" />
      case "friendships":
        return <Users className="h-5 w-5 text-green-500" />
      case "clean-house":
        return <Home className="h-5 w-5 text-orange-500" />
      case "dependents":
        return <Baby className="h-5 w-5 text-pink-500" />
      case "snack-time":
        return <Pizza className="h-5 w-5 text-yellow-500" />
      default:
        return <Sparkles className="h-5 w-5 text-gray-500" />
    }
  }

  // Set a specific level for a category
  const setCategoryLevel = (categoryId: string, level: number) => {
    // Check if setting this level would exceed the total points available
    const currentLevel = lifeBalanceCategories.find((cat) => cat.id === categoryId)?.level || 0
    const pointDifference = level - currentLevel

    if (totalPointsUsed + pointDifference > totalPointsAvailable) {
      setSyncMessage(`You only have ${totalPointsAvailable - totalPointsUsed} points left to spend!`)
      setTimeout(() => setSyncMessage(null), 3000)
      return
    }

    setLifeBalanceCategories((prevCategories) =>
      prevCategories.map((category) => {
        if (category.id === categoryId) {
          return { ...category, level }
        }
        return category
      }),
    )
  }

  // Return the component JSX
  return (
    <div className="p-4 bg-[#f8f3e3] rounded-lg max-w-5xl mx-auto border-4 border-[#6b5839] pixel-borders">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-pixel text-[#6b5839]">Character Stats</h2>

        {user && (
          <div className="flex gap-2">
            <Button
              onClick={saveDataToDatabase}
              disabled={isSaving}
              className="bg-[#7cb518] text-white border-2 border-[#6b5839] hover:bg-[#6b9c16] font-pixel pixel-borders flex items-center gap-1"
              size="sm"
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          </div>
        )}
      </div>

      {syncMessage && (
        <div className="bg-[#f0e6d2] border-2 border-[#6b5839] text-[#6b5839] px-4 py-2 rounded mb-4 font-pixel text-center text-sm">
          {syncMessage}
        </div>
      )}

      {/* Selected Character Display at the top */}
      <div className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders p-4 rounded-lg mb-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-32 h-32 bg-[#f0e6d2] border-2 border-[#6b5839] pixel-borders overflow-hidden flex justify-center items-center">
            <img
              src={selectedCharacter.sprite || "/placeholder.svg"}
              alt={selectedCharacter.name}
              className="h-24 pixelated"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-pixel text-[#6b5839] mb-2">{selectedCharacter.name}</h3>
            <p className="font-pixel text-sm text-[#6b5839]">{selectedCharacter.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Character Selection Menu */}
        <div className="md:col-span-1">
          <Card className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders h-full">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-xl font-pixel text-[#6b5839]">Characters</CardTitle>
              <CardDescription className="font-pixel text-xs text-[#6b5839]">
                Select your business persona
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {characters.map((character) => (
                  <div
                    key={character.id}
                    onClick={() =>
                      character.unlocked ? setSelectedCharacter(character) : setShowUnlockModal(character.id)
                    }
                    className={`relative cursor-pointer p-2 rounded-lg border-2 ${
                      selectedCharacter.id === character.id
                        ? "border-[#7cb518] bg-[#d4e09b]"
                        : "border-[#6b5839] bg-[#f0e6d2]"
                    } pixel-borders transition-all hover:bg-[#e9dfc7]`}
                  >
                    <div className="relative">
                      <img
                        src={character.sprite || "/placeholder.svg"}
                        alt={character.name}
                        className={`w-full h-16 object-contain pixelated ${!character.unlocked ? "opacity-60" : ""}`}
                      />
                      {!character.unlocked && (
                        <div className="absolute top-0 right-0 bg-[#6b5839] text-white p-1 rounded-full">
                          <Lock className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <p className="font-pixel text-xs text-center mt-1 text-[#6b5839] truncate">{character.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Life Balance Plan */}
        <div className="md:col-span-2">
          <Card className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders h-full">
            <CardHeader className="p-4 pb-0">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl font-pixel text-[#6b5839]">LIFE BALANCE PLAN</CardTitle>
              </div>
              <div
                className={`font-pixel text-sm ${totalPointsUsed === totalPointsAvailable ? "text-red-500" : "text-green-500"} mt-1`}
              >
                {totalPointsUsed}/{totalPointsAvailable} Points Used
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-4">
                {lifeBalanceCategories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-[#f0e6d2] p-3 rounded-lg border-2 border-[#6b5839] pixel-borders flex flex-col sm:flex-row items-start sm:items-center"
                  >
                    <div className="mr-3 w-10 h-10 flex items-center justify-center mb-2 sm:mb-0">{category.icon}</div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap justify-between items-center mb-1">
                        <h3 className="font-pixel text-sm text-[#6b5839]">{category.name}</h3>
                        <Badge className="font-pixel text-xs mt-1 sm:mt-0 bg-[#7cb518]">
                          {category.level} / {category.maxLevel}
                        </Badge>
                      </div>
                      <p className="font-pixel text-xs text-[#6b5839] mb-1">{category.description}</p>
                      <div className="flex items-center gap-1">
                        <div className="flex-1 flex gap-1">
                          {Array.from({ length: category.maxLevel }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-3 w-full ${
                                i < category.level ? "bg-[#7cb518]" : "bg-[#d0c8b0]"
                              } border border-[#6b5839] pixel-borders cursor-pointer`}
                              onClick={() => setCategoryLevel(category.id, i + 1)}
                              title={`Set to level ${i + 1}`}
                              aria-label={`Set ${category.name} to level ${i + 1}`}
                              role="button"
                              tabIndex={0}
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Life Balance Notes Section */}
                <div className="mt-6 bg-[#f0e6d2] border-2 border-[#6b5839] pixel-borders p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-pixel text-[#6b5839]">LIFE BALANCE NOTES</h3>
                    <Button
                      onClick={saveDataToDatabase}
                      disabled={isSaving}
                      className="bg-[#7cb518] text-white border-2 border-[#6b5839] hover:bg-[#6b9c16] font-pixel pixel-borders"
                      size="sm"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                  <Textarea
                    value={lifeBalanceNotes}
                    onChange={(e) => setLifeBalanceNotes(e.target.value)}
                    placeholder="Add your life balance notes here..."
                    className="font-pixel text-sm text-[#6b5839] bg-[#ffe9b3] border-2 border-[#6b5839] min-h-[120px] p-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unlock Character Modal */}
      {showUnlockModal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-pixel text-[#6b5839] mb-4">Unlock Character</h3>
            <div className="flex items-center gap-4 mb-4">
              <img
                src={characters.find((c) => c.id === showUnlockModal)?.sprite || "/placeholder.svg"}
                alt="Character"
                className="w-20 h-20 object-contain pixelated"
              />
              <div>
                <p className="font-pixel text-sm text-[#6b5839]">
                  {characters.find((c) => c.id === showUnlockModal)?.name}
                </p>
                <p className="font-pixel text-xs text-[#6b5839] mt-1">This character is locked. Unlock to use it!</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowUnlockModal(null)}
                variant="outline"
                className="border-2 border-[#6b5839] text-[#6b5839] font-pixel"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleUnlockCharacter(showUnlockModal)}
                className="bg-[#7cb518] text-white border-2 border-[#6b5839] hover:bg-[#6b9c16] font-pixel"
              >
                Unlock for $2.99
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Success Modal */}
      {purchaseSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders p-6 rounded-lg max-w-md w-full">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-[#7cb518]" />
            </div>
            <h3 className="text-xl font-pixel text-[#6b5839] mb-2 text-center">Character Unlocked!</h3>
            <p className="font-pixel text-sm text-[#6b5839] text-center mb-4">
              You can now use this character in your business adventures.
            </p>
            <div className="flex justify-center">
              <Button
                onClick={() => setPurchaseSuccess(false)}
                className="bg-[#7cb518] text-white border-2 border-[#6b5839] hover:bg-[#6b9c16] font-pixel"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
