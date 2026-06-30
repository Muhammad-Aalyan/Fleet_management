import { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Typography } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import {
  HomeOutlined, PlusCircleOutlined, CarOutlined, HistoryOutlined,
  UserOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
} from '@ant-design/icons'
import NotificationBell from '../components/NotificationBell'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/home', icon: <HomeOutlined />, label: 'Home' },
  { key: '/request-ride', icon: <PlusCircleOutlined />, label: 'Request a Ride' },
  { key: '/my-rides', icon: <CarOutlined />, label: 'My Rides' },
  { key: '/history', icon: <HistoryOutlined />, label: 'Ride History' },
]

const pageTitles: Record<string, string> = {
  '/home': 'Home', '/request-ride': 'Request a Ride',
  '/my-rides': 'My Rides', '/history': 'Ride History',
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
          <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name ?? 'Customer'}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{user?.email}</div>
          <div style={{ marginTop: 4 }}>
            <span style={{ background: '#f5f3ff', color: '#7c3aed', fontSize: 11, padding: '1px 8px', borderRadius: 10, fontWeight: 600 }}>
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
        style={{ position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100, background: '#fff', borderRight: '1px solid #ede9fe' }}
      >
        <div className="logo-area">
          <span className="logo-icon">🚖</span>
          {!collapsed && <span className="logo-text">Fleet<span>Ride</span></span>}
        </div>
        <Menu
          mode="inline" selectedKeys={[location.pathname]}
          items={menuItems} onClick={({ key }) => navigate(key)}
          style={{ marginTop: 8, border: 'none', background: '#fff' }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'all 0.2s' }}>
        <Header className="site-header">
          <div className="header-left">
            <Button type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)} style={{ fontSize: 16 }}
            />
            <span className="page-title">{pageTitles[location.pathname] ?? 'Customer'}</span>
          </div>
          <div className="header-right">
            <NotificationBell />
            <Dropdown
              menu={{ items: userMenuItems, onClick: ({ key }) => key === 'logout' && handleLogout() }}
              placement="bottomRight"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar style={{ background: '#7c3aed' }} icon={<UserOutlined />} />
                <Text strong style={{ fontSize: 14 }}>{user?.name ?? 'Customer'}</Text>
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
