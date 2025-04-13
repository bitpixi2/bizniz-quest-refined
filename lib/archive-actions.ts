"use server"

import { createServerClient } from "./supabase"

// Get archived (completed) tasks for a user
export async function getArchivedTasks(userId: string) {
  const supabase = createServerClient()

  try {
    // First, create the tasks_archive table if it doesn't exist
    await supabase.rpc("create_tasks_archive_table_if_not_exists")

    // Check if there are any archived tasks
    const { data: archivedTasks, error: archivedError } = await supabase
      .from("tasks_archive")
      .select("*")
      .eq("profile_id", userId)
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
        for (const task of month.tasks || []) {
          if (task.completed) {
            completedTasks.push({
              profile_id: userId,
              task_id: task.id,
              task_name: task.name,
              month_id: month.id,
              month_name: month.name,
              month_year: month.year,
              completed_at: task.updated_at,
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
    // First, create the messages_archive table if it doesn't exist
    await supabase.rpc("create_messages_archive_table_if_not_exists")

    // Check if there are any archived messages
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
