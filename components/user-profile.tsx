"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { LogOut, User, Mail, Calendar } from "lucide-react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase"

export default function UserProfile() {
  const { user, signOut } = useAuth()
  const [username, setUsername] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [selectedCharacterId, setSelectedCharacterId] = useState<number>(1)
  const [joinDate, setJoinDate] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const supabase = getSupabaseBrowserClient();

          // Get profile data
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("username, created_at")
            .eq("id", user.id)
            .single();

          if (profileError) {
            console.error("Error fetching profile:", profileError);
            const emailPrefix = user.email?.split("@")[0] || "user";
            setUsername(emailPrefix);
          } else if (profileData && typeof profileData.username === "string") {
            setUsername(profileData.username);
            if (typeof profileData.created_at === "string") {
              const date = new Date(profileData.created_at);
              setJoinDate(
                date.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              );
            }
          }

          // Get character selection from the new table
          const { data: charSel, error: charSelError } = await supabase
            .from("character_selection")
            .select("character_number")
            .eq("user_id", user.id)
            .single();
          setSelectedCharacterId(charSel?.character_number ?? 1); // default to 1
        } catch (err) {
          console.error("Error in profile fetch:", err);
          const emailPrefix = user.email?.split("@")[0] || "user";
          setUsername(emailPrefix);
        }
      };
      fetchProfile();
      setEmail(user.email || null);
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (!user) return null

  // Get character sprite based on selected character ID
  const getCharacterSprite = (id: number) => {
    return `/images/pixel-char${id || 1}.png`
  }

  return (
    <Card className="bg-[#ffe9b3] border-4 border-[#6b5839] pixel-borders overflow-hidden">
      <div className="absolute top-0 right-0 left-0 h-12 bg-[#f0e6d2] border-b-2 border-[#6b5839]"></div>
      <CardHeader className="p-4 pb-2 relative">
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
      <CardContent className="p-4 pt-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-20 h-20 rounded-lg bg-[#f0e6d2] border-4 border-[#6b5839] pixel-borders flex items-center justify-center overflow-hidden">
            <img
              src={getCharacterSprite(selectedCharacterId) || "/placeholder.svg"}
              alt="Character Avatar"
              className="w-full h-full pixelated object-contain cursor-pointer"
              onClick={() => router.push("/character")}
              title="Change your character"
            />
          </div>
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <User className="h-4 w-4 text-[#6b5839]" />
              <h3 className="font-pixel text-sm text-[#6b5839]">{username}</h3>
            </div>
            {email && (
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Mail className="h-4 w-4 text-[#6b5839]" />
                <p className="font-pixel text-xs text-[#6b5839] opacity-70">{email}</p>
              </div>
            )}
            {joinDate && (
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Calendar className="h-4 w-4 text-[#6b5839]" />
                <p className="font-pixel text-xs text-[#6b5839] opacity-70">Joined {joinDate}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
