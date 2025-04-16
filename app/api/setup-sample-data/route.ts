import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  const supabase = createServerClient()
  const results: any[] = []

  try {
    // Create profiles table if it doesn't exist
    const { error: profilesError } = await supabase.rpc("create_profiles_table_if_not_exists")

    if (profilesError) {
      results.push({
        operation: "Create profiles table",
        status: "error",
        message: profilesError.message,
      })
    } else {
      results.push({
        operation: "Create profiles table",
        status: "success",
        message: "Profiles table created or already exists",
      })
    }

    // Create months table if it doesn't exist
    const { error: monthsError } = await supabase.rpc("create_months_table_if_not_exists")

    if (monthsError) {
      results.push({
        operation: "Create months table",
        status: "error",
        message: monthsError.message,
      })
    } else {
      results.push({
        operation: "Create months table",
        status: "success",
        message: "Months table created or already exists",
      })
    }

    // Create tasks table if it doesn't exist
    const { error: tasksError } = await supabase.rpc("create_tasks_table_if_not_exists")

    if (tasksError) {
      results.push({
        operation: "Create tasks table",
        status: "error",
        message: tasksError.message,
      })
    } else {
      results.push({
        operation: "Create tasks table",
        status: "success",
        message: "Tasks table created or already exists",
      })
    }

    // Create user_maps table if it doesn't exist
    const { error: userMapsError } = await supabase.rpc("create_user_maps_table_if_not_exists")

    if (userMapsError) {
      results.push({
        operation: "Create user maps table",
        status: "error",
        message: userMapsError.message,
      })

      // Try direct SQL as fallback
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

        results.push({
          operation: "Create user maps table (direct SQL)",
          status: "success",
          message: "User maps table created with direct SQL",
        })
      } catch (directError) {
        results.push({
          operation: "Create user maps table (direct SQL)",
          status: "error",
          message: "Failed to create with direct SQL",
        })
      }
    } else {
      results.push({
        operation: "Create user maps table",
        status: "success",
        message: "User maps table created or already exists",
      })
    }

    // Create locations table if it doesn't exist
    const { error: locationsError } = await supabase.rpc("create_locations_table_if_not_exists")

    if (locationsError) {
      results.push({
        operation: "Create locations table",
        status: "error",
        message: locationsError.message,
      })
    } else {
      results.push({
        operation: "Create locations table",
        status: "success",
        message: "Locations table created or already exists",
      })
    }

    // Create location_tasks table if it doesn't exist
    const { error: locationTasksError } = await supabase.rpc("create_location_tasks_table_if_not_exists")

    if (locationTasksError) {
      results.push({
        operation: "Create location tasks table",
        status: "error",
        message: locationTasksError.message,
      })
    } else {
      results.push({
        operation: "Create location tasks table",
        status: "success",
        message: "Location tasks table created or already exists",
      })
    }

    // Create character_stats table if it doesn't exist
    const { error: statsError } = await supabase.rpc("create_character_stats_table_if_not_exists")

    if (statsError) {
      results.push({
        operation: "Create character stats table",
        status: "error",
        message: statsError.message,
      })
    } else {
      results.push({
        operation: "Create character stats table",
        status: "success",
        message: "Character stats table created or already exists",
      })
    }

    // Create skills table if it doesn't exist
    const { error: skillsError } = await supabase.rpc("create_skills_table_if_not_exists")

    if (skillsError) {
      results.push({
        operation: "Create skills table",
        status: "error",
        message: skillsError.message,
      })
    } else {
      results.push({
        operation: "Create skills table",
        status: "success",
        message: "Skills table created or already exists",
      })
    }

    // Create messages table if it doesn't exist
    const { error: messagesError } = await supabase.rpc("create_messages_table_if_not_exists")

    if (messagesError) {
      results.push({
        operation: "Create messages table",
        status: "error",
        message: messagesError.message,
      })
    } else {
      results.push({
        operation: "Create messages table",
        status: "success",
        message: "Messages table created or already exists",
      })
    }

    // Create tasks_shared table if it doesn't exist
    const { error: tasksSharedError } = await supabase.rpc("create_tasks_shared_table_if_not_exists")

    if (tasksSharedError) {
      results.push({
        operation: "Create tasks shared table",
        status: "error",
        message: tasksSharedError.message,
      })
    } else {
      results.push({
        operation: "Create tasks shared table",
        status: "success",
        message: "Tasks shared table created or already exists",
      })
    }

    // Create coworkers table if it doesn't exist
    const { error: coworkersError } = await supabase.rpc("create_coworkers_table_if_not_exists")

    if (coworkersError) {
      results.push({
        operation: "Create coworkers table",
        status: "error",
        message: coworkersError.message,
      })

      // Try direct SQL as fallback
      try {
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS coworkers (
            id SERIAL PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES profiles(id),
            coworker_id UUID NOT NULL REFERENCES profiles(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, coworker_id)
          );
        `

        await supabase.rpc("exec_sql", { sql: createTableSQL })

        results.push({
          operation: "Create coworkers table (direct SQL)",
          status: "success",
          message: "Coworkers table created with direct SQL",
        })
      } catch (directError) {
        results.push({
          operation: "Create coworkers table (direct SQL)",
          status: "error",
          message: "Failed to create with direct SQL",
        })
      }
    } else {
      results.push({
        operation: "Create coworkers table",
        status: "success",
        message: "Coworkers table created or already exists",
      })
    }

    // Add code to create archive tables in the setup-sample-data API

    // Create tasks_archive table if it doesn't exist
    const { error: tasksArchiveError } = await supabase.rpc("create_tasks_archive_table_if_not_exists")

    if (tasksArchiveError) {
      results.push({
        operation: "Create tasks archive table",
        status: "error",
        message: tasksArchiveError.message,
      })

      // Try direct SQL as fallback
      try {
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS tasks_archive (
            id SERIAL PRIMARY KEY,
            profile_id UUID NOT NULL,
            task_id INTEGER,
            task_name TEXT NOT NULL,
            month_id INTEGER,
            month_name TEXT NOT NULL,
            month_year INTEGER NOT NULL,
            completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            optional BOOLEAN DEFAULT FALSE,
            urgent BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `

        await supabase.rpc("exec_sql", { sql: createTableSQL })

        results.push({
          operation: "Create tasks archive table (direct SQL)",
          status: "success",
          message: "Tasks archive table created with direct SQL",
        })
      } catch (directError) {
        results.push({
          operation: "Create tasks archive table (direct SQL)",
          status: "error",
          message: "Failed to create with direct SQL",
        })
      }
    } else {
      results.push({
        operation: "Create tasks archive table",
        status: "success",
        message: "Tasks archive table created or already exists",
      })
    }

    // Create messages_archive table if it doesn't exist
    const { error: messagesArchiveError } = await supabase.rpc("create_messages_archive_table_if_not_exists")

    if (messagesArchiveError) {
      results.push({
        operation: "Create messages archive table",
        status: "error",
        message: messagesArchiveError.message,
      })

      // Try direct SQL as fallback
      try {
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS messages_archive (
            id SERIAL PRIMARY KEY,
            message_id INTEGER,
            sender_id UUID NOT NULL,
            receiver_id UUID NOT NULL,
            sender_username TEXT NOT NULL,
            receiver_username TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `

        await supabase.rpc("exec_sql", { sql: createTableSQL })

        results.push({
          operation: "Create messages archive table (direct SQL)",
          status: "success",
          message: "Messages archive table created with direct SQL",
        })
      } catch (directError) {
        results.push({
          operation: "Create messages archive table (direct SQL)",
          status: "error",
          message: "Failed to create with direct SQL",
        })
      }
    } else {
      results.push({
        operation: "Create messages archive table",
        status: "success",
        message: "Messages archive table created or already exists",
      })
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error("Error setting up database:", error)
    return NextResponse.json({ success: false, error: "Failed to set up database: " + error.message }, { status: 500 })
  }
}
