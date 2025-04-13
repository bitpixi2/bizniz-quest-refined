"use server"

import { createServerClient } from "./supabase"
// Remove the revalidatePath import since it's causing issues with pages/ directory

// Types
type MonthData = {
  name: string
  year: number
  unlocked: boolean
  completed: boolean
  tasks: {
    id: string
    name: string
    completed: boolean
    optional?: boolean
    position: number
  }[]
}

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

// Get archived (completed) tasks for a user
export async function getArchivedTasks(userId: string) {
  const supabase = createServerClient()

  try {
    // Query the tasks_archive table directly
    const { data: archivedTasks, error: archivedError } = await supabase
      .from("tasks_archive")
      .select("*")
      .eq("profile_id", userId)
      .neq("month_name", "Daily Tasks") // Add this line to exclude Daily Tasks
      .order("completed_at", { ascending: false })

    if (archivedError) {
      console.error("Error fetching archived tasks:", archivedError)
      return { error: archivedError.message }
    }

    // If there are no archived tasks, let's populate from completed tasks in the tasks table
    if (!archivedTasks || archivedTasks.length === 0) {
      // Get all completed tasks from the tasks table
      const { data: months, error: monthsError } = await supabase
        .from("months")
        .select(`
          id, name, year,
          tasks(id, name, completed, optional, urgent, updated_at)
        `)
        .eq("profile_id", userId)

      if (monthsError) {
        console.error("Error fetching months:", monthsError)
        return { error: monthsError.message }
      }

      // Extract completed tasks and format them for archiving
      const completedTasks = []
      for (const month of months || []) {
        // Skip Daily Tasks
        if (month.name === "Daily Tasks") continue

        for (const task of month.tasks || []) {
          if (task.completed) {
            completedTasks.push({
              profile_id: userId,
              task_id: task.id,
              task_name: task.name,
              month_id: month.id,
              month_name: month.name,
              month_year: month.year,
              completed_at: task.updated_at || new Date().toISOString(),
              optional: task.optional || false,
              urgent: task.urgent || false,
            })
          }
        }
      }

      // Insert completed tasks into the archive
      if (completedTasks.length > 0) {
        const { error: insertError } = await supabase.from("tasks_archive").insert(completedTasks)

        if (insertError) {
          console.error("Error archiving tasks:", insertError)
          return { error: insertError.message }
        }

        // Fetch the newly archived tasks
        const { data: newArchivedTasks, error: newArchivedError } = await supabase
          .from("tasks_archive")
          .select("*")
          .eq("profile_id", userId)
          .order("completed_at", { ascending: false })

        if (newArchivedError) {
          console.error("Error fetching new archived tasks:", newArchivedError)
          return { error: newArchivedError.message }
        }

        return { tasks: newArchivedTasks }
      }

      return { tasks: [] }
    }

    return { tasks: archivedTasks }
  } catch (error) {
    console.error("Error in getArchivedTasks:", error)
    return { error: "Failed to get archived tasks" }
  }
}

// Get archived (sent) messages for a user
export async function getArchivedMessages(userId: string) {
  const supabase = createServerClient()

  try {
    // Query the messages_archive table directly
    const { data: archivedMessages, error: archivedError } = await supabase
      .from("messages_archive")
      .select("*")
      .eq("sender_id", userId)
      .order("created_at", { ascending: false })

    if (archivedError) {
      console.error("Error fetching archived messages:", archivedError)
      return { error: archivedError.message }
    }

    // If there are no archived messages, let's populate from sent messages in the messages table
    if (!archivedMessages || archivedMessages.length === 0) {
      // Get all sent messages from the messages table
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select(`
          id, sender_id, receiver_id, message, created_at, sender_username,
          receiver:receiver_id(username)
        `)
        .eq("sender_id", userId)
        .order("created_at", { ascending: false })

      if (messagesError) {
        console.error("Error fetching messages:", messagesError)
        return { error: messagesError.message }
      }

      // Format messages for archiving
      const sentMessages = []
      for (const message of messages || []) {
        sentMessages.push({
          message_id: message.id,
          sender_id: message.sender_id,
          receiver_id: message.receiver_id,
          sender_username: message.sender_username || "unknown",
          receiver_username: message.receiver?.username || "unknown",
          message: message.message,
          created_at: message.created_at,
        })
      }

      // Insert sent messages into the archive
      if (sentMessages.length > 0) {
        const { error: insertError } = await supabase.from("messages_archive").insert(sentMessages)

        if (insertError) {
          console.error("Error archiving messages:", insertError)
          return { error: insertError.message }
        }

        // Fetch the newly archived messages
        const { data: newArchivedMessages, error: newArchivedError } = await supabase
          .from("messages_archive")
          .select("*")
          .eq("sender_id", userId)
          .order("created_at", { ascending: false })

        if (newArchivedError) {
          console.error("Error fetching new archived messages:", newArchivedError)
          return { error: newArchivedError.message }
        }

        return { messages: newArchivedMessages }
      }

      return { messages: [] }
    }

    return { messages: archivedMessages }
  } catch (error) {
    console.error("Error in getArchivedMessages:", error)
    return { error: "Failed to get archived messages" }
  }
}

// Save months data to database
export async function saveMonths(userId: string, months: MonthData[]) {
  const supabase = createServerClient()

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

  // Now proceed with saving months as before
  // First, get all existing months for this user
  const { data: existingMonths, error: fetchError } = await supabase
    .from("months")
    .select("id, name, year")
    .eq("profile_id", userId)

  if (fetchError) {
    console.error("Error fetching months:", fetchError)
    return { error: fetchError.message }
  }

  // Process each month
  for (const month of months) {
    // Check if month exists
    const existingMonth = existingMonths?.find((m) => m.name === month.name && m.year === month.year)

    if (existingMonth) {
      // Update existing month
      const { error: updateError } = await supabase
        .from("months")
        .update({
          unlocked: month.unlocked,
          completed: month.completed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingMonth.id)

      if (updateError) {
        console.error("Error updating month:", updateError)
        return { error: updateError.message }
      }

      // Handle tasks for this month
      await handleTasks(supabase, existingMonth.id, month.tasks)
    } else {
      // Insert new month
      const { data: newMonth, error: insertError } = await supabase
        .from("months")
        .insert({
          profile_id: userId,
          name: month.name,
          year: month.year,
          unlocked: month.unlocked,
          completed: month.completed,
        })
        .select("id")
        .single()

      if (insertError) {
        console.error("Error inserting month:", insertError)
        return { error: "Error inserting month: " + insertError.message }
      }

      // Handle tasks for this month
      if (newMonth) {
        await handleTasks(supabase, newMonth.id, month.tasks)
      }
    }
  }

  return { success: true }
}

// Helper function to handle tasks
async function handleTasks(supabase: any, monthId: number, tasks: any[]) {
  // First, get all existing tasks for this month
  const { data: existingTasks, error: fetchError } = await supabase
    .from("tasks")
    .select("id, name")
    .eq("month_id", monthId)

  if (fetchError) {
    console.error("Error fetching tasks:", fetchError)
    return { error: fetchError.message }
  }

  // Process each task
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]
    // Check if task exists
    const existingTask = existingTasks?.find((t) => t.name === task.name)

    if (existingTask) {
      // Update existing task
      const { error: updateError } = await supabase
        .from("tasks")
        .update({
          completed: task.completed,
          optional: task.optional || false,
          urgent: task.urgent || false,
          position: i,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingTask.id)

      if (updateError) {
        console.error("Error updating task:", updateError)
      }
    } else {
      // Insert new task
      const { error: insertError } = await supabase.from("tasks").insert({
        month_id: monthId,
        name: task.name,
        completed: task.completed,
        optional: task.optional || false,
        urgent: task.urgent || false,
        position: i,
      })

      if (insertError) {
        console.error("Error inserting task:", insertError)
      }
    }
  }

  // Delete tasks that no longer exist
  const taskNames = tasks.map((t) => t.name)
  const tasksToDelete = existingTasks?.filter((t) => !taskNames.includes(t.name))

  if (tasksToDelete && tasksToDelete.length > 0) {
    const taskIds = tasksToDelete.map((t) => t.id)
    const { error: deleteError } = await supabase.from("tasks").delete().in("id", taskIds)

    if (deleteError) {
      console.error("Error deleting tasks:", deleteError)
    }
  }
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

  // Remove revalidatePath call
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
    const existingTask = existingTasks?.find((t) => t.name === taskName)

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
  const tasksToDelete = existingTasks?.filter((t) => !tasks.includes(t.name))

  if (tasksToDelete && tasksToDelete.length > 0) {
    const taskIds = tasksToDelete.map((t) => t.id)
    const { error: deleteError } = await supabase.from("location_tasks").delete().in("id", taskIds)

    if (deleteError) {
      console.error("Error deleting location tasks:", deleteError)
    }
  }
}

// Send encouragement message
export async function sendEncouragement(senderId: string, receiverId: string, taskName: string, message: string) {
  const supabase = createServerClient()

  try {
    // For demo purposes, store messages in a different table if using sample IDs
    if (receiverId.length < 10) {
      // Simple check for sample IDs like "1", "2", etc.
      // Store in a demo_messages table or handle differently
      console.log("Demo message:", { senderId, receiverId, message, senderUsername: "bitpixi" })

      // Return success for demo messages without actually inserting to database
      return { success: true, demo: true }
    }

    // Get the sender's username from the profiles table
    const { data: senderProfile, error: profileError } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", senderId)
      .single()

    if (profileError) {
      console.error("Error fetching sender profile:", profileError)
      // Continue with insertion but use a fallback username
    }

    // Use the fetched username or default to email prefix
    const senderUsername = senderProfile?.username || "unknown user"

    // For real UUIDs, proceed with normal insertion
    const { error } = await supabase.from("messages").insert({
      sender_id: senderId,
      receiver_id: receiverId,
      message,
      task_id: null,
      sender_username: senderUsername, // Use the dynamically fetched username
    })

    if (error) {
      console.error("Error sending encouragement:", error)
      return { error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error("Unexpected error in sendEncouragement:", err)
    return { error: "An unexpected error occurred", details: err }
  }
}

// Save character stats to database
export async function saveCharacterStats(userId: string, stats: CharacterStats) {
  const supabase = createServerClient()

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

// Load user data from database
export async function loadUserData(userId: string) {
  const supabase = createServerClient()

  console.log("Loading user data for ID:", userId)

  if (!userId) {
    console.error("No user ID provided to loadUserData")
    return { error: "No user ID provided" }
  }

  try {
    // Load months and tasks
    const { data: months, error: monthsError } = await supabase
      .from("months")
      .select(`
        id, name, year, unlocked, completed,
        tasks(id, name, completed, urgent, position)
      `)
      .eq("profile_id", userId)
      .order("year", { ascending: true })
      .order("name", { ascending: true })

    if (monthsError) {
      console.error("Error loading months:", monthsError)
      return { error: monthsError.message }
    }

    console.log(`Loaded ${months?.length || 0} months for user ${userId}`)

    // Load locations and tasks
    const { data: locations, error: locationsError } = await supabase
      .from("locations")
      .select(`
        id, location_key, name, description, extended_description, unlocked, visited, image,
        location_tasks(id, name, position)
      `)
      .eq("profile_id", userId)

    if (locationsError) {
      console.error("Error loading locations:", locationsError)
      return { error: locationsError.message }
    }

    console.log(`Loaded ${locations?.length || 0} locations for user ${userId}`)

    // Load character stats
    const { data: characterStats, error: statsError } = await supabase
      .from("character_stats")
      .select("energy, learning, relationships")
      .eq("profile_id", userId)
      .maybeSingle()

    if (statsError) {
      console.error("Error loading character stats:", statsError)
      return { error: statsError.message }
    }

    // Load skills
    const { data: skills, error: skillsError } = await supabase
      .from("skills")
      .select("skill_key, name, level, max_level, description, category")
      .eq("profile_id", userId)

    if (skillsError) {
      console.error("Error loading skills:", skillsError)
      return { error: skillsError.message }
    }

    console.log(`Loaded ${skills?.length || 0} skills for user ${userId}`)

    // Format the data for the client
    const formattedMonths = months?.map((month) => ({
      name: month.name,
      year: month.year,
      unlocked: month.unlocked,
      completed: month.completed,
      tasks: month.tasks
        .sort((a, b) => a.position - b.position)
        .map((task) => ({
          id: `task_${task.id}`,
          name: task.name,
          completed: task.completed,
        })),
    }))

    const formattedLocations = locations?.map((location) => ({
      id: location.location_key,
      name: location.name,
      description: location.description,
      extendedDescription: location.extended_description,
      unlocked: location.unlocked,
      visited: location.visited,
      image: location.image,
      tasks: location.location_tasks.sort((a, b) => a.position - b.position).map((task) => task.name),
    }))

    const formattedSkills = skills?.map((skill) => ({
      id: skill.skill_key,
      name: skill.name,
      level: skill.level,
      maxLevel: skill.max_level,
      description: skill.description,
      category: skill.category,
    }))

    // If no months data was found, provide default empty months
    if (!formattedMonths || formattedMonths.length === 0) {
      const currentYear = new Date().getFullYear()
      const emptyMonths = [
        {
          name: "April",
          year: currentYear,
          unlocked: true,
          completed: false,
          tasks: [],
        },
        {
          name: "May",
          year: currentYear,
          unlocked: true,
          completed: false,
          tasks: [],
        },
        {
          name: "June",
          year: currentYear,
          unlocked: true,
          completed: false,
          tasks: [],
        },
        {
          name: "Daily Tasks",
          year: currentYear,
          unlocked: true,
          completed: false,
          tasks: [],
        },
      ]

      return {
        months: emptyMonths,
        locations: formattedLocations || [],
        characterStats: characterStats || { energy: 70, learning: 45, relationships: 60 },
        skills: formattedSkills || [],
      }
    }

    return {
      months: formattedMonths,
      locations: formattedLocations || [],
      characterStats: characterStats || { energy: 70, learning: 45, relationships: 60 },
      skills: formattedSkills || [],
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

  // Then get their shared tasks
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks_shared")
    .select("*")
    .eq("profile_id", profile.id)
    .order("month_year", { ascending: true })
    .order("month_name", { ascending: true })

  if (tasksError) {
    return { error: "Error fetching tasks" }
  }

  // If no shared tasks exist, get tasks from the regular tasks table
  if (tasks.length === 0) {
    const { data: monthTasks, error: monthTasksError } = await supabase
      .from("months")
      .select(`
        id, name, year,
        tasks(id, name, completed, optional, urgent, position)
      `)
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
          month_name: month.name,
          month_year: month.year,
          task_name: task.name,
          completed: task.completed,
          urgent: task.urgent || false,
          optional: task.optional || false,
        })
      })
    })

    return { tasks: formattedTasks }
  }

  return { tasks }
}

// Function to share tasks with coworkers
export async function shareTasksWithCoworkers(userId: string) {
  const supabase = createServerClient()

  try {
    // Get the user's tasks from months
    const { data: monthTasks, error: monthTasksError } = await supabase
      .from("months")
      .select(`
        id, name, year,
        tasks(id, name, completed, optional, urgent, position)
      `)
      .eq("profile_id", userId)
      .order("year", { ascending: true })
      .order("name", { ascending: true })

    if (monthTasksError) {
      console.error("Error fetching tasks:", monthTasksError)
      return { error: "Error fetching tasks" }
    }

    // Delete existing shared tasks for this user
    const { error: deleteError } = await supabase.from("tasks_shared").delete().eq("profile_id", userId)

    if (deleteError) {
      console.error("Error deleting existing shared tasks:", deleteError)
      return { error: "Error preparing task sharing" }
    }

    // Insert tasks into tasks_shared
    const tasksToShare = []
    monthTasks?.forEach((month) => {
      month.tasks.forEach((task) => {
        tasksToShare.push({
          profile_id: userId,
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
          return { error: "Error sharing tasks" }
        }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Unexpected error in shareTasksWithCoworkers:", error)
    return { error: "An unexpected error occurred" }
  }
}

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
