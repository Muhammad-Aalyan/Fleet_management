import { createContext, useContext, useState, ReactNode } from 'react'

interface User { id: number; email: string; role: string }
interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('fleet_token'))
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem('fleet_user')
    return u ? JSON.parse(u) : null
  })

  const login = (t: string, u: User) => {
    localStorage.setItem('fleet_token', t)
    localStorage.setItem('fleet_user', JSON.stringify(u))
    setToken(t)
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('fleet_token')
    localStorage.removeItem('fleet_user')
    setToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
