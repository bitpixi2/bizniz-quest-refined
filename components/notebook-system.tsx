"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Save, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { loadUserNotebook, saveUserNotebook } from "@/lib/notebook-actions"
import { useIsMobile } from "@/hooks/use-mobile"

export default function NotebookSystem() {
  const { user } = useAuth()
  const isMobile = useIsMobile()

  // Initialize notes from localStorage or default value
  const [notes, setNotes] = useState<string>("")
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
      const { notebookData, error } = await loadUserNotebook(user.id)

      if (error) {
        console.error(`Error loading data: ${error}`)
        setSyncMessage(`Error loading data: ${error}`)
        return
      }

      if (notebookData) {
        setNotes(notebookData.notes || "")
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
      const result = await saveUserNotebook(user.id, notes)

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

  // Add auto-save for mobile when notes change
  useEffect(() => {
    // Auto-save to database when on mobile to ensure changes are persisted
    if (user && isMobile) {
      // Use a debounce to avoid too many saves
      const timer = setTimeout(() => {
        saveDataToDatabase()
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [notes, user, isMobile])

  return (
    <div className="p-6 bg-[#f8f3e3] rounded-lg max-w-5xl mx-auto border-4 border-[#6b5839] pixel-borders">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-pixel text-[#6b5839]">Bizniz Quest Notebook</h2>

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

      <div className="bg-[#f0e6d2] border-2 border-[#6b5839] text-[#6b5839] px-4 py-2 rounded mb-4 font-pixel text-sm">
        <p className="text-center">
          🔒 <strong>Private Space:</strong> Unlike Tasks, your Notebook can <em>never</em> be screenspied on by
          coworkers.
        </p>
        <p className="text-center text-xs mt-1">Perfect for personal notes, meeting times, or shopping lists!</p>
      </div>

      {syncMessage && (
        <div className="bg-[#f0e6d2] border-2 border-[#6b5839] text-[#6b5839] px-4 py-2 rounded mb-4 font-pixel text-center text-sm">
          {syncMessage}
        </div>
      )}

      <div className="bg-[#ffe9b3] p-4 rounded-lg border-4 border-[#6b5839] pixel-borders">
        <h3 className="text-xl font-pixel mb-3 text-[#6b5839] pixel-text">Notes</h3>

        <div className="space-y-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full h-64 p-4 font-pixel text-sm text-[#6b5839] bg-[#f0e6d2] border-2 border-[#6b5839] rounded-lg pixel-borders resize-none focus:outline-none"
            placeholder="Write your notes here..."
          />
        </div>
      </div>
    </div>
  )
}
