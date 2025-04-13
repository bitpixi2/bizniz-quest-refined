"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Brain,
  Heart,
  Users,
  Zap,
  Code,
  Briefcase,
  BookOpen,
  Network,
  Cpu,
  Save,
  Lock,
  CheckCircle,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { saveCharacterStats, saveSkills, loadUserData } from "@/lib/actions"

interface Skill {
  id: string
  name: string
  level: number
  maxLevel: number
  description: string
  wandImage: string
  category: "business" | "tech" | "creative" | "social"
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
  // Initialize character stats from localStorage or default values
  const [stats, setStats] = useState(() => {
    if (typeof window !== "undefined") {
      const savedStats =
        localStorage.getItem("bizquest-character-stats") || localStorage.getItem("bizniz-quest-character-stats")
      if (savedStats) {
        return JSON.parse(savedStats)
      }
    }
    return {
      energy: 70,
      learning: 45,
      relationships: 60,
    }
  })

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

  // Initialize skills from localStorage or default values
  const [skills, setSkills] = useState<Skill[]>(() => {
    if (typeof window !== "undefined") {
      const savedSkills =
        localStorage.getItem("bizquest-character-skills") || localStorage.getItem("bizniz-quest-character-skills")
      if (savedSkills) {
        // Parse the saved skills and reconstruct the React elements for icons
        const parsedSkills = JSON.parse(savedSkills)
        return parsedSkills.map((skill: any) => ({
          ...skill,
          icon: getIconForSkill(skill.id, skill.category),
        }))
      }
    }

    // Default skills data
    return [
      {
        id: "web-dev",
        name: "Web Development",
        level: 3,
        maxLevel: 5,
        description: "Ability to create and maintain websites",
        wandImage: "",
        category: "tech",
        icon: <Code className="h-5 w-5 text-blue-500" />,
      },
      {
        id: "business-admin",
        name: "Business Admin",
        level: 2,
        maxLevel: 5,
        description: "Knowledge of business registration and administration",
        wandImage: "",
        category: "business",
        icon: <Briefcase className="h-5 w-5 text-amber-500" />,
      },
      {
        id: "creative-writing",
        name: "Creative Writing",
        level: 1,
        maxLevel: 5,
        description: "Ability to write engaging content and stories",
        wandImage: "",
        category: "creative",
        icon: <BookOpen className="h-5 w-5 text-red-500" />,
      },
      {
        id: "networking",
        name: "Networking",
        level: 0,
        maxLevel: 5,
        description: "Ability to connect with others and build relationships",
        wandImage: "",
        category: "social",
        icon: <Network className="h-5 w-5 text-green-500" />,
      },
      {
        id: "ai-knowledge",
        name: "AI Knowledge",
        level: 0,
        maxLevel: 5,
        description: "Understanding of artificial intelligence and its applications",
        wandImage: "",
        category: "tech",
        icon: <Cpu className="h-5 w-5 text-purple-500" />,
      },
    ]
  })

  const [isSaving, setIsSaving] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

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
        setSyncMessage(`Error: ${data.error}. Using local data.`)
        if (onError) onError(`Failed to load character data: ${data.error}`)
        setTimeout(() => setSyncMessage(null), 3000)
        return
      }

      // Update character stats
      if (data.characterStats) {
        setStats(data.characterStats)
        localStorage.setItem("bizniz-quest-character-stats", JSON.stringify(data.characterStats))
      }

      // Update skills
      if (data.skills && data.skills.length > 0) {
        const formattedSkills = data.skills.map((skill: any) => ({
          ...skill,
          icon: getIconForSkill(skill.id, skill.category),
        }))
        setSkills(formattedSkills)

        // Save to localStorage without the React elements
        const serializableSkills = formattedSkills.map((skill) => ({
          ...skill,
          icon: null,
        }))
        localStorage.setItem("bizniz-quest-character-skills", JSON.stringify(serializableSkills))
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
      // Save character stats
      const statsResult = await saveCharacterStats(user.id, stats)

      if (statsResult.error) {
        console.error(`Error saving stats: ${statsResult.error}`)
        return
      }

      // Save skills
      const skillsData = skills.map((skill) => ({
        id: skill.id,
        name: skill.name,
        level: skill.level,
        maxLevel: skill.maxLevel,
        description: skill.description,
        category: skill.category,
      }))

      const skillsResult = await saveSkills(user.id, skillsData)

      if (skillsResult.error) {
        console.error(`Error saving skills: ${skillsResult.error}`)
        return
      }

      setSyncMessage("Saved!")

      // Manually refresh the page after saving
      if (typeof window !== "undefined") {
        window.location.reload()
      }
    } catch (error) {
      console.error("Error saving data:", error)
    } finally {
      setIsSaving(false)
      // Clear message after 2 seconds
      setTimeout(() => setSyncMessage(null), 2000)
    }
  }

  // Helper function to get the appropriate icon for a skill
  function getIconForSkill(id: string, category: string) {
    switch (id) {
      case "web-dev":
        return <Code className="h-5 w-5 text-blue-500" />
      case "business-admin":
        return <Briefcase className="h-5 w-5 text-amber-500" />
      case "creative-writing":
        return <BookOpen className="h-5 w-5 text-red-500" />
      case "networking":
        return <Network className="h-5 w-5 text-green-500" />
      case "ai-knowledge":
        return <Cpu className="h-5 w-5 text-purple-500" />
      default:
        // Default icon based on category
        if (category === "tech") return <Code className="h-5 w-5 text-blue-500" />
        if (category === "business") return <Briefcase className="h-5 w-5 text-amber-500" />
        if (category === "creative") return <BookOpen className="h-5 w-5 text-red-500" />
        if (category === "social") return <Network className="h-5 w-5 text-green-500" />
        return <Zap className="h-5 w-5 text-gray-500" />
    }
  }

  // Save stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("bizniz-quest-character-stats", JSON.stringify(stats))
  }, [stats])

  // Save skills to localStorage whenever they change
  useEffect(() => {
    // We need to serialize the skills without the React elements
    const serializableSkills = skills.map((skill) => ({
      ...skill,
      icon: null, // Remove the React element before serializing
    }))
    localStorage.setItem("bizniz-quest-character-skills", JSON.stringify(serializableSkills))
  }, [skills])

  // Set a specific level for a skill
  const setSkillLevel = (skillId: string, level: number) => {
    setSkills((prevSkills) =>
      prevSkills.map((skill) => {
        if (skill.id === skillId) {
          return { ...skill, level }
        }
        return skill
      }),
    )
  }

  // Level up a skill (for the + button)
  const levelUpSkill = (skillId: string) => {
    setSkills((prevSkills) =>
      prevSkills.map((skill) => {
        if (skill.id === skillId && skill.level < skill.maxLevel) {
          return { ...skill, level: skill.level + 1 }
        }
        return skill
      }),
    )
  }

  // Update a stat value when clicking on the progress bar
  const updateStat = (statName: "energy" | "learning" | "relationships", event: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = event.currentTarget
    const rect = progressBar.getBoundingClientRect()
    const x = event.clientX - rect.left
    const width = rect.width
    const percentage = Math.round((x / width) * 100)

    // Ensure the value is between 0 and 100
    const newValue = Math.max(0, Math.min(100, percentage))

    setStats((prevStats) => ({
      ...prevStats,
      [statName]: newValue,
    }))
  }

  // Replace the return statement with the new layout including character selection and inventory
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

        {/* Skills */}
        <div className="md:col-span-2">
          <Card className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders h-full">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-xl font-pixel text-[#6b5839]">Skills</CardTitle>
              <CardDescription className="font-pixel text-xs text-[#6b5839]">
                Level up or cry trying! No refunds on skill points.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-4">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className={`bg-[#f0e6d2] p-3 rounded-lg border-2 border-[#6b5839] pixel-borders flex flex-col sm:flex-row items-start sm:items-center ${
                      skill.level === 0 ? "opacity-50" : ""
                    }`}
                  >
                    <div className="mr-3 w-10 h-10 flex items-center justify-center mb-2 sm:mb-0">{skill.icon}</div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-wrap justify-between items-center mb-1">
                        <h3 className="font-pixel text-sm text-[#6b5839]">{skill.name}</h3>
                        <Badge
                          className={`font-pixel text-xs mt-1 sm:mt-0 ${
                            skill.category === "tech"
                              ? "bg-blue-500"
                              : skill.category === "business"
                                ? "bg-amber-500"
                                : skill.category === "creative"
                                  ? "bg-red-500"
                                  : "bg-green-500"
                          }`}
                        >
                          {skill.category}
                        </Badge>
                      </div>
                      <p className="font-pixel text-xs text-[#6b5839] mb-1">{skill.description}</p>
                      <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap">
                        <span className="font-pixel text-xs text-[#6b5839] mr-1">Level:</span>
                        <div className="flex-1 flex gap-1">
                          {Array.from({ length: skill.maxLevel }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-3 w-full ${
                                i < skill.level ? "bg-[#7cb518]" : "bg-[#d0c8b0]"
                              } border border-[#6b5839] pixel-borders cursor-pointer`}
                              onClick={() => setSkillLevel(skill.id, i + 1)}
                              title={`Set to level ${i + 1}`}
                              aria-label={`Set ${skill.name} to level ${i + 1}`}
                              role="button"
                              tabIndex={0}
                            ></div>
                          ))}
                        </div>
                        <button
                          onClick={() => levelUpSkill(skill.id)}
                          className="ml-2 px-2 py-1 bg-[#ffe9b3] border border-[#6b5839] rounded font-pixel text-xs text-[#6b5839] pixel-borders"
                          disabled={skill.level >= skill.maxLevel}
                          aria-label={`Level up ${skill.name}`}
                        >
                          <Zap className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Character Stats Section - Now under skills */}
              <div className="mt-6 bg-[#f0e6d2] border-2 border-[#6b5839] pixel-borders p-4 rounded-lg">
                <h3 className="text-lg font-pixel text-[#6b5839] mb-3">Character Stats</h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Heart className="text-red-500 h-4 w-4" />
                      <span className="font-pixel text-xs text-[#6b5839]">Energy:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={(e) => updateStat("energy", e)}
                        title="Click to set energy level"
                        aria-label="Energy level slider"
                        role="slider"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={stats.energy}
                      >
                        <Progress value={stats.energy} className="h-2 bg-red-200" indicatorClassName="bg-red-500" />
                      </div>
                      <span className="font-pixel text-xs text-[#6b5839]">{stats.energy}%</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Brain className="text-amber-500 h-4 w-4" />
                      <span className="font-pixel text-xs text-[#6b5839]">Learning:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={(e) => updateStat("learning", e)}
                        title="Click to set learning level"
                        aria-label="Learning level slider"
                        role="slider"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={stats.learning}
                      >
                        <Progress
                          value={stats.learning}
                          className="h-2 bg-amber-200"
                          indicatorClassName="bg-amber-500"
                        />
                      </div>
                      <span className="font-pixel text-xs text-[#6b5839]">{stats.learning}%</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Users className="text-blue-500 h-4 w-4" />
                      <span className="font-pixel text-xs text-[#6b5839]">Relationships:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={(e) => updateStat("relationships", e)}
                        title="Click to set relationships level"
                        aria-label="Relationships level slider"
                        role="slider"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={stats.relationships}
                      >
                        <Progress
                          value={stats.relationships}
                          className="h-2 bg-blue-200"
                          indicatorClassName="bg-blue-500"
                        />
                      </div>
                      <span className="font-pixel text-xs text-[#6b5839]">{stats.relationships}%</span>
                    </div>
                  </div>
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
