"use server"

import { createServerClient } from "./supabase"
import { createClient } from "@supabase/supabase-js"

// Add a coworker
export async function addCoworker(userId: string, coworkerId: string) {
  const supabase = createServerClient()

  try {
    // Check if the coworker relationship already exists
    const { data: existingCoworker, error: checkError } = await supabase
      .from("coworkers")
      .select("id")
      .eq("user_id", userId)
      .eq("coworker_id", coworkerId)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing coworker:", checkError)
      return { error: checkError.message }
    }

    // If the relationship doesn't exist, create it
    if (!existingCoworker) {
      const { error: insertError } = await supabase.from("coworkers").insert({
        user_id: userId,
        coworker_id: coworkerId,
      })

      if (insertError) {
        console.error("Error adding coworker:", insertError)
        return { error: insertError.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in addCoworker:", error)
    return { error: "Failed to add coworker" }
  }
}

// Get all coworkers for a user
export async function getCoworkers(userId: string) {
  const supabase = createServerClient()

  try {
    // Query coworker relationships
    const { data: coworkerRelationships, error: relationshipsError } = await supabase
      .from("coworkers")
      .select("coworker_id")
      .eq("user_id", userId)

    if (relationshipsError) {
      console.error("Error fetching coworker relationships:", relationshipsError)
      return { error: relationshipsError.message }
    }

    // If no coworkers, return empty array
    if (!coworkerRelationships || coworkerRelationships.length === 0) {
      return { coworkers: [] }
    }

    // Get the coworker IDs
    const coworkerIds = coworkerRelationships.map((rel) => rel.coworker_id)

    // Get the profile details for each coworker
    const { data: coworkerProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, screen_sharing_enabled")
      .in("id", coworkerIds)

    if (profilesError) {
      console.error("Error fetching coworker profiles:", profilesError)
      return { error: profilesError.message }
    }

    return { coworkers: coworkerProfiles || [] }
  } catch (error) {
    console.error("Error in getCoworkers:", error)
    return { error: "Failed to get coworkers" }
  }
}

// Remove a coworker
export async function removeCoworker(userId: string, coworkerId: string) {
  const supabase = createServerClient()

  try {
    const { error } = await supabase.from("coworkers").delete().eq("user_id", userId).eq("coworker_id", coworkerId)

    if (error) {
      console.error("Error removing coworker:", error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in removeCoworker:", error)
    return { error: "Failed to remove coworker" }
  }
}

// Update screen sharing preference
export async function updateScreenSharingPreference(userId: string, enabled: boolean) {
  const supabase = createServerClient()

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ screen_sharing_enabled: enabled, updated_at: new Date().toISOString() })
      .eq("id", userId)

    if (error) {
      console.error("Error updating screen sharing preference:", error)
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in updateScreenSharingPreference:", error)
    return { error: "Failed to update screen sharing preference" }
  }
}

// Get screen sharing preference
export async function getScreenSharingPreference(userId: string) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase.from("profiles").select("screen_sharing_enabled").eq("id", userId).single()

    if (error) {
      console.error("Error getting screen sharing preference:", error)
      return { enabled: false, error: error.message }
    }

    return { enabled: data?.screen_sharing_enabled || false }
  } catch (error) {
    console.error("Error in getScreenSharingPreference:", error)
    return { enabled: false, error: "Failed to get screen sharing preference" }
  }
}

// Check if a user has screen sharing enabled
export async function checkUserScreenSharingEnabled(userId: string) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase.from("profiles").select("screen_sharing_enabled").eq("id", userId).single()

    if (error) {
      console.error("Error checking screen sharing status:", error)
      return { enabled: false }
    }

    return { enabled: data?.screen_sharing_enabled || false }
  } catch (error) {
    console.error("Error in checkUserScreenSharingEnabled:", error)
    return { enabled: false }
  }
}

// Invite a new coworker by email
export async function inviteCoworkerByEmail(email: string, inviterUserId: string) {
  try {
    // Create a Supabase admin client with the service role key
    const supabaseAdmin = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

    // Get the inviter's profile to include in the invitation
    const supabase = createServerClient()
    const { data: inviterProfile, error: profileError } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", inviterUserId)
      .single()

    if (profileError) {
      console.error("Error getting inviter profile:", profileError)
      return { error: "Could not retrieve your profile information" }
    }

    const inviterName = inviterProfile.display_name || inviterProfile.username || "A coworker"

    // Send the invitation email
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        invited_by: inviterUserId,
        inviter_name: inviterName,
      },
    })

    if (error) {
      console.error("Error inviting user:", error)
      return { error: error.message }
    }

    // Create a temporary profile for the invited user
    // Extract username from email (part before @)
    const username = email.split("@")[0]
    const displayName = username.charAt(0).toUpperCase() + username.slice(1) // Capitalize first letter

    // Check if a profile already exists for this email
    const { data: existingUser, error: userCheckError } = await supabaseAdmin.auth.admin.listUsers({
      filter: {
        email: email,
      },
    })

    if (userCheckError) {
      console.error("Error checking existing user:", userCheckError)
      // Continue anyway since the invitation was sent
    }

    // If we found a user with this email, create/update their profile
    if (existingUser && existingUser.users && existingUser.users.length > 0) {
      const userId = existingUser.users[0].id

      // Check if profile exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle()

      if (!existingProfile && !profileCheckError) {
        // Create profile if it doesn't exist
        await supabase.from("profiles").insert({
          id: userId,
          username: username,
          display_name: displayName,
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    }

    return {
      success: true,
      message: `Invitation sent to ${email}`,
    }
  } catch (error) {
    console.error("Error in inviteCoworkerByEmail:", error)
    return { error: "Failed to send invitation" }
  }
}
