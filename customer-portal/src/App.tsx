import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Home from './pages/Home'
import RequestRide from './pages/RequestRide'
import MyRides from './pages/MyRides'
import RideHistory from './pages/RideHistory'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="request-ride" element={<RequestRide />} />
          <Route path="my-rides" element={<MyRides />} />
          <Route path="history" element={<RideHistory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
