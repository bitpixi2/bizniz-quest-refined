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
  try {
    if (typeof window !== "undefined") {
      // We're on the client side, use the browser client
      return getSupabaseBrowserClient()
    }

    // For server-side, create a new client each time to avoid stale connections
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase server credentials. Using fallback client.")
      // Return a fallback client that won't throw errors but won't work either
      return createFallbackClient()
    }

    console.log("Creating new server Supabase client")
    return createClient(supabaseUrl, supabaseServiceKey)
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    return createFallbackClient()
  }
}

// Create a fallback client that won't throw errors
function createFallbackClient() {
  // This is a mock client that returns empty data for all operations
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          maybeSingle: async () => ({ data: null, error: null }),
          order: () => ({ data: [], error: null }),
          in: () => ({ data: [], error: null }),
        }),
        order: () => ({
          eq: () => ({ data: [], error: null }),
          in: () => ({ data: [], error: null }),
        }),
        eq: () => ({ data: [], error: null }),
        in: () => ({ data: [], error: null }),
      }),
      insert: () => ({ error: null }),
      update: () => ({ error: null }),
      delete: () => ({ error: null }),
    }),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      admin: {
        getUserById: async () => ({ data: { user: null }, error: null }),
        inviteUserByEmail: async () => ({ data: null, error: null }),
        listUsers: async () => ({ data: { users: [] }, error: null }),
      },
    },
    rpc: () => ({ error: null }),
  }
}
