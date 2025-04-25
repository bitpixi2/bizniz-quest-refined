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

  // Get their todo lists
  const { data: todoData, error: todoError } = await supabase
    .from("todo_lists")
    .select("lists")
    .eq("user_id", profile.id)
    .single()

  if (todoError || !todoData) {
    return { error: "No tasks available" }
  }

  // Flatten all tasks for screenshare
  const lists = todoData.lists || [];
  const tasks: any[] = [];
  (lists as any[]).forEach((list: any) => {
    (list.tasks || []).forEach((task: any) => {
      tasks.push({
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

  return { tasks };
}

// Sharing is deprecated in the new To Do system. Implement sharing via todo_lists or a new sharing table if needed.
export async function shareTasksWithCoworkers(userId: string) {
  return { error: "Task sharing is not implemented in the new To Do system." };
}
