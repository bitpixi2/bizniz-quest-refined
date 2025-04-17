import { createClient } from "@supabase/supabase-js"

// Create a single supabase client for the browser
let browserClient: ReturnType<typeof createClient> | null = null

export const getSupabaseBrowserClient = () => {
  if (!browserClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
      )
    }

    console.log("Creating new browser Supabase client")
    browserClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return browserClient
}

// Create a server client (to be used in server components or server actions)
export const createServerClient = () => {
  if (typeof window !== "undefined") {
    // We're on the client side, use the browser client
    return getSupabaseBrowserClient();
  }

  // For server-side, create a new client each time to avoid stale connections
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase server credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.");
  }

  console.log("Creating new server Supabase client");
  return createClient(supabaseUrl, supabaseServiceKey);
}


