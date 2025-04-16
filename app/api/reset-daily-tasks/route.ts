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

    // Update tasks one month at a time
    for (const monthId of monthIds) {
      const query = supabase.from("tasks")
      const { error: updateError } = await (query as any)
        .update({
          completed: false,
          updated_at: new Date().toISOString(),
        })
        .eq('month_id', monthId)

      if (updateError) {
        console.error(`Error updating tasks for month ${monthId}:`, updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
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
