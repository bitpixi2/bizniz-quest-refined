"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Save, RefreshCw, Pencil, Check } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { loadUserMapData, saveUserMapData } from "@/lib/map-actions"
import { useIsMobile } from "@/hooks/use-mobile"

// Define location interface
interface Location {
  id: string
  name: string
  image: string
  notes: string
}

export default function MapSystem() {
  const { user } = useAuth()
  const isMobile = useIsMobile()

  // Initialize locations from localStorage or default values
  const [locations, setLocations] = useState<Location[]>([
    {
      id: "office",
      name: "Home Office",
      image: "/images/office-map.gif",
      notes: "Notes about your home office...",
    },
    {
      id: "government",
      name: "Gov Office",
      image: "/images/government-office.gif",
      notes: "Notes about government office...",
    },
    {
      id: "shed",
      name: "Home Shed",
      image: "/images/shed.gif",
      notes: "Notes about your home shed...",
    },
    {
      id: "neighborhood",
      name: "Community",
      image: "/images/nh.gif",
      notes: "Notes about community spaces...",
    },
  ])

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(locations[0])
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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

    setIsLoading(true)
    setSyncMessage("Loading data...")

    try {
      const { mapData, error } = await loadUserMapData(user.id)

      if (error) {
        console.error(`Error loading data: ${error}`)
        setSyncMessage(`Error loading data: ${error}`)
        return
      }

      if (mapData) {
        // Convert from old format if necessary
        let updatedLocations = mapData.locations

        // Check if we need to migrate from old format to new format
        if (mapData.notes && typeof mapData.notes === "string") {
          // Old format had a single notes field
          updatedLocations = mapData.locations.map((loc: any) => ({
            ...loc,
            notes: loc.notes || "",
          }))
        }

        setLocations(updatedLocations)
        setSelectedLocation(updatedLocations[0])
        setSyncMessage("Data loaded successfully!")
      }
    } catch (error) {
      console.error("Error loading data:", error)
      setSyncMessage(`Error loading data: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
      // Clear message after 3 seconds
      setTimeout(() => setSyncMessage(null), 3000)
    }
  }

  // Function to save data to the database
  const saveDataToDatabase = async () => {
    if (!user) return

    setIsSaving(true)
    setSyncMessage("Saving data...")

    try {
      const result = await saveUserMapData(user.id, {
        locations,
        notes: "", // Keep for backward compatibility
      })

      if (result.error) {
        console.error(`Error saving data: ${result.error}`)
        setSyncMessage(`Error saving data: ${result.error}`)
      } else {
        setSyncMessage("Data saved successfully!")
      }
    } catch (error) {
      console.error("Error saving data:", error)
      setSyncMessage(`Error saving data: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsSaving(false)
      // Clear message after 3 seconds
      setTimeout(() => setSyncMessage(null), 3000)
    }
  }

  const selectLocation = (location: Location) => {
    setSelectedLocation(location)
    // Cancel any ongoing editing
    setEditingLocationId(null)
  }

  const startEditing = (id: string, name: string) => {
    setEditingLocationId(id)
    setEditingName(name)
  }

  const saveLocationName = (id: string) => {
    if (!editingName.trim()) return

    setLocations(locations.map((loc) => (loc.id === id ? { ...loc, name: editingName } : loc)))

    // Update selected location if it's the one being edited
    if (selectedLocation && selectedLocation.id === id) {
      setSelectedLocation({ ...selectedLocation, name: editingName })
    }

    setEditingLocationId(null)
  }

  const updateLocationNotes = (id: string, notes: string) => {
    setLocations(locations.map((loc) => (loc.id === id ? { ...loc, notes } : loc)))

    // Update selected location if it's the one being edited
    if (selectedLocation && selectedLocation.id === id) {
      setSelectedLocation({ ...selectedLocation, notes })
    }
  }

  // Add auto-save for mobile when locations change
  useEffect(() => {
    // Auto-save to database when on mobile to ensure changes are persisted
    if (user && isMobile && locations.length > 0) {
      // Use a debounce to avoid too many saves
      const timer = setTimeout(() => {
        saveDataToDatabase()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [locations, user, isMobile])

  return (
    <div className="p-6 bg-[#f8f3e3] rounded-lg max-w-5xl mx-auto border-4 border-[#6b5839] pixel-borders">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-pixel text-[#6b5839]">Bizniz Quest Map</h2>

        {user && (
          <div className="flex gap-4">
            <Button
              onClick={loadDataFromDatabase}
              disabled={isLoading}
              className="bg-[#ffe9b3] text-[#6b5839] border-2 border-[#6b5839] hover:bg-[#f0e6d2] font-pixel pixel-borders flex items-center gap-1"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Load</span>
            </Button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Map Overview */}
        <div className="bg-[#ffe9b3] p-4 rounded-lg border-4 border-[#6b5839] pixel-borders">
          <h3 className="text-xl font-pixel mb-3 text-[#6b5839] pixel-text">Locations</h3>

          {/* Map Visualization */}
          <div className="mb-4 flex justify-center">
            <div className="border-4 border-[#6b5839] pixel-borders overflow-hidden">
              <img
                src={selectedLocation?.image || "/images/office-map.gif"}
                alt={`${selectedLocation?.name || "Office"} Map`}
                className="w-full max-w-md pixelated"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {locations.map((location) => (
              <div
                key={location.id}
                className={`p-4 rounded-lg border-2 ${
                  selectedLocation?.id === location.id
                    ? "border-[#7cb518] bg-[#d4e09b]"
                    : "border-[#6b5839] bg-[#f0e6d2]"
                } cursor-pointer pixel-borders min-h-[80px] flex flex-col justify-center`}
                onClick={() => selectLocation(location)}
              >
                <div className="flex justify-between items-center">
                  {editingLocationId === location.id ? (
                    <div className="flex items-center w-full">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="font-pixel text-base text-[#6b5839] bg-transparent border-b border-[#6b5839] w-full focus:outline-none mr-2"
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          saveLocationName(location.id)
                        }}
                        className="text-[#7cb518] hover:text-[#6b9c16]"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-pixel text-base text-[#6b5839] break-words">{location.name}</h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditing(location.id, location.name)
                        }}
                        className="text-[#6b5839] hover:text-[#7cb518] ml-2 flex-shrink-0"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location Notes */}
        <div className="bg-[#ffe9b3] p-4 rounded-lg border-4 border-[#6b5839] pixel-borders">
          <h3 className="text-xl font-pixel mb-3 text-[#6b5839] pixel-text">Location Notes</h3>

          <div className="space-y-4">
            {locations.map((location) => (
              <div
                key={`notes-${location.id}`}
                className={`p-3 rounded-lg border-2 ${
                  selectedLocation?.id === location.id
                    ? "border-[#7cb518] bg-[#d4e09b]"
                    : "border-[#6b5839] bg-[#f0e6d2]"
                } pixel-borders transition-colors`}
              >
                <h4 className="font-pixel text-sm text-[#6b5839] mb-2">{location.name} Notes:</h4>
                <textarea
                  value={location.notes}
                  onChange={(e) => updateLocationNotes(location.id, e.target.value)}
                  className={`font-pixel text-xs text-[#6b5839] ${
                    selectedLocation?.id === location.id ? "bg-[#d4e09b]" : "bg-[#f0e6d2]"
                  } w-full resize-none focus:outline-none border border-[#6b5839] p-2 rounded`}
                  rows={3}
                  placeholder={`Notes about ${location.name}...`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
