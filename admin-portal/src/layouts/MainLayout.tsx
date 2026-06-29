import { useState } from 'react'
import { Layout, Menu, Avatar, Badge, Dropdown, Button, Typography } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  CarOutlined,
  TeamOutlined,
  UserOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DollarOutlined,
} from '@ant-design/icons'

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
  '/dashboard': 'Dashboard',
  '/ride-requests': 'Ride Requests',
  '/active-rides': 'Active Rides',
  '/drivers': 'Drivers',
  '/vehicles': 'Vehicles',
  '/customers': 'Customers',
  '/fuel-records': 'Fuel Records',
  '/reports': 'Reports',
}

const userMenuItems = [
  { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
  { type: 'divider' as const },
  { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
]

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={240}
        style={{ position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100 }}
      >
        <div className="logo-area">
          <span className="logo-icon">🚗</span>
          {!collapsed && (
            <span className="logo-text">Fleet<span>Admin</span></span>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: 8, border: 'none' }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'all 0.2s' }}>
        <Header className="site-header">
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
            <span className="page-title">{pageTitles[location.pathname] ?? 'Admin'}</span>
          </div>
          <div className="header-right">
            <Badge count={3}>
              <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} shape="circle" />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar style={{ background: '#1677ff' }} icon={<UserOutlined />} />
                <Text strong style={{ fontSize: 14 }}>Admin</Text>
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
