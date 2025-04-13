"use server"

import { createServerClient } from "./supabase"

// Types
interface Location {
  id: string
  name: string
  image: string
  notes: string
}

interface MapData {
  locations: Location[]
  notes: string // Keep for backward compatibility
}

// Load map data for a user
export async function loadUserMapData(userId: string) {
  const supabase = createServerClient()

  try {
    // First, check if the user_maps table exists
    const { error: tableCheckError } = await supabase.rpc("create_user_maps_table_if_not_exists")

    if (tableCheckError) {
      console.error("Error checking user_maps table:", tableCheckError)
      // Try to create the table directly
      try {
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS user_maps (
            id SERIAL PRIMARY KEY,
            profile_id UUID NOT NULL REFERENCES profiles(id),
            locations JSONB NOT NULL,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
        await supabase.rpc("exec_sql", { sql: createTableSQL })
      } catch (directError) {
        console.error("Error creating user_maps table:", directError)
      }
    }

    // Get the user's map data
    const { data, error } = await supabase
      .from("user_maps")
      .select("locations, notes")
      .eq("profile_id", userId)
      .maybeSingle()

    if (error) {
      console.error("Error loading map data:", error)
      return { error: error.message }
    }

    // If no data exists, return default map data
    if (!data) {
      return {
        mapData: {
          locations: [
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
          ],
          notes: "", // Keep for backward compatibility
        },
      }
    }

    return { mapData: data }
  } catch (error) {
    console.error("Error in loadUserMapData:", error)
    return { error: "Failed to load map data" }
  }
}

// Save map data for a user
export async function saveUserMapData(userId: string, mapData: MapData) {
  const supabase = createServerClient()

  try {
    // Check if the user already has map data
    const { data: existingData, error: checkError } = await supabase
      .from("user_maps")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing map data:", checkError)
      return { error: checkError.message }
    }

    if (existingData) {
      // Update existing map data
      const { error: updateError } = await supabase
        .from("user_maps")
        .update({
          locations: mapData.locations,
          notes: mapData.notes || "", // Keep for backward compatibility
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingData.id)

      if (updateError) {
        console.error("Error updating map data:", updateError)
        return { error: updateError.message }
      }
    } else {
      // Insert new map data
      const { error: insertError } = await supabase.from("user_maps").insert({
        profile_id: userId,
        locations: mapData.locations,
        notes: mapData.notes || "", // Keep for backward compatibility
      })

      if (insertError) {
        console.error("Error inserting map data:", insertError)
        return { error: insertError.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in saveUserMapData:", error)
    return { error: "Failed to save map data" }
  }
}
