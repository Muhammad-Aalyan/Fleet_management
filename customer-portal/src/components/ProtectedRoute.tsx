import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('fleet_token')
  const user = JSON.parse(localStorage.getItem('fleet_user') || 'null')
  if (!token || user?.role !== 'CUSTOMER') return <Navigate to="/login" replace />
  return <>{children}</>
}
