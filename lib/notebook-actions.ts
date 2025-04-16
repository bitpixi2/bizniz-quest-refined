"use server"

import { createServerClient } from "./supabase"

// Load notebook data for a user
export async function loadUserNotebook(userId: string) {
  const supabase = createServerClient()

  try {
    // First, check if the user_notebooks table exists
    const { error: tableCheckError } = await supabase.rpc("create_user_notebooks_table_if_not_exists")

    if (tableCheckError) {
      console.error("Error checking user_notebooks table:", tableCheckError)
      // Try to create the table directly
      try {
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS user_notebooks (
            id SERIAL PRIMARY KEY,
            profile_id UUID NOT NULL REFERENCES profiles(id),
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
        await supabase.rpc("exec_sql", { sql: createTableSQL })
      } catch (directError) {
        console.error("Error creating user_notebooks table:", directError)
      }
    }

    // Get the user's notebook data
    const { data, error } = await supabase.from("user_notebooks").select("notes").eq("profile_id", userId).maybeSingle()

    if (error) {
      console.error("Error loading notebook data:", error)
      return { error: error.message }
    }

    // If no data exists, return empty notebook
    if (!data) {
      return {
        notebookData: {
          notes: "",
        },
      }
    }

    return { notebookData: data }
  } catch (error) {
    console.error("Error in loadUserNotebook:", error)
    return { error: "Failed to load notebook data" }
  }
}

// Save notebook data for a user
export async function saveUserNotebook(userId: string, notes: string) {
  const supabase = createServerClient()

  try {
    // Check if the user already has notebook data
    const { data: existingData, error: checkError } = await supabase
      .from("user_notebooks")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing notebook data:", checkError)
      return { error: checkError.message }
    }

    if (existingData) {
      // Update existing notebook data
      const { error: updateError } = await supabase
        .from("user_notebooks")
        .update({
          notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingData.id)

      if (updateError) {
        console.error("Error updating notebook data:", updateError)
        return { error: updateError.message }
      }
    } else {
      // Insert new notebook data
      const { error: insertError } = await supabase.from("user_notebooks").insert({
        profile_id: userId,
        notes: notes,
      })

      if (insertError) {
        console.error("Error inserting notebook data:", insertError)
        return { error: insertError.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in saveUserNotebook:", error)
    return { error: "Failed to save notebook data" }
  }
}
