"use server"

import { createServerClient } from "./supabase"

// Types



type LocationData = {
  id: string
  name: string
  description: string
  extendedDescription: string
  unlocked: boolean
  visited: boolean
  image: string
  tasks: string[]
}

type CharacterStats = {
  energy: number
  learning: number
  relationships: number
}

type Skill = {
  id: string
  name: string
  level: number
  maxLevel: number
  description: string
  category: string
}

// Save todo lists data to database (canonical To Do system)
export async function saveTodoLists(userId: string, todoLists: any[]) {
  const supabase = createServerClient();

  // Ensure user profile exists (keep this logic)
  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Error checking profile:", profileError);
    return { error: profileError.message };
  }

  if (!existingProfile) {
    // Get user details from auth
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError) {
      console.error("Error fetching user:", userError);
      return { error: "User not found: " + userError.message };
    }
    // Create a profile for the user
    const { error: insertProfileError } = await supabase.from("profiles").insert({
      id: userId,
      username: userData.user.email?.split("@")[0] || "user",
      display_name: userData.user.email?.split("@")[0] || "User",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (insertProfileError) {
      console.error("Error creating profile:", insertProfileError);
      return { error: "Failed to create profile: " + insertProfileError.message };
    }
  }

  // Save or update todo lists in todo_lists table
  const { error: upsertError } = await supabase
    .from("todo_lists")
    .upsert({ user_id: userId, lists: todoLists }, { onConflict: "user_id" });

  if (upsertError) {
    console.error("Error saving todo lists:", upsertError);
    return { error: upsertError.message };
  }

  return { success: true };
}

// Save locations data to database
export async function saveLocations(userId: string, locations: LocationData[]) {
  const supabase = createServerClient()

  // First, get all existing locations for this user
  const { data: existingLocations, error: fetchError } = await supabase
    .from("locations")
    .select("id, location_key")
    .eq("profile_id", userId)

  if (fetchError) {
    console.error("Error fetching locations:", fetchError)
    return { error: fetchError.message }
  }

  // Process each location
  for (const location of locations) {
    // Check if location exists
    const existingLocation = existingLocations?.find((l) => l.location_key === location.id)

    if (existingLocation) {
      // Update existing location
      const { error: updateError } = await supabase
        .from("locations")
        .update({
          name: location.name,
          description: location.description,
          extended_description: location.extendedDescription,
          unlocked: location.unlocked,
          visited: location.visited,
          image: location.image,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingLocation.id)

      if (updateError) {
        console.error("Error updating location:", updateError)
        return { error: updateError.message }
      }

      // Handle tasks for this location
      await handleLocationTasks(supabase, existingLocation.id, location.tasks)
    } else {
      // Insert new location
      const { data: newLocation, error: insertError } = await supabase
        .from("locations")
        .insert({
          profile_id: userId,
          location_key: location.id,
          name: location.name,
          description: location.description,
          extended_description: location.extendedDescription,
          unlocked: location.unlocked,
          visited: location.visited,
          image: location.image,
        })
        .select("id")
        .single()

      if (insertError) {
        console.error("Error inserting location:", insertError)
        return { error: insertError.message }
      }

      // Handle tasks for this location
      if (newLocation) {
        await handleLocationTasks(supabase, newLocation.id, location.tasks)
      }
    }
  }

  return { success: true }
}

// Helper function to handle location tasks
async function handleLocationTasks(supabase: any, locationId: number, tasks: string[]) {
  // First, get all existing tasks for this location
  const { data: existingTasks, error: fetchError } = await supabase
    .from("location_tasks")
    .select("id, name")
    .eq("location_id", locationId)

  if (fetchError) {
    console.error("Error fetching location tasks:", fetchError)
    return { error: fetchError.message }
  }

  // Process each task
  for (let i = 0; i < tasks.length; i++) {
    const taskName = tasks[i]
    // Check if task exists
    const existingTask = existingTasks?.find((t: any) => t.name === taskName)

    if (existingTask) {
      // Update existing task position
      const { error: updateError } = await supabase
        .from("location_tasks")
        .update({
          position: i,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingTask.id)

      if (updateError) {
        console.error("Error updating location task:", updateError)
      }
    } else {
      // Insert new task
      const { error: insertError } = await supabase.from("location_tasks").insert({
        location_id: locationId,
        name: taskName,
        position: i,
      })

      if (insertError) {
        console.error("Error inserting location task:", insertError)
      }
    }
  }

  // Delete tasks that no longer exist
  const tasksToDelete = existingTasks?.filter((t: any) => !tasks.includes(t.name))

  if (tasksToDelete && tasksToDelete.length > 0) {
    const taskIds = tasksToDelete.map((t) => t.id)
    const { error: deleteError } = await supabase.from("location_tasks").delete().in("id", taskIds)

    if (deleteError) {
      console.error("Error deleting location tasks:", deleteError)
    }
  }
}

// Save character stats to database
export async function saveCharacterStats(userId: string, stats: CharacterStats) {
  const supabase = createServerClient()

  try {
    // Check if stats exist for this user
    const { data: existingStats, error: fetchError } = await supabase
      .from("character_stats")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle()

  if (fetchError) {
    console.error("Error fetching character stats:", fetchError)
    return { error: fetchError.message }
  }

  if (existingStats) {
    // Update existing stats
    const { error: updateError } = await supabase
      .from("character_stats")
      .update({
        energy: stats.energy,
        learning: stats.learning,
        relationships: stats.relationships,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingStats.id)

    if (updateError) {
      console.error("Error updating character stats:", updateError)
      return { error: updateError.message }
    }
  } else {
    // Insert new stats
    const { error: insertError } = await supabase.from("character_stats").insert({
      profile_id: userId,
      energy: stats.energy,
      learning: stats.learning,
      relationships: stats.relationships,
    })

    if (insertError) {
      console.error("Error inserting character stats:", insertError)
      return { error: insertError.message }
    }
  }

  // Remove revalidatePath call
  return { success: true }
  } catch (err) {
    console.error("Unexpected error in saveCharacterStats:", err);
    return { error: "An unexpected error occurred", details: err };
  }
}

// Save skills to database
export async function saveSkills(userId: string, skills: Skill[]) {
  const supabase = createServerClient()

  // First, get all existing skills for this user
  const { data: existingSkills, error: fetchError } = await supabase
    .from("skills")
    .select("id, skill_key")
    .eq("profile_id", userId)

  if (fetchError) {
    console.error("Error fetching skills:", fetchError)
    return { error: fetchError.message }
  }

  // Process each skill
  for (const skill of skills) {
    // Check if skill exists
    const existingSkill = existingSkills?.find((s) => s.skill_key === skill.id)

    if (existingSkill) {
      // Update existing skill
      const { error: updateError } = await supabase
        .from("skills")
        .update({
          name: skill.name,
          level: skill.level,
          max_level: skill.maxLevel,
          description: skill.description,
          category: skill.category,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSkill.id)

      if (updateError) {
        console.error("Error updating skill:", updateError)
        return { error: updateError.message }
      }
    } else {
      // Insert new skill
      const { error: insertError } = await supabase.from("skills").insert({
        profile_id: userId,
        skill_key: skill.id,
        name: skill.name,
        level: skill.level,
        max_level: skill.maxLevel,
        description: skill.description,
        category: skill.category,
      })

      if (insertError) {
        console.error("Error inserting skill:", insertError)
        return { error: insertError.message }
      }
    }
  }

  // Remove revalidatePath call
  return { success: true }
}

// Update the loadUserData function to handle JWT expiration more gracefully
// Find the loadUserData function and modify it to include better error handling

// Save documents to database
export async function saveDocuments(userId: string, documents: any[]) {
  const supabase = createServerClient()

  try {
    // First, get all existing documents for this user
    const { data: existingDocuments, error: fetchError } = await supabase
      .from("documents")
      .select("id, document_key")
      .eq("profile_id", userId)

    if (fetchError) {
      console.error("Error fetching documents:", fetchError)
      return { error: fetchError.message }
    }

    // Process each document
    for (const document of documents) {
      // Check if document exists
      const existingDocument = existingDocuments?.find((d) => d.document_key === document.id)

      if (existingDocument) {
        // Update existing document
        const { error: updateError } = await supabase
          .from("documents")
          .update({
            name: document.name,
            description: document.description,
            type: document.type,
            quantity: document.quantity,
            completed: document.completed,
            related_task: document.related_task,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingDocument.id)

        if (updateError) {
          console.error("Error updating document:", updateError)
          return { error: updateError.message }
        }
      } else {
        // Insert new document
        const { error: insertError } = await supabase.from("documents").insert({
          profile_id: userId,
          document_key: document.id,
          name: document.name,
          description: document.description,
          type: document.type,
          quantity: document.quantity,
          completed: document.completed,
          related_task: document.related_task,
        })

        if (insertError) {
          console.error("Error inserting document:", insertError)
          return { error: insertError.message }
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Unexpected error in saveDocuments:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Load documents from database
export async function loadDocuments(userId: string) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase.from("documents").select("*").eq("profile_id", userId)

    if (error) {
      console.error("Error loading documents:", error)
      return { error: error.message }
    }

    return { documents: data }
  } catch (error) {
    console.error("Unexpected error in loadDocuments:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Add this new function to save character data including life balance plan
export async function saveCharacterData(userId: string, data: any) {
  const supabase = createServerClient()

  try {
    // First, check if a profile exists for this user
    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle()

    if (profileError) {
      console.error("Error checking profile:", profileError)
      return { error: profileError.message }
    }

    // If no profile exists, create one
    if (!existingProfile) {
      // Get user details from auth
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)

      if (userError) {
        console.error("Error fetching user:", userError)
        return { error: "User not found: " + userError.message }
      }

      // Create a profile for the user
      const { error: insertProfileError } = await supabase.from("profiles").insert({
        id: userId,
        username: userData.user.email?.split("@")[0] || "user",
        display_name: userData.user.email?.split("@")[0] || "User",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertProfileError) {
        console.error("Error creating profile:", insertProfileError)
        return { error: "Failed to create profile: " + insertProfileError.message }
      }
    }

    // Check if life balance data exists for this user
    const { data: existingLifeBalance, error: lifeBalanceError } = await supabase
      .from("life_balance")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle()

    if (lifeBalanceError && !lifeBalanceError.message.includes("No rows found")) {
      console.error("Error checking life balance data:", lifeBalanceError)
      return { error: lifeBalanceError.message }
    }

    if (existingLifeBalance) {
      // Update existing life balance data
      const { error: updateError } = await supabase
        .from("life_balance")
        .update({
          categories: data.lifeBalanceCategories || [],
          notes: data.lifeBalanceNotes || "",
          selected_character_id: data.selectedCharacterId || 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingLifeBalance.id)

      if (updateError) {
        console.error("Error updating life balance data:", updateError)
        return { error: updateError.message }
      }
    } else {
      // Insert new life balance data
      const { error: insertError } = await supabase.from("life_balance").insert({
        profile_id: userId,
        categories: data.lifeBalanceCategories || [],
        notes: data.lifeBalanceNotes || "",
        selected_character_id: data.selectedCharacterId || 1,
      })

      if (insertError) {
        console.error("Error inserting life balance data:", insertError)
        return { error: insertError.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in saveCharacterData:", error)
    return { error: "An unexpected error occurred" }
  }
}

// Update the loadUserData function to include life balance data
export async function loadUserData(userId: string) {
  const supabase = createServerClient()

  console.log("Loading user data for ID:", userId)

  if (!userId) {
    console.error("No user ID provided to loadUserData")
    return { error: "No user ID provided" }
  }

  try {
    let formattedLocations: any[] = []
    // Load todo lists and tasks
    const { data: todoData, error: todoError } = await supabase
      .from("todo_lists")
      .select(`
        id, name, year, unlocked, completed,
        tasks(id, name, completed, urgent, position)
      `)
      .eq("profile_id", userId)
      .order("year", { ascending: true })
      .order("name", { ascending: true })

    if (todoError) {
      console.error("Error loading todo lists:", todoError)

      // Only treat as auth error if it's explicitly a JWT expired error
      // Not just any JWT-related message
      if (todoError.message && todoError.message.includes("JWT expired")) {
        return {
          error: "Authentication expired. Please refresh the page or log in again.",
          isAuthError: true,
        }
      }

      // For other JWT errors, just log and continue
      if (todoError.message && todoError.message.includes("JWT")) {
        console.warn("JWT issue detected but continuing:", todoError.message)
      } else {
        return { error: todoError.message }
      }
    }

    console.log(`Loaded todo lists for user ${userId}`)

    // Load locations and tasks - with better error handling
    try {
      const { data: locations, error: locationsError } = await supabase
        .from("locations")
        .select(`
          id, location_key, name, description, extended_description, unlocked, visited, image,
          location_tasks(id, name, position)
        `)
        .eq("profile_id", userId)

      if (locationsError) {
        console.error("Error loading locations:", locationsError)
        // Don't return early, just log the error and continue with empty locations
        formattedLocations = []
      } else {
        // Format locations only if we successfully fetched them
        formattedLocations =
          locations?.map((location) => ({
            id: location.location_key,
            name: location.name,
            description: location.description,
            extendedDescription: location.extended_description,
            unlocked: location.unlocked,
            visited: location.visited,
            image: location.image,
            tasks: location.location_tasks.sort((a, b) => a.position - b.position).map((task) => task.name),
          })) || []
      }
    } catch (locationError) {
      console.error("Error in location fetch:", locationError)
      formattedLocations = []
    }

    console.log(`Loaded ${formattedLocations?.length || 0} locations for user ${userId}`)

    // Load character stats
    const { data: characterStats, error: statsError } = await supabase
      .from("character_stats")
      .select("energy, learning, relationships")
      .eq("profile_id", userId)
      .maybeSingle()

    if (statsError) {
      console.error("Error loading character stats:", statsError)
      // Continue loading other data
    }

    // Load skills
    const { data: skills, error: skillsError } = await supabase
      .from("skills")
      .select("skill_key, name, level, max_level, description, category")
      .eq("profile_id", userId)

    if (skillsError) {
      console.error("Error loading skills:", skillsError)
      // Continue loading other data
    }

    // Load life balance data
    const { data: lifeBalanceData, error: lifeBalanceError } = await supabase
      .from("life_balance")
      .select("categories, notes, selected_character_id")
      .eq("profile_id", userId)
      .maybeSingle()

    if (lifeBalanceError && !lifeBalanceError.message.includes("No rows found")) {
      console.error("Error loading life balance data:", lifeBalanceError)
      // Continue loading other data
    }

    // Format the data for the client
    // Flatten all tasks for display
    const lists = todoData?.lists || [];
    const formattedTasks: any[] = [];
    (lists as any[]).forEach((list: any) => {
      (list.tasks || []).forEach((task: any) => {
        formattedTasks.push({
          id: task.id,
          list_id: list.id,
          list_title: list.title,
          task_name: task.name,
          completed: task.completed,
          urgent: task.urgent || false,
          optional: task.optional || false,
        });
      });
    });
    // All month-based logic removed. Only todo_lists is used.


    const formattedSkills = skills?.map((skill) => ({
      id: skill.skill_key,
      name: skill.name,
      level: skill.level,
      maxLevel: skill.max_level,
      description: skill.description,
      category: skill.category,
    }))

    // If no todo lists data was found, provide default empty lists
    if (!formattedTasks || formattedTasks.length === 0) {
      const emptyLists: any[] = [];
      return {
        lists: emptyLists,
        locations: formattedLocations || [],
        characterStats: characterStats || { energy: 70, learning: 45, relationships: 60 },
        skills: formattedSkills || [],
        lifeBalanceCategories: lifeBalanceData?.categories || [],
        lifeBalanceNotes: lifeBalanceData?.notes || "",
        selectedCharacterId: lifeBalanceData?.selected_character_id || 1,
      }
    }

    return {
      tasks: formattedTasks,
      locations: formattedLocations || [],
      characterStats: characterStats || { energy: 70, learning: 45, relationships: 60 },
      skills: formattedSkills || [],
      lifeBalanceCategories: lifeBalanceData?.categories || [],
      lifeBalanceNotes: lifeBalanceData?.notes || "",
      selectedCharacterId: lifeBalanceData?.selected_character_id || 1,
    }
  } catch (error) {
    console.error("Unexpected error in loadUserData:", error)
    return { error: "An unexpected error occurred loading user data" }
  }
}

// Get user profile by username
export async function getUserByUsername(username: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("username", username)
    .single()

  if (error) {
    console.error("Error getting user by username:", error)
    return null
  }

  return data
}

// New function to get tasks for screenshare
export async function getCoworkerTasks(username: string) {
  const supabase = createServerClient()

  // No more mock data for demo coworkers
  if (username.includes(" ")) {
    return { error: "User not found" }
  }

  // First get the profile ID for this username
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single()

  if (profileError || !profile) {
    return { error: "Coworker not found" }
  }

  // Then get their todo lists
  const { data: todoData, error: todoError } = await supabase
    .from("todo_lists")
    .select("lists")
    .eq("user_id", profile.id)
    .single();

  if (todoError || !todoData) {
    return { error: "No tasks available" };
  }

  // Flatten all tasks for screenshare
  const todoLists = todoData?.todo_lists || [];
  const formattedTasks: any[] = [];
  (todoLists as any[]).forEach((list: any) => {
    (list.tasks || []).forEach((task: any) => {
      formattedTasks.push({
        id: task.id,
        list_id: list.id,
        list_title: list.name,
        task_name: task.name,
        completed: task.completed,
        urgent: task.urgent || false,
        optional: task.optional || false,
      });
    });
  });

  return { tasks: formattedTasks };
      .eq("profile_id", profile.id)
      .order("year", { ascending: true })
      .order("name", { ascending: true })

    if (monthTasksError) {
      return { error: "No tasks available" }
    }

    // Format the tasks for display
    const formattedTasks = []
    monthTasks?.forEach((month) => {
      month.tasks.forEach((task) => {
        formattedTasks.push({
          id: task.id,
          
          
          task_name: task.name,
          completed: task.completed,
          urgent: task.urgent || false,
          optional: task.optional || false,
        })
      })
    })

    return { tasks: formattedTasks }
  }

}

// Function to share tasks with coworkers
export async function shareTasksWithCoworkers(userId: string) {
  // Task sharing is now universal: anyone with an account can see all tasks.
  // This function is no longer needed but kept for API compatibility.
  return { info: "All tasks are now visible to any account. No specific sharing logic required." };
}
