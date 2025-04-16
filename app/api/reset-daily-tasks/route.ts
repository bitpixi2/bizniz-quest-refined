import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = createServerClient()

    // First get the Daily Tasks month IDs
    const { data: monthsData, error: monthsError } = await supabase
      .from("months")
      .select("id")
      .eq("name", "Daily Tasks")

    if (monthsError) {
      console.error("Error finding Daily Tasks months:", monthsError)
      return NextResponse.json({ error: monthsError.message }, { status: 500 })
    }

    // Then update tasks for those month IDs
    const monthIds = monthsData.map((month) => month.id)

    if (monthIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No Daily Tasks months found to reset`,
        timestamp: new Date().toISOString(),
      })
    }

    if (monthIds.length > 0) {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          completed: false,
          updated_at: new Date().toISOString(),
        })
        .filter("month_id", "in", monthIds)

      if (error) {
        console.error("Error resetting daily tasks:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
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
