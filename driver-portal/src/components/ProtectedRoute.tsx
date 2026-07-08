import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = sessionStorage.getItem('fleet_token')
  const user = JSON.parse(sessionStorage.getItem('fleet_user') || 'null')
  if (!token || user?.role !== 'DRIVER') return <Navigate to="/login" replace />
  return <>{children}</>
}
