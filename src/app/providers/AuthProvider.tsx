// src/app/providers/AuthProvider.tsx
import React, { createContext, useState, useEffect, useContext } from 'react'
import {
  getAccessToken,
  removeToken,
  setAccessToken,
  markLoggingOut,
} from '@/infrastructure/storage/tokenStorage'
import { loginUser, registerUser } from '@/infrastructure/api/authRepository'

interface AuthContextType {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (
    email: string,
    password: string,
    name: string,
    age: number,
    phone: string
  ) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = getAccessToken()
    setIsAuthenticated(!!token)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const token = await loginUser(email, password)
      setAccessToken(token)
      setIsAuthenticated(true)
      return true
    } catch (error: any) {
      alert(error.message)
      return false
    }
  }

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

  const logout = () => {
    markLoggingOut(true)
    removeToken()
    setIsAuthenticated(false)
    setTimeout(() => markLoggingOut(false), 2000)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
