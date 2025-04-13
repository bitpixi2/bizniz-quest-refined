"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { getUserByUsername, sendEncouragement, getCoworkerTasks } from "@/lib/actions"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import {
  addCoworker,
  getCoworkers,
  removeCoworker,
  updateScreenSharingPreference,
  getScreenSharingPreference,
  inviteCoworkerByEmail,
} from "@/lib/social-actions"
import {
  MessageSquare,
  Users,
  Send,
  Coffee,
  FileText,
  Monitor,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  RefreshCw,
  UserPlus,
  UserMinus,
  Lock,
  Mail,
} from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

interface Message {
  id: number
  sender: {
    id: string
    username: string
  }
  message: string
  task_name?: string
  created_at: string
  read: boolean
}

interface Friend {
  id: string
  username: string
  screen_sharing_enabled?: boolean
}

interface SharedTask {
  id: number | string
  month_name: string
  month_year: number
  task_name: string
  completed: boolean
  urgent?: boolean
  optional?: boolean
}

// Work humor messages for encouragement suggestions
const workHumorMessages = [
  "Hang in there! Remember, the light at the end of the tunnel might be you with a flashlight looking for the exit.",
  "You're not procrastinating, you're just giving your future self a bigger challenge!",
  "I believe in you! Mostly because I'm not the one who has to do all that paperwork.",
  "You've got this! And if not, at least the coffee machine still works.",
  "Keep going! Your desk plant is rooting for you.",
  "Success is just failure that hasn't happened yet... wait, that came out wrong.",
  "You're doing amazing! The printer even jammed less when you walked by.",
  "Sending positive vibes and imaginary donuts your way!",
  "Remember: what doesn't kill you gives you something to put on your resume.",
  "You're not stuck in a rut, you're establishing a very deep groove of expertise!",
]

export default function SocialSystem() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendUsername, setFriendUsername] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [messageText, setMessageText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [randomHumorMessage, setRandomHumorMessage] = useState("")
  const [screenshareMode, setScreenshareMode] = useState(false)
  const [sharedTasks, setSharedTasks] = useState<SharedTask[]>([])
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)
  const [sharingEnabled, setSharingEnabled] = useState(false)
  const [sharingStatus, setSharingStatus] = useState<string | null>(null)
  const [isCheckingSharing, setIsCheckingSharing] = useState(false)
  const [username, setUsername] = useState<string>("")
  const [isLoadingFriends, setIsLoadingFriends] = useState(false)
  const [isAddingFriend, setIsAddingFriend] = useState(false)
  const [isRemovingFriend, setIsRemovingFriend] = useState(false)
  const [isUpdatingSharing, setIsUpdatingSharing] = useState(false)
  const [isInviting, setIsInviting] = useState(false)

  const isMobile = useIsMobile()

  // Load messages
  useEffect(() => {
    if (!user) return

    const loadMessages = async () => {
      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase
        .from("messages")
        .select(`
          id, message, read, created_at,
          sender:sender_id(id, username),
          tasks:task_id(name)
        `)
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading messages:", error)
        return
      }

      // Format the messages
      const formattedMessages = data.map((msg: any) => ({
        id: msg.id,
        sender: msg.sender,
        message: msg.message,
        task_name: msg.tasks?.name,
        created_at: msg.created_at,
        read: msg.read,
      }))

      setMessages(formattedMessages)
    }

    loadMessages()
  }, [user])

  // Load coworkers from the database
  useEffect(() => {
    if (!user) return

    // Update the loadCoworkers function to handle table creation errors gracefully
    const loadCoworkers = async () => {
      setIsLoadingFriends(true)
      try {
        const { coworkers, error } = await getCoworkers(user.id)

        if (error) {
          console.error("Error loading coworkers:", error)
          setFriends([])
          // Show a more user-friendly error message
          setError("Could not load coworkers. This might be your first time using this feature.")
          setTimeout(() => setError(null), 5000) // Clear error after 5 seconds
        } else {
          setFriends(coworkers || [])
        }
      } catch (err) {
        console.error("Error loading coworkers:", err)
        setFriends([])
        setError("An unexpected error occurred while loading coworkers.")
        setTimeout(() => setError(null), 5000) // Clear error after 5 seconds
      } finally {
        setIsLoadingFriends(false)
      }
    }

    loadCoworkers()
  }, [user])

  // Get a random humor message when the component loads
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * workHumorMessages.length)
    setRandomHumorMessage(workHumorMessages[randomIndex])
  }, [])

  // Load screen sharing preference
  useEffect(() => {
    if (!user) return

    // Set default username from user's email if available
    if (user?.email) {
      setUsername(user.email.split("@")[0])
    }

    // Also try to get profile data from the profiles table
    const fetchProfileData = async () => {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.from("profiles").select("username").eq("id", user.id).single()

      if (!error && data) {
        // Use profile username if available and not already set to bitpixi
        if (data.username && username !== "bitpixi") {
          setUsername(data.username)
        }
      }
    }

    fetchProfileData()
    loadScreenSharingPreference()
  }, [user])

  // Load screen sharing preference
  const loadScreenSharingPreference = async () => {
    if (!user) return
    setIsCheckingSharing(true)

    try {
      const { enabled } = await getScreenSharingPreference(user.id)
      setSharingEnabled(enabled)
    } catch (error) {
      console.error("Error loading screen sharing preference:", error)
    } finally {
      setIsCheckingSharing(false)
    }
  }

  // Modify the markAsRead function to check if the ID is a temporary timestamp ID
  const markAsRead = async (messageId: number) => {
    if (!user) return

    // Check if the messageId is a temporary ID (large timestamp)
    // PostgreSQL integers have a max value of 2147483647
    if (messageId > 2147483647) {
      // For temporary IDs (client-side only), just update the local state
      setMessages(messages.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg)))
      return
    }

    const supabase = getSupabaseBrowserClient()

    try {
      const { error } = await supabase.from("messages").update({ read: true }).eq("id", messageId)

      if (error) {
        console.error("Error marking message as read:", error)
        return
      }

      // Update the local state
      setMessages(messages.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg)))
    } catch (err) {
      console.error("Error in markAsRead:", err)
    }
  }

  // Add friend
  const addFriend = async () => {
    if (!user || !friendUsername.trim()) return

    setError(null)
    setSuccess(null)
    setIsAddingFriend(true)

    try {
      const friend = await getUserByUsername(friendUsername)

      if (!friend) {
        setError("User not found")
        return
      }

      if (friend.id === user.id) {
        setError("You cannot add yourself as a coworker")
        return
      }

      // Check if already a friend
      if (friends.some((f) => f.id === friend.id)) {
        setError("Already a coworker")
        return
      }

      // Add the coworker relationship to the database
      const result = await addCoworker(user.id, friend.id)

      if (result.error) {
        setError(`Failed to add coworker: ${result.error}`)
        return
      }

      // Add to the local state
      setFriends([
        ...friends,
        {
          id: friend.id,
          username: friend.username,
          screen_sharing_enabled: false, // Default to false until we know
        },
      ])

      setFriendUsername("")
      setSuccess("Coworker added successfully")
    } catch (err) {
      console.error("Error adding friend:", err)
      setError("Failed to add coworker")
    } finally {
      setIsAddingFriend(false)
    }
  }

  // Invite a new coworker by email
  const inviteCoworker = async () => {
    if (!user || !inviteEmail.trim()) return

    setError(null)
    setSuccess(null)
    setIsInviting(true)

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(inviteEmail)) {
        setError("Please enter a valid email address")
        setIsInviting(false)
        return
      }

      const result = await inviteCoworkerByEmail(inviteEmail, user.id)

      if (result.error) {
        setError(`Failed to send invitation: ${result.error}`)
      } else {
        setSuccess(result.message || "Invitation sent successfully")
        setInviteEmail("")
      }
    } catch (err) {
      console.error("Error inviting coworker:", err)
      setError("Failed to send invitation")
    } finally {
      setIsInviting(false)
    }
  }

  // Remove a coworker
  const removeFriend = async (friendId: string) => {
    if (!user) return

    setIsRemovingFriend(true)
    try {
      const result = await removeCoworker(user.id, friendId)

      if (result.error) {
        console.error("Error removing coworker:", result.error)
        return
      }

      // Remove from local state
      setFriends(friends.filter((f) => f.id !== friendId))

      // If the removed friend was selected, clear the selection
      if (selectedFriend && selectedFriend.id === friendId) {
        setSelectedFriend(null)
      }
    } catch (err) {
      console.error("Error removing coworker:", err)
    } finally {
      setIsRemovingFriend(false)
    }
  }

  // Also modify the sendMessage function to use a different approach for temporary IDs
  const sendMessage = async () => {
    if (!user || !selectedFriend || !messageText.trim()) return

    setError(null)

    try {
      const result = await sendEncouragement(user.id, selectedFriend.id, "", messageText)

      if (result.error) {
        console.error("Error sending message:", result.error)
        setError(`Failed to send message: ${result.error}`)
        return
      }

      setMessageText("")
      setSuccess("Message sent successfully")

      // Add the message to the local state (in a real app, you would reload from the database)
      // Use a negative ID for temporary client-side messages to avoid integer range issues
      const tempId = -1 * Math.floor(Math.random() * 1000000)

      const newMessage: Message = {
        id: tempId, // Use negative ID for temporary messages
        sender: {
          id: user.id,
          username: username || user.email?.split("@")[0] || "user", // Use the username state variable or default to email prefix
        },
        message: messageText,
        created_at: new Date().toISOString(),
        read: true,
      }

      setMessages([newMessage, ...messages])

      // Get a new random humor message
      const randomIndex = Math.floor(Math.random() * workHumorMessages.length)
      setRandomHumorMessage(workHumorMessages[randomIndex])
    } catch (err) {
      console.error("Error sending message:", err)
      setError("Failed to send message")
    }
  }

  // Get a random humor message for suggestion
  const getRandomHumorMessage = () => {
    const randomIndex = Math.floor(Math.random() * workHumorMessages.length)
    setRandomHumorMessage(workHumorMessages[randomIndex])
    setMessageText(workHumorMessages[randomIndex])
  }

  // Start screenshare
  const startScreenshare = async (friendUsername: string, friendId: string) => {
    if (!user) return

    setIsLoadingTasks(true)
    setScreenshareMode(true)
    setError(null)

    try {
      const result = await getCoworkerTasks(friendUsername)

      if (result.error) {
        setError(result.error)
        setSharedTasks([])
      } else {
        setSharedTasks(result.tasks || [])
      }
    } catch (err) {
      console.error("Error getting coworker tasks:", err)
      setError("Failed to access coworker's screen")
    } finally {
      setIsLoadingTasks(false)
    }
  }

  // Modify the toggleScreenSharing function to ensure it works on mobile
  const toggleScreenSharing = async () => {
    if (!user) return

    setIsUpdatingSharing(true)
    setSharingStatus(
      sharingEnabled ? "Disabling screensharing your to-do list..." : "Enabling screensharing your to-do list...",
    )

    try {
      // Update the preference in the database
      const result = await updateScreenSharingPreference(user.id, !sharingEnabled)

      if (result.error) {
        setSharingStatus(`Error: ${result.error}`)
        setTimeout(() => setSharingStatus(null), 3000)
        return
      }

      // If enabling, also create the shared tasks
      if (!sharingEnabled) {
        const sharingResult = await enableTaskSharing()
        if (sharingResult && sharingResult.error) {
          console.error("Error enabling task sharing:", sharingResult.error)
          setSharingStatus(`Error enabling sharing: ${sharingResult.error}`)
          setTimeout(() => setSharingStatus(null), 3000)
          return
        }
      } else {
        const disableResult = await disableTaskSharing()
        if (disableResult && disableResult.error) {
          console.error("Error disabling task sharing:", disableResult.error)
        }
      }

      // Update the local state
      setSharingEnabled(!sharingEnabled)
      setSharingStatus(sharingEnabled ? "Screensharing is disabled!" : "Screensharing is enabled!")

      // Clear status after 3 seconds
      setTimeout(() => {
        setSharingStatus(null)
      }, 3000)
    } catch (err) {
      console.error("Error toggling screen sharing:", err)
      setSharingStatus("Failed to update screen sharing preference")
      setTimeout(() => setSharingStatus(null), 3000)
    } finally {
      setIsUpdatingSharing(false)
    }
  }

  // Enable task sharing
  const enableTaskSharing = async () => {
    if (!user) return

    try {
      // First, directly create tasks_shared entries using Supabase client
      const supabase = getSupabaseBrowserClient()

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle()

      if (profileError) {
        console.error("Error checking profile:", profileError)
        return { error: profileError.message }
      }

      // Create profile if it doesn't exist
      if (!profile) {
        const { error: insertProfileError } = await supabase.from("profiles").insert({
          id: user.id,
          username: user.email?.split("@")[0] || "user",
          display_name: user.email?.split("@")[0] || "User",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (insertProfileError) {
          console.error("Error creating profile:", insertProfileError)
          return { error: insertProfileError.message }
        }
      }

      // Get the user's tasks from months
      const { data: monthTasks, error: monthTasksError } = await supabase
        .from("months")
        .select(`
        id, name, year,
        tasks(id, name, completed, optional, urgent, position)
      `)
        .eq("profile_id", user.id)
        .order("year", { ascending: true })
        .order("name", { ascending: true })

      if (monthTasksError) {
        console.error("Error fetching tasks:", monthTasksError)
        return { error: monthTasksError.message }
      }

      // Delete existing shared tasks for this user
      const { error: deleteError } = await supabase.from("tasks_shared").delete().eq("profile_id", user.id)

      if (deleteError) {
        console.error("Error deleting existing shared tasks:", deleteError)
        return { error: deleteError.message }
      }

      // Insert tasks into tasks_shared
      const tasksToShare = []
      monthTasks?.forEach((month) => {
        month.tasks.forEach((task) => {
          tasksToShare.push({
            profile_id: user.id,
            month_name: month.name,
            month_year: month.year,
            task_name: task.name,
            completed: task.completed,
            urgent: task.urgent || false,
            optional: task.optional || false,
          })
        })
      })

      if (tasksToShare.length > 0) {
        // Insert in smaller batches to avoid potential payload size issues
        const batchSize = 50
        for (let i = 0; i < tasksToShare.length; i += batchSize) {
          const batch = tasksToShare.slice(i, i + batchSize)
          const { error: insertError } = await supabase.from("tasks_shared").insert(batch)

          if (insertError) {
            console.error("Error sharing tasks batch:", insertError)
            return { error: insertError.message }
          }
        }
      }

      return { success: true }
    } catch (err) {
      console.error("Error enabling task sharing:", err)
      return { error: "Failed to enable task sharing" }
    }
  }

  const disableTaskSharing = async () => {
    if (!user) return

    try {
      const supabase = getSupabaseBrowserClient()

      // Delete existing shared tasks for this user
      const { error: deleteError } = await supabase.from("tasks_shared").delete().eq("profile_id", user.id)

      if (deleteError) {
        console.error("Error deleting shared tasks:", deleteError)
        return { error: deleteError.message }
      }

      return { success: true }
    } catch (err) {
      console.error("Error disabling task sharing:", err)
      return { error: "Failed to disable task sharing" }
    }
  }

  // Function to manually refresh sharing status
  const refreshSharingStatus = () => {
    loadScreenSharingPreference()
  }

  return (
    <div className="p-6 bg-[#f8f3e3] rounded-lg max-w-5xl mx-auto border-4 border-[#6b5839] pixel-borders">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-pixel text-[#6b5839] pixel-text">BIZNIZ QUEST</h2>

        {/* User profile in top right */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-pixel text-sm text-[#6b5839]">{username}</p>
              <p className="font-pixel text-xs text-[#6b5839] opacity-70">Office Hero</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#f0e6d2] border-2 border-[#6b5839] pixel-borders flex items-center justify-center overflow-hidden">
              <img
                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`}
                alt="Avatar"
                className="w-8 h-8 pixelated"
              />
            </div>
          </div>
        )}
      </div>

      {/* Task Sharing Toggle */}
      <div className="bg-[#f0e6d2] border-2 border-[#6b5839] px-4 py-3 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start">
            <Eye className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-[#6b5839]" />
            <div>
              <p className="font-pixel text-sm text-[#6b5839]">Let coworkers spy on your to-do list?</p>
              <p className="font-pixel text-xs text-[#6b5839] opacity-70 mt-1">
                {sharingEnabled ? "Yes! I need some public accountability." : "No way, José! These tasks are private."}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={toggleScreenSharing}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#6b5839] focus:ring-offset-2 ${sharingEnabled ? "bg-[#7cb518]" : "bg-[#d0c8b0]"}`}
              disabled={isCheckingSharing || isUpdatingSharing}
            >
              <span
                className={`${
                  sharingEnabled ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
            {(isCheckingSharing || isUpdatingSharing) && (
              <RefreshCw className="h-3 w-3 ml-2 animate-spin text-[#6b5839]" />
            )}
          </div>
        </div>
        {sharingStatus && <p className="font-pixel text-xs text-[#6b5839] mt-2 text-left">{sharingStatus}</p>}
      </div>

      {/* Screenshare Mode */}
      {screenshareMode && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-pixel text-[#6b5839]">
              <Monitor className="inline-block h-5 w-5 mr-2" />
              Spying on {selectedFriend?.username}'s Computer
            </h3>
            <Button
              onClick={() => setScreenshareMode(false)}
              variant="outline"
              size="sm"
              className="font-pixel text-xs border-[#6b5839] text-[#6b5839]"
            >
              Stop Spying
            </Button>
          </div>

          {/* Old computer monitor style container */}
          <div className="bg-[#333333] p-4 rounded-lg border-8 border-[#222222] shadow-lg">
            {/* Monitor screen with scanlines effect */}
            <div
              className="bg-[#0a2a12] rounded-md p-4 relative overflow-hidden"
              style={{
                boxShadow: "inset 0 0 10px rgba(0, 50, 0, 0.5)",
              }}
            >
              {/* Scanlines overlay */}
              <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                  background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)",
                  backgroundSize: "100% 4px",
                }}
              ></div>

              {/* Screen content with scrollable area */}
              <div
                className="relative z-0 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#0f5d1a #0a2a12",
                }}
              >
                {isLoadingTasks ? (
                  <div className="text-center py-8">
                    <p className="font-pixel text-sm text-[#00ff41]">LOADING DATA...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <XCircle className="h-8 w-8 text-[#ff5555] mx-auto mb-2" />
                    <p className="font-pixel text-sm text-[#00ff41]">ERROR: {error}</p>
                    <p className="font-pixel text-xs text-[#00ff41] mt-2">
                      ACCESS DENIED. USER MAY NOT HAVE SHARING ENABLED.
                    </p>
                  </div>
                ) : sharedTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 text-[#00ff41] opacity-50 mx-auto mb-2" />
                    <p className="font-pixel text-sm text-[#00ff41]">NO TASKS FOUND</p>
                    <p className="font-pixel text-xs text-[#00ff41] mt-1">DIRECTORY EMPTY</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center mb-4">
                      <Calendar className="h-5 w-5 text-[#00ff41] mr-2" />
                      <h4 className="font-pixel text-lg text-[#00ff41]">{selectedFriend?.username}'s TASKS</h4>
                    </div>

                    {/* Group tasks by month */}
                    {Array.from(new Set(sharedTasks.map((task) => `${task.month_name} ${task.month_year}`))).map(
                      (monthKey) => (
                        <div key={monthKey} className="mb-6">
                          <h5 className="font-pixel text-sm text-[#00ff41] mb-3 bg-[#0f5d1a] p-2 rounded">
                            {monthKey.toUpperCase()}
                          </h5>
                          <div className="space-y-4">
                            {sharedTasks
                              .filter((task) => `${task.month_name} ${task.month_year}` === monthKey)
                              .map((task, index) => (
                                <div
                                  key={`${task.id}-${index}`}
                                  className={`p-3 rounded-lg border-2 ${
                                    task.completed
                                      ? "bg-[#0f3d1a] border-[#00ff41]"
                                      : task.urgent
                                        ? "bg-[#3d1a0f] border-[#ff4100]"
                                        : "bg-[#0f5d1a] border-[#00aa41]"
                                  }`}
                                >
                                  <div className="flex items-start">
                                    <div className="mr-2 mt-1">
                                      {task.completed ? (
                                        <CheckCircle2 className="h-4 w-4 text-[#00ff41]" />
                                      ) : task.urgent ? (
                                        <AlertTriangle className="h-4 w-4 text-[#ff4100]" />
                                      ) : (
                                        <div className="w-4 h-4 border-2 border-[#00ff41] rounded-sm"></div>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                        <p
                                          className={`font-pixel text-xs ${
                                            task.completed
                                              ? "text-[#00ff41] line-through"
                                              : task.urgent
                                                ? "text-[#ff4100]"
                                                : "text-[#00ff41]"
                                          }`}
                                        >
                                          {task.task_name}
                                        </p>
                                        <div className="flex gap-2 ml-2">
                                          {task.urgent && !task.completed && (
                                            <span className="inline-block px-2 py-0.5 bg-[#3d1a0f] text-[#ff4100] font-pixel text-[10px] rounded border border-[#ff4100]">
                                              URGENT
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="mt-2">
                                        {task.optional && (
                                          <span className="inline-block px-2 py-0.5 bg-[#0f3d1a] text-[#00ff41] font-pixel text-[10px] rounded border border-[#00ff41]">
                                            OPTIONAL
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Monitor base/stand */}
          <div className="h-4 bg-[#222222] mx-auto mt-2 w-1/3 rounded-b-lg"></div>
        </div>
      )}

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#d0c8b0] rounded-lg border-2 border-[#6b5839] pixel-borders mb-6">
          <TabsTrigger
            value="friends"
            className="font-pixel text-xs data-[state=active]:bg-[#ffe9b3] data-[state=active]:text-[#6b5839] flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Coworkers
          </TabsTrigger>
          <TabsTrigger
            value="messages"
            className="font-pixel text-xs data-[state=active]:bg-[#ffe9b3] data-[state=active]:text-[#6b5839] flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Friends List */}
            <div className="md:col-span-1">
              <Card className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders h-full">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xl font-pixel text-[#6b5839]">Coworkers</CardTitle>
                  <CardDescription className="font-pixel text-xs text-[#6b5839]">
                    People you pretend to like
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {isLoadingFriends ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6b5839] mx-auto"></div>
                      <p className="font-pixel text-sm text-[#6b5839] mt-4">Loading coworkers...</p>
                    </div>
                  ) : friends.length > 0 ? (
                    <div className="space-y-3">
                      {friends.map((friend) => (
                        <div
                          key={friend.id}
                          className="p-3 rounded-lg border-2 border-[#6b5839] bg-[#f0e6d2] pixel-borders"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-pixel text-sm text-[#6b5839]">{friend.username}</h4>
                            </div>
                            <button
                              onClick={() => removeFriend(friend.id)}
                              className="text-[#6b5839] hover:text-red-500 transition-colors"
                              disabled={isRemovingFriend}
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="mt-3 flex gap-2">
                            {friend.screen_sharing_enabled ? (
                              <Button
                                onClick={() => startScreenshare(friend.username, friend.id)}
                                size="sm"
                                className="bg-[#7cb518] text-white border-2 border-[#6b5839] hover:bg-[#6b9c16] font-pixel text-xs flex-1 flex items-center justify-center"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Screenspy
                              </Button>
                            ) : (
                              <Button
                                disabled
                                size="sm"
                                className="bg-[#d0c8b0] text-[#6b5839] border-2 border-[#6b5839] font-pixel text-xs flex-1 flex items-center justify-center opacity-70"
                              >
                                <Lock className="h-3 w-3 mr-1" />
                                <span className="leading-tight">
                                  Not currently
                                  <br />
                                  screensharing
                                </span>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 text-[#6b5839] opacity-50 mx-auto mb-2" />
                      <p className="font-pixel text-sm text-[#6b5839]">No coworkers yet</p>
                      <p className="font-pixel text-xs text-[#6b5839] mt-1">
                        Just like your last company holiday party
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Add Friend */}
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 gap-6">
                {/* Invite new user - now first */}
                <Card className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xl font-pixel text-[#6b5839]">Invite Coworker</CardTitle>
                    <CardDescription className="font-pixel text-xs text-[#6b5839]">
                      Send an invitation email to a new coworker
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="email" className="font-pixel text-sm text-[#6b5839] block mb-2">
                          Coworker&apos;s Email
                        </label>
                        <div className="flex gap-2">
                          <Input
                            id="email"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="Enter email address"
                            className="flex-1 p-3 rounded bg-[#f0e6d2] border-2 border-[#6b5839] font-pixel text-sm text-[#6b5839] pixel-borders focus:outline-none"
                          />
                          <Button
                            onClick={inviteCoworker}
                            disabled={!inviteEmail.trim() || isInviting}
                            className="bg-[#7cb518] text-white border-2 border-[#6b5839] hover:bg-[#6b9c16] font-pixel pixel-borders flex items-center gap-1"
                          >
                            {isInviting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                            Invite
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Add existing user - now second */}
                <Card className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xl font-pixel text-[#6b5839]">Add Coworker</CardTitle>
                    <CardDescription className="font-pixel text-xs text-[#6b5839]">
                      Add an existing user as your coworker
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
                    {error && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 font-pixel text-xs">
                        {error}
                      </div>
                    )}
                    {success && (
                      <div className="bg-[#d4e09b] border border-[#7cb518] text-[#7cb518] px-4 py-2 rounded mb-4 font-pixel text-xs">
                        {success}
                      </div>
                    )}

                    <div className="space-y-6">
                      <div>
                        <label htmlFor="username" className="font-pixel text-sm text-[#6b5839] block mb-2">
                          Coworker&apos;s Username
                        </label>
                        <div className="flex gap-2">
                          <Input
                            id="username"
                            value={friendUsername}
                            onChange={(e) => setFriendUsername(e.target.value)}
                            placeholder="Enter username"
                            className="flex-1 p-3 rounded bg-[#f0e6d2] border-2 border-[#6b5839] font-pixel text-sm text-[#6b5839] pixel-borders focus:outline-none"
                          />
                          <Button
                            onClick={addFriend}
                            disabled={!friendUsername.trim() || isAddingFriend}
                            className="bg-[#7cb518] text-white border-2 border-[#6b5839] hover:bg-[#6b9c16] font-pixel pixel-borders flex items-center gap-1"
                          >
                            {isAddingFriend ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <UserPlus className="h-4 w-4" />
                            )}
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Messages List */}
            <div className="md:col-span-1">
              <Card className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders h-full">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xl font-pixel text-[#6b5839]">Messages</CardTitle>
                  <CardDescription className="font-pixel text-xs text-[#6b5839]">
                    Encouragements from coworkers
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {messages.length > 0 ? (
                    <div className="space-y-3">
                      {messages
                        .filter((message) => message.sender.id !== user?.id)
                        .map((message) => (
                          <div
                            key={message.id}
                            className={`p-3 rounded-lg border-2 ${
                              message.read ? "bg-[#f0e6d2]" : "bg-[#d4e09b]"
                            } border-[#6b5839] pixel-borders cursor-pointer`}
                            onClick={() => markAsRead(message.id)}
                          >
                            <div className="flex flex-col mb-1">
                              <h4 className="font-pixel text-sm text-[#6b5839]">{message.sender.username}</h4>
                              <span className="font-pixel text-xs text-[#6b5839] opacity-70">
                                {new Date(message.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="font-pixel text-xs text-[#6b5839] mb-1 line-clamp-2">{message.message}</p>
                            {message.task_name && (
                              <p className="font-pixel text-xs text-[#7cb518]">Task: {message.task_name}</p>
                            )}
                            {!message.read && (
                              <div className="mt-1 text-right">
                                <span className="inline-block px-2 py-1 bg-[#7cb518] text-white font-pixel text-xs rounded">
                                  New
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-8 w-8 text-[#6b5839] opacity-50 mx-auto mb-2" />
                      <p className="font-pixel text-sm text-[#6b5839]">No messages yet</p>
                      <p className="font-pixel text-xs text-[#6b5839] mt-1">
                        Your inbox is as empty as the coffee pot on Monday morning
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Message Composer */}
            <div className="md:col-span-2">
              <Card className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders h-full">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xl font-pixel text-[#6b5839]">Send Message</CardTitle>
                  <CardDescription className="font-pixel text-xs text-[#6b5839]">
                    Send some workplace wisdom their way
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 font-pixel text-xs">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="bg-[#d4e09b] border border-[#7cb518] text-[#7cb518] px-4 py-2 rounded mb-4 font-pixel text-xs">
                      {success}
                    </div>
                  )}

                  <div>
                    <label htmlFor="friend" className="font-pixel text-sm text-[#6b5839] block mb-2">
                      Select Coworker
                    </label>
                    {friends.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {friends.map((friend) => (
                          <div
                            key={friend.id}
                            className={`p-2 rounded-lg border-2 ${
                              selectedFriend?.id === friend.id
                                ? "border-[#7cb518] bg-[#d4e09b]"
                                : "border-[#6b5839] bg-[#f0e6d2]"
                            } cursor-pointer pixel-borders`}
                            onClick={() => setSelectedFriend(friend)}
                          >
                            <h4 className="font-pixel text-sm text-[#6b5839]">{friend.username}</h4>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg border-2 border-[#6b5839] bg-[#f0e6d2] pixel-borders">
                        <p className="font-pixel text-sm text-[#6b5839] text-center">
                          You have no coworkers yet, you lone wolf, you!
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <label htmlFor="message" className="font-pixel text-sm text-[#6b5839]">
                        Message
                      </label>
                      <Button
                        onClick={getRandomHumorMessage}
                        size="sm"
                        variant="outline"
                        className="text-[#6b5839] border-2 border-[#6b5839] hover:bg-[#f0e6d2] font-pixel text-xs pixel-borders flex items-center gap-1 h-6 px-2"
                      >
                        <Coffee className="h-3 w-3 mr-1" /> Inspo
                      </Button>
                    </div>
                    <textarea
                      id="message"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={randomHumorMessage || "Write an encouraging message..."}
                      className="w-full p-3 rounded bg-[#f0e6d2] border-2 border-[#6b5839] font-pixel text-sm text-[#6b5839] pixel-borders focus:outline-none min-h-[100px]"
                    />
                  </div>

                  <Button
                    onClick={sendMessage}
                    disabled={!selectedFriend || !messageText.trim()}
                    className="bg-[#7cb518] text-white border-2 border-[#6b5839] hover:bg-[#6b9c16] font-pixel pixel-borders flex items-center gap-2 mt-6"
                  >
                    <Send className="h-4 w-4" />
                    Encourage
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
