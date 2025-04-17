import { createServerClient } from "@/lib/supabase";

// Table: todo_titles (user_id: string, todo_number: number, title: string)

export async function getTodoTitles(userId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("todo_titles")
    .select("todo_number, title")
    .eq("user_id", userId);
  if (error) return { error };
  // Return as a map: { 1: "...", 2: "...", 3: "..." }
  const titles: Record<number, string> = {};
  data?.forEach((row: { todo_number: number; title: string }) => {
    titles[row.todo_number] = row.title;
  });
  return { titles };
}

export async function setTodoTitle(userId: string, todoNumber: number, title: string) {
  const supabase = createServerClient();
  // Upsert the title for this user/todoNumber
  const { error } = await supabase
    .from("todo_titles")
    .upsert({ user_id: userId, todo_number: todoNumber, title }, { onConflict: "user_id,todo_number" });
  return { error };
}
