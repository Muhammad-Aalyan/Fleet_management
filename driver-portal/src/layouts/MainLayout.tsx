import { useState } from 'react'
import { Layout, Menu, Avatar, Badge, Button, Typography } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined, CarOutlined, FireOutlined, AimOutlined,
  AlertOutlined, BellOutlined, UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
} from '@ant-design/icons'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/my-rides', icon: <CarOutlined />, label: 'My Rides' },
  { key: '/fuel-log', icon: <FireOutlined />, label: 'Fuel Log' },
  { key: '/mileage-log', icon: <AimOutlined />, label: 'Mileage Log' },
  { key: '/emergency', icon: <AlertOutlined />, label: 'Emergency' },
]

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/my-rides': 'My Rides',
  '/fuel-log': 'Fuel Log',
  '/mileage-log': 'Mileage Log',
  '/emergency': 'Emergency Alert',
}

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
        width={220}
        style={{ position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100, background: '#16162a' }}
      >
        <div className="logo-area">
          <span className="logo-icon">🚐</span>
          {!collapsed && <span className="logo-text">Fleet<span>Driver</span></span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: 8, border: 'none', background: '#16162a' }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'all 0.2s' }}>
        <Header className="site-header">
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16, color: '#fff' }}
            />
            <span className="page-title">{pageTitles[location.pathname] ?? 'Driver'}</span>
          </div>
          <div className="header-right">
            <Badge dot>
              <Button type="text" icon={<BellOutlined style={{ fontSize: 18, color: '#fff' }} />} shape="circle" />
            </Badge>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar style={{ background: '#f97316' }} icon={<UserOutlined />} />
              <Text style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>Ahmed Khan</Text>
            </div>
          </div>
        </Header>

        <Content className="page-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
