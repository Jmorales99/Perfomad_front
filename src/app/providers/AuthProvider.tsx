import React, { createContext, useState, useEffect, useContext } from "react"
import {
  getAccessToken,
  removeToken,
  setAccessToken,
  markLoggingOut,
} from "@/infrastructure/storage/tokenStorage"
import { loginUser, registerUser } from "@/infrastructure/api/authRepository"
import { getProfile } from "@/infrastructure/api/profileRepository"

interface AuthContextType {
  isAuthenticated: boolean
  hasSubscription: boolean
  user: any
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (
    email: string,
    password: string,
    name: string,
    age: number,
    phone: string
  ) => Promise<boolean>
  logout: () => void
  setHasSubscription: (value: boolean) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [loading, setLoading] = useState(true)

  // ==============================
  // 🔹 Cargar perfil si hay token
  // ==============================
  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setIsAuthenticated(false)
      setLoading(false)
      return
    }

    const loadProfile = async () => {
      try {
        const profile = await getProfile()
        setUser(profile)
        setHasSubscription(!!profile.has_active_subscription)
        setIsAuthenticated(true)
      } catch (err) {
        console.error("❌ Error al cargar perfil:", err)
        removeToken()
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  // ==============================
  // 🔹 Login
  // ==============================
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const token = await loginUser(email, password)
      setAccessToken(token)
      setIsAuthenticated(true)

      // obtener perfil tras login
      const profile = await getProfile()
      setUser(profile)
      setHasSubscription(!!profile.has_active_subscription)

      return true
    } catch (error: any) {
      alert(error.message)
      return false
    }
  }

  // ==============================
  // 🔹 Registro
  // ==============================
  const register = async (
    email: string,
    password: string,
    name: string,
    age: number,
    phone: string
  ): Promise<boolean> => {
    try {
      await registerUser(email, password, name, age, phone)
      return true
    } catch (error: any) {
      alert(error.message)
      return false
    }
  }

  // ==============================
  // 🔹 Logout
  // ==============================
  const logout = () => {
    markLoggingOut(true)
    removeToken()
    setUser(null)
    setIsAuthenticated(false)
    setHasSubscription(false)
    setTimeout(() => markLoggingOut(false), 2000)
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
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
