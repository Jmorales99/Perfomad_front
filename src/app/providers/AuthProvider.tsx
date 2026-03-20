import React, { createContext, useState, useEffect, useContext } from "react"
import { supabase } from "@/infrastructure/supabase/client"
import { registerUser } from "@/infrastructure/api/authRepository"
import { getProfile } from "@/infrastructure/api/profileRepository"
import {
  mapSupabaseSignInError,
  PROFILE_LOAD_USER_ERROR,
  mapRegisterApiError,
} from "@/lib/authUserMessages"

interface AuthContextType {
  isAuthenticated: boolean
  hasSubscription: boolean
  user: any
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (
    email: string,
    password: string,
    name: string,
    age: number,
    phone: string
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  setHasSubscription: (value: boolean) => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (): Promise<boolean> => {
    try {
      const profile = await getProfile()
      setUser(profile)
      setHasSubscription(!!profile.has_active_subscription)
      setIsAuthenticated(true)
      return true
    } catch {
      setUser(null)
      setIsAuthenticated(false)
      setHasSubscription(false)
      return false
    }
  }

  // Inicializar sesión desde Supabase y escuchar cambios
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadProfile().finally(() => setLoading(false))
      } else {
        setIsAuthenticated(false)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          loadProfile()
        } else {
          setUser(null)
          setIsAuthenticated(false)
          setHasSubscription(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return { success: false, error: mapSupabaseSignInError(error.message) }
    }
    const profileOk = await loadProfile()
    if (!profileOk) {
      await supabase.auth.signOut()
      return { success: false, error: PROFILE_LOAD_USER_ERROR }
    }
    return { success: true }
  }

  const register = async (
    email: string,
    password: string,
    name: string,
    age: number,
    phone: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await registerUser(email, password, name, age, phone)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: mapRegisterApiError(error) }
    }
  }

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut()
    setUser(null)
    setIsAuthenticated(false)
    setHasSubscription(false)
  }

  const refreshProfile = async () => {
    try {
      const profile = await getProfile()
      setUser(profile)
      setHasSubscription(!!profile.has_active_subscription)
    } catch (err) {
      console.error("Error al refrescar perfil:", err)
    }
  }

  const value: AuthContextType = {
    isAuthenticated,
    hasSubscription,
    user,
    loading,
    login,
    register,
    logout,
    setHasSubscription,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
