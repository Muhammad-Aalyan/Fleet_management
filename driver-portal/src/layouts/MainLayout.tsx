import { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Typography } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import {
  DashboardOutlined, CarOutlined, FireOutlined, AimOutlined,
  AlertOutlined, UserOutlined, LogoutOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, WalletOutlined,
} from '@ant-design/icons'
import NotificationBell from '../components/NotificationBell'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/dashboard',     icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/my-rides',      icon: <CarOutlined />,       label: 'My Rides' },
  { key: '/fuel-log',      icon: <FireOutlined />,      label: 'Fuel Log' },
  { key: '/mileage-log',   icon: <AimOutlined />,       label: 'Mileage Log' },
  { key: '/reimbursement', icon: <WalletOutlined />,    label: 'Reimbursement' },
  { key: '/emergency',     icon: <AlertOutlined />,     label: 'Emergency' },
]

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard', '/my-rides': 'My Rides',
  '/fuel-log': 'Fuel Log', '/mileage-log': 'Mileage Log',
  '/emergency': 'Emergency Alert', '/reimbursement': 'Reimbursement Claims',
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
          <div style={{ fontWeight: 600, fontSize: 14, color: '#f9fafb' }}>{user?.name ?? 'Driver'}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{user?.email}</div>
          <div style={{ marginTop: 4 }}>
            <span style={{ background: '#431407', color: '#f97316', fontSize: 11, padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>
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
        collapsible collapsed={collapsed} trigger={null} width={220}
        style={{ position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100, background: '#16162a' }}
      >
        <div className="logo-area">
          <span className="logo-icon">🚐</span>
          {!collapsed && <span className="logo-text">Fleet<span>Driver</span></span>}
        </div>
        <Menu
          theme="dark" mode="inline" selectedKeys={[location.pathname]}
          items={menuItems} onClick={({ key }) => navigate(key)}
          style={{ marginTop: 8, border: 'none', background: '#16162a' }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'all 0.2s' }}>
        <Header className="site-header">
          <div className="header-left">
            <Button type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, color: '#fff' }}
            />
            <span className="page-title">{pageTitles[location.pathname] ?? 'Driver'}</span>
          </div>
          <div className="header-right">
            <NotificationBell />
            <Dropdown
              menu={{ items: userMenuItems, onClick: ({ key }) => key === 'logout' && handleLogout() }}
              placement="bottomRight"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar style={{ background: '#f97316' }} icon={<UserOutlined />} />
                <Text style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{user?.name ?? 'Driver'}</Text>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className="page-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
