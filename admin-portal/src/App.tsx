import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import RideRequests from './pages/RideRequests'
import Drivers from './pages/Drivers'
import Vehicles from './pages/Vehicles'
import Customers from './pages/Customers'
import ActiveRides from './pages/ActiveRides'
import FuelRecords from './pages/FuelRecords'
import RidesReport from './pages/RidesReport'
import CustomerReport from './pages/CustomerReport'
import FuelReport from './pages/FuelReport'
import DriverPerformanceReport from './pages/DriverPerformanceReport'
import VehicleUtilizationReport from './pages/VehicleUtilizationReport'
import RouteAnalysisReport from './pages/RouteAnalysisReport'
import ReimbursementsReport from './pages/ReimbursementsReport'
import FuelEfficiencyReport from './pages/FuelEfficiencyReport'
import CustomerReimbursements from './pages/CustomerReimbursements'
import DriverReimbursements from './pages/DriverReimbursements'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="ride-requests" element={<RideRequests />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="customers" element={<Customers />} />
            <Route path="active-rides" element={<ActiveRides />} />
            <Route path="fuel-records" element={<FuelRecords />} />
            <Route path="reports/rides" element={<RidesReport />} />
            <Route path="reports/customers" element={<CustomerReport />} />
            <Route path="reports/fuel" element={<FuelReport />} />
            <Route path="reports/driver-performance" element={<DriverPerformanceReport />} />
            <Route path="reports/vehicle-utilization" element={<VehicleUtilizationReport />} />
            <Route path="reports/route-analysis" element={<RouteAnalysisReport />} />
            <Route path="reports/reimbursements" element={<ReimbursementsReport />} />
            <Route path="reports/fuel-efficiency" element={<FuelEfficiencyReport />} />
            <Route path="reimbursements/customer" element={<CustomerReimbursements />} />
            <Route path="reimbursements/driver" element={<DriverReimbursements />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
