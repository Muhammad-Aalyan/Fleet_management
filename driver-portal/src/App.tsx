import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import MyRides from './pages/MyRides'
import FuelLog from './pages/FuelLog'
import MileageLog from './pages/MileageLog'
import Emergency from './pages/Emergency'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="my-rides" element={<MyRides />} />
          <Route path="fuel-log" element={<FuelLog />} />
          <Route path="mileage-log" element={<MileageLog />} />
          <Route path="emergency" element={<Emergency />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
