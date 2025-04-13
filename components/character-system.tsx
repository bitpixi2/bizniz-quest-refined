"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Brain, Heart, Users, Zap, Code, Briefcase, BookOpen, Network, Cpu, Save } from "lucide-react"
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

export default function CharacterSystem() {
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
        wandImage:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/rpg_icons80-Yd9Nt9Yd9Nt9Yd9Nt9Yd9Nt9Yd9Nt9Yd9Nt9.png",
        category: "tech",
        icon: <Code className="h-5 w-5 text-blue-500" />,
      },
      {
        id: "business-admin",
        name: "Business Admin",
        level: 2,
        maxLevel: 5,
        description: "Knowledge of business registration and administration",
        wandImage:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/rpg_icons83-Yd9Nt9Yd9Nt9Yd9Nt9Yd9Nt9Yd9Nt9Yd9Nt9.png",
        category: "business",
        icon: <Briefcase className="h-5 w-5 text-amber-500" />,
      },
      {
        id: "creative-writing",
        name: "Creative Writing",
        level: 1,
        maxLevel: 5,
        description: "Ability to write engaging content and stories",
        wandImage:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/rpg_icons76-Yd9Nt9Yd9Nt9Yd9Nt9Yd9Nt9Yd9Nt9Yd9Nt9.png",
        category: "creative",
        icon: <BookOpen className="h-5 w-5 text-red-500" />,
      },
      {
        id: "networking",
        name: "Networking",
        level: 0,
        maxLevel: 5,
        description: "Ability to connect with others and build relationships",
        wandImage:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/rpg_icons71-Yd9Nt9Yd9Nt9Yd9Nt9Yd9Nt9Yd9Nt9Yd9Nt9.png",
        category: "social",
        icon: <Network className="h-5 w-5 text-green-500" />,
      },
      {
        id: "ai-knowledge",
        name: "AI Knowledge",
        level: 0,
        maxLevel: 5,
        description: "Understanding of artificial intelligence and its applications",
        wandImage:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/rpg_icons87-Yd9Nt9Yd9Nt9Yd9Nt9Yd9Nt9Yd9Nt9Yd9Nt9.png",
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
    } catch (error) {
      console.error("Error loading data:", error)
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

  return (
    <div className="p-4 bg-[#f8f3e3] rounded-lg max-w-5xl mx-auto border-4 border-[#6b5839] pixel-borders">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-pixel text-[#6b5839]">Character Stats</h2>

        {user && (
          <div className="flex gap-2">
            {/* Removed the Load button */}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Character Display */}
        <div className="md:col-span-1">
          <Card className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders h-full">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-xl font-pixel text-[#6b5839]">Character</CardTitle>
              <CardDescription className="font-pixel text-xs text-[#6b5839]">
                US Entrepreneur in Australia
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {/* Character Sprite */}
              <div className="relative w-full h-48 bg-[#f0e6d2] border-2 border-[#6b5839] pixel-borders mb-4 overflow-hidden flex flex-col justify-center items-center">
                <div className="flex-1 flex items-center justify-center">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/character-hDXtHgsVJ7MDS3R8xXMZFc62QCGoFD.png"
                    alt="Character"
                    className="h-32 pixelated"
                  />
                </div>
                <div className="w-full py-2 text-center">
                  <a
                    href="https://captainskolot.itch.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-pixel text-[10px] text-[#6b5839] hover:underline"
                  >
                    art by Captainskolot
                  </a>
                </div>
              </div>

              {/* Character Stats */}
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
                      <Progress value={stats.learning} className="h-2 bg-amber-200" indicatorClassName="bg-amber-500" />
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
