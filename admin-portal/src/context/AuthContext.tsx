import { createContext, useContext, useState, ReactNode } from 'react'

interface User { id: number; email: string; role: string; name: string }
interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('fleet_token'))
  const [user, setUser] = useState<User | null>(() => {
    const u = sessionStorage.getItem('fleet_user')
    return u ? JSON.parse(u) : null
  })

  const login = (t: string, u: User) => {
    sessionStorage.setItem('fleet_token', t)
    sessionStorage.setItem('fleet_user', JSON.stringify(u))
    setToken(t)
    setUser(u)
  }

  const logout = () => {
    sessionStorage.removeItem('fleet_token')
    sessionStorage.removeItem('fleet_user')
    setToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
