"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "./supabaseClient"

type AuthContextType = {
  session: Session | null
  user: any | null
  isLoading: boolean
  hasError: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  hasError: false,
  signIn: async () => {},
  signOut: async () => {},
  signUp: async () => {},
})

type Props = {
  children: React.ReactNode
}

export const AuthProvider: React.FC<Props> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let isMounted = true

    const fetchSession = async () => {
      try {
        console.log("Fetching auth session...")
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error fetching session:", error)
          if (isMounted) {
            setHasError(true)
          }
        }

        if (isMounted) {
          if (session?.user) {
            console.log("Session found, user ID:", session.user.id)
          } else {
            console.log("No active session found")
          }
          setSession(session)
          setUser(session?.user ?? null)
          setIsLoading(false)
        }
      } catch (err) {
        console.error("Session fetch error:", err)
        if (isMounted) {
          setHasError(true)
          setIsLoading(false)
        }
      }
    }

    fetchSession()

    try {
      console.log("Setting up auth state change listener")
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (isMounted) {
          if (session?.user) {
            console.log("Auth state changed, user ID:", session.user.id)

            // If the session is about to expire, try to refresh it
            // But only if it's about to expire in less than 2 minutes (instead of 5)
            if (session.expires_at) {
              const expiresAt = new Date(session.expires_at * 1000)
              const now = new Date()
              const timeUntilExpiry = expiresAt.getTime() - now.getTime()

              // Only refresh if token expires in less than 2 minutes
              if (timeUntilExpiry < 2 * 60 * 1000) {
                console.log("Session about to expire, refreshing...")
                try {
                  const { data, error } = await supabase.auth.refreshSession()
                  if (error) {
                    console.error("Error refreshing session:", error)
                  } else if (data.session) {
                    console.log("Session refreshed successfully")
                    session = data.session
                  }
                } catch (refreshError) {
                  console.error("Error during session refresh:", refreshError)
                }
              }
            }
          } else {
            console.log("Auth state changed, no user")
          }
          setSession(session)
          setUser(session?.user ?? null)
          setIsLoading(false)
        }
      })

      return () => {
        isMounted = false
        subscription.unsubscribe()
      }
    } catch (err) {
      console.error("Auth state change error:", err)
      setHasError(true)
      setIsLoading(false)
      return () => {
        isMounted = false
      }
    }
  }, [supabase])

  // Add the auth functions
  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      setSession(data.session)
      setUser(data.user)
    } catch (error) {
      console.error("Sign in error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setSession(null)
      setUser(null)
    } catch (error) {
      console.error("Sign out error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    setIsLoading(true)
    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })

      if (error) throw error

      // Create a profile for the user
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          username,
          display_name: username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (profileError) {
          console.error("Error creating profile:", profileError)
        }
      }
    } catch (error) {
      console.error("Sign up error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const value = { session, user, isLoading, hasError, signIn, signOut, signUp }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}
