import { useState } from 'react'
import { Dropdown } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { LogoutOutlined } from '@ant-design/icons'
import NotificationBell from '../components/NotificationBell'
import EmergencyBanner from '../components/EmergencyBanner'
import {
  IconDashboard, IconDocument, IconBolt, IconDrivers, IconVehicle,
  IconCustomers, IconFuel, IconReceipt, IconChart, IconRoute,
} from '../components/icons'

interface NavLeaf { path: string; label: string; icon?: React.ReactNode }

const mainNav: NavLeaf[] = [
  { path: '/dashboard', label: 'Dashboard', icon: <IconDashboard /> },
  { path: '/ride-requests', label: 'Ride Requests', icon: <IconDocument /> },
  { path: '/active-rides', label: 'Active Rides', icon: <IconBolt /> },
  { path: '/drivers', label: 'Drivers', icon: <IconDrivers /> },
  { path: '/vehicles', label: 'Vehicles', icon: <IconVehicle /> },
  { path: '/customers', label: 'Customers', icon: <IconCustomers /> },
  { path: '/fuel-records', label: 'Fuel Records', icon: <IconFuel /> },
]

const reimbursementNav: NavLeaf[] = [
  { path: '/reimbursements/customer', label: 'Customer Claims', icon: <IconReceipt /> },
  { path: '/reimbursements/driver', label: 'Driver Claims', icon: <IconReceipt /> },
]

const reportsNav: NavLeaf[] = [
  { path: '/reports/rides', label: 'Rides', icon: <IconChart /> },
  { path: '/reports/customers', label: 'Customer', icon: <IconChart /> },
  { path: '/reports/fuel', label: 'Fuel', icon: <IconChart /> },
  { path: '/reports/driver-performance', label: 'Driver Performance', icon: <IconChart /> },
  { path: '/reports/vehicle-utilization', label: 'Vehicle Utilization', icon: <IconChart /> },
  { path: '/reports/route-analysis', label: 'Route Analysis', icon: <IconRoute /> },
  { path: '/reports/reimbursements', label: 'Reimbursements', icon: <IconChart /> },
  { path: '/reports/fuel-efficiency', label: 'Fuel Efficiency', icon: <IconChart /> },
]

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard', '/ride-requests': 'Ride Requests', '/active-rides': 'Active Rides',
  '/drivers': 'Drivers', '/vehicles': 'Vehicles', '/customers': 'Customers',
  '/fuel-records': 'Fuel Records',
  '/reports/rides': 'Rides Report',
  '/reports/customers': 'Customer Report',
  '/reports/fuel': 'Fuel Report',
  '/reports/driver-performance': 'Driver Performance Report',
  '/reports/vehicle-utilization': 'Vehicle Utilization Report',
  '/reports/route-analysis': 'Route Analysis Report',
  '/reports/reimbursements': 'Reimbursements Summary',
  '/reports/fuel-efficiency': 'Fuel Efficiency Report',
  '/reimbursements/customer': 'Customer Reimbursements',
  '/reimbursements/driver': 'Driver Reimbursements',
}

function NavItem({ item, active, onClick }: { item: NavLeaf; active: boolean; onClick: () => void }) {
  return (
    <div className={`rd-nav-item${active ? ' active' : ''}`} onClick={onClick}>
      {item.icon}
      {item.label}
    </div>
  )
}

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuth()

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch { /* token may be expired */ }
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'info',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name ?? 'Admin'}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{user?.email}</div>
          <div style={{ marginTop: 4 }}>
            <span style={{ background: '#FDEAEB', color: '#E01E2B', fontSize: 11, padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>
              {user?.role}
            </span>
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
  ]

  const initial = (user?.name ?? 'A').charAt(0).toUpperCase()

  return (
    <div>
      <div className={`rd-sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="rd-brand">
          <img src="/logo-mark.png" alt="Ride On" />
        </div>

        <div className="rd-nav-scroll">
          {mainNav.map(item => (
            <NavItem key={item.path} item={item} active={location.pathname === item.path} onClick={() => navigate(item.path)} />
          ))}

          <div className="rd-nav-label">Reimbursements</div>
          <div className="rd-nav-sub">
            {reimbursementNav.map(item => (
              <NavItem key={item.path} item={item} active={location.pathname === item.path} onClick={() => navigate(item.path)} />
            ))}
          </div>

          <div className="rd-nav-label">Reports</div>
          <div className="rd-nav-sub">
            {reportsNav.map(item => (
              <NavItem key={item.path} item={item} active={location.pathname === item.path} onClick={() => navigate(item.path)} />
            ))}
          </div>
        </div>

        <div className="rd-sidebar-foot">
          <div className="tag">FLEET OPERATIONS</div>
          <div className="line">BRING IT <span>ON!</span></div>
        </div>
      </div>

      <div className={`rd-main${collapsed ? ' collapsed' : ''}`}>
        <div className="rd-topbar">
          <div className="left">
            <button className="rd-hamb" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
              <span /><span /><span />
            </button>
            <h1>{pageTitles[location.pathname] ?? 'Admin'}</h1>
          </div>
          <div className="right">
            <NotificationBell />
            <Dropdown
              menu={{ items: userMenuItems, onClick: ({ key }) => key === 'logout' && handleLogout() }}
              placement="bottomRight"
            >
              <div className="rd-admin-chip">
                <div className="rd-avatar">{initial}</div>
                {user?.name ?? 'Admin'}
              </div>
            </Dropdown>
          </div>
        </div>

        <EmergencyBanner />
        <div className="rd-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
