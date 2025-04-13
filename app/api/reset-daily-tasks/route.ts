import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createServerClient()

    // Update all tasks in Daily Tasks months to uncompleted in a single query
    const { data, error } = await supabase
      .from("tasks")
      .update({
        completed: false,
        updated_at: new Date().toISOString(),
      })
      .in("month_id", supabase.from("months").select("id").eq("name", "Daily Tasks"))

    if (error) {
      console.error("Error resetting daily tasks:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Reset daily tasks successfully`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in reset-daily-tasks:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
