import { useState } from 'react'
import { Dropdown } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { LogoutOutlined } from '@ant-design/icons'
import NotificationBell from '../components/NotificationBell'
import {
  IconDashboard, IconVehicle, IconFuel, IconRoute, IconReceipt, IconBell,
} from '../components/icons'

interface NavLeaf { path: string; label: string; icon?: React.ReactNode }

const mainNav: NavLeaf[] = [
  { path: '/dashboard', label: 'Dashboard', icon: <IconDashboard /> },
  { path: '/my-rides', label: 'My Rides', icon: <IconVehicle /> },
  { path: '/fuel-log', label: 'Fuel Log', icon: <IconFuel /> },
  { path: '/mileage-log', label: 'Mileage Log', icon: <IconRoute /> },
  { path: '/reimbursement', label: 'Reimbursement', icon: <IconReceipt /> },
  { path: '/emergency', label: 'Emergency', icon: <IconBell /> },
]

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard', '/my-rides': 'My Rides',
  '/fuel-log': 'Fuel Log', '/mileage-log': 'Mileage Log',
  '/emergency': 'Emergency Alert', '/reimbursement': 'Reimbursement Claims',
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
          <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name ?? 'Driver'}</div>
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

  const initial = (user?.name ?? 'D').charAt(0).toUpperCase()

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
        </div>

        <div className="rd-sidebar-foot">
          <div className="tag">DRIVER PORTAL</div>
          <div className="line">BRING IT <span>ON!</span></div>
        </div>
      </div>

      <div className={`rd-main${collapsed ? ' collapsed' : ''}`}>
        <div className="rd-topbar">
          <div className="left">
            <button className="rd-hamb" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
              <span /><span /><span />
            </button>
            <h1>{pageTitles[location.pathname] ?? 'Driver'}</h1>
          </div>
          <div className="right">
            <NotificationBell />
            <Dropdown
              menu={{ items: userMenuItems, onClick: ({ key }) => key === 'logout' && handleLogout() }}
              placement="bottomRight"
            >
              <div className="rd-driver-chip">
                <div className="rd-avatar">{initial}</div>
                {user?.name ?? 'Driver'}
              </div>
            </Dropdown>
          </div>
        </div>

        <div className="rd-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
