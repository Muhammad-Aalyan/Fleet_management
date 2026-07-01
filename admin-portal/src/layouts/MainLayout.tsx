import { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Typography } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import {
  DashboardOutlined, CarOutlined, TeamOutlined, UserOutlined,
  FileTextOutlined, ThunderboltOutlined, BarChartOutlined,
  LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, DollarOutlined,
} from '@ant-design/icons'
import NotificationBell from '../components/NotificationBell'
import EmergencyBanner from '../components/EmergencyBanner'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/ride-requests', icon: <FileTextOutlined />, label: 'Ride Requests' },
  { key: '/active-rides', icon: <ThunderboltOutlined />, label: 'Active Rides' },
  { key: '/drivers', icon: <TeamOutlined />, label: 'Drivers' },
  { key: '/vehicles', icon: <CarOutlined />, label: 'Vehicles' },
  { key: '/customers', icon: <UserOutlined />, label: 'Customers' },
  { key: '/fuel-records', icon: <DollarOutlined />, label: 'Fuel Records' },
  { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
]

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard', '/ride-requests': 'Ride Requests', '/active-rides': 'Active Rides',
  '/drivers': 'Drivers', '/vehicles': 'Vehicles', '/customers': 'Customers',
  '/fuel-records': 'Fuel Records', '/reports': 'Reports',
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
            <span style={{ background: '#e6f4ff', color: '#1677ff', fontSize: 11, padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible collapsed={collapsed} trigger={null} width={240}
        style={{ position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100 }}
      >
        <div className="logo-area">
          <span className="logo-icon">🚗</span>
          {!collapsed && <span className="logo-text">Fleet<span>Admin</span></span>}
        </div>
        <Menu
          theme="dark" mode="inline" selectedKeys={[location.pathname]}
          items={menuItems} onClick={({ key }) => navigate(key)}
          style={{ marginTop: 8, border: 'none' }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'all 0.2s' }}>
        <Header className="site-header">
          <div className="header-left">
            <Button type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)} style={{ fontSize: 16 }}
            />
            <span className="page-title">{pageTitles[location.pathname] ?? 'Admin'}</span>
          </div>
          <div className="header-right">
            <NotificationBell />
            <Dropdown
              menu={{ items: userMenuItems, onClick: ({ key }) => key === 'logout' && handleLogout() }}
              placement="bottomRight"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar style={{ background: '#1677ff' }} icon={<UserOutlined />} />
                <Text strong style={{ fontSize: 14 }}>{user?.name ?? 'Admin'}</Text>
              </div>
            </Dropdown>
          </div>
        </Header>

        <EmergencyBanner />
        <Content className="page-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
