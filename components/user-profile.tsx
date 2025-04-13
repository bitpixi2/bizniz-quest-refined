"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function UserProfile() {
  const { user, signOut } = useAuth()
  const [username, setUsername] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      // Fetch the user's profile to get the username
      const fetchProfile = async () => {
        try {
          const supabase = getSupabaseBrowserClient()
          const { data, error } = await supabase.from("profiles").select("username").eq("id", user.id).single()

          if (error) {
            console.error("Error fetching profile:", error)
            // Fallback to email prefix if profile fetch fails
            const emailPrefix = user.email?.split("@")[0] || "user"
            setUsername(emailPrefix)
          } else if (data) {
            setUsername(data.username)
          } else {
            // Fallback to email prefix if no profile found
            const emailPrefix = user.email?.split("@")[0] || "user"
            setUsername(emailPrefix)
          }
        } catch (err) {
          console.error("Error in profile fetch:", err)
          const emailPrefix = user.email?.split("@")[0] || "user"
          setUsername(emailPrefix)
        }
      }

      fetchProfile()

      // Set email from user object
      setEmail(user.email || null)
    }
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (!user) return null

  return (
    <Card className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-pixel text-[#6b5839]">Profile</CardTitle>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="text-[#6b5839] hover:bg-[#f0e6d2] font-pixel"
          >
            <LogOut className="h-4 w-4 mr-1" />
            <span className="text-xs">Sign Out</span>
          </Button>
        </div>
        <CardDescription className="font-pixel text-xs text-[#6b5839]">Your Bizniz Quest account</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#f0e6d2] border-2 border-[#6b5839] pixel-borders flex items-center justify-center overflow-hidden">
            <img
              src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`}
              alt="Avatar"
              className="w-10 h-10 pixelated"
            />
          </div>
          <div>
            <h3 className="font-pixel text-sm text-[#6b5839]">{username}</h3>
            {email && <p className="font-pixel text-xs text-[#6b5839] opacity-70">{email}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
