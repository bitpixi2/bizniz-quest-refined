"use server"

import { createServerClient } from "./supabase"

// Get user email by username
export async function getUserEmailByUsername(username: string) {
  const supabase = createServerClient()

  // First get the profile ID for this username
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single()

  if (profileError || !profile) {
    return { error: "Username not found" }
  }

  // Get the auth user with this ID
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id)

  if (userError || !userData) {
    return { error: "User not found" }
  }

  return { email: userData.user.email }
}

// New function to get tasks for screenshare
export async function getCoworkerTasks(username: string) {
  const supabase = createServerClient()

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
    return { error: "Error fetching tasks" }
  }

  // Delete existing shared tasks for this user
  await supabase.from("tasks_shared").delete().eq("profile_id", userId)

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
    const { error: insertError } = await supabase.from("tasks_shared").insert(tasksToShare)

    if (insertError) {
      return { error: "Error sharing tasks" }
    }
  }

  return { success: true }
}
