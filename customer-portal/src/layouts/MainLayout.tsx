import { useState } from 'react'
import { Layout, Menu, Avatar, Badge, Button, Typography } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  HomeOutlined, PlusCircleOutlined, CarOutlined, HistoryOutlined,
  BellOutlined, UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
} from '@ant-design/icons'

const { Sider, Header, Content } = Layout
const { Text } = Typography

const menuItems = [
  { key: '/home', icon: <HomeOutlined />, label: 'Home' },
  { key: '/request-ride', icon: <PlusCircleOutlined />, label: 'Request a Ride' },
  { key: '/my-rides', icon: <CarOutlined />, label: 'My Rides' },
  { key: '/history', icon: <HistoryOutlined />, label: 'Ride History' },
]

const pageTitles: Record<string, string> = {
  '/home': 'Home',
  '/request-ride': 'Request a Ride',
  '/my-rides': 'My Rides',
  '/history': 'Ride History',
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
        style={{ position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 100, background: '#fff', borderRight: '1px solid #ede9fe' }}
      >
        <div className="logo-area">
          <span className="logo-icon">🚖</span>
          {!collapsed && <span className="logo-text">Fleet<span>Ride</span></span>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: 8, border: 'none', background: '#fff' }}
        />
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 220, transition: 'all 0.2s' }}>
        <Header className="site-header">
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            />
            <span className="page-title">{pageTitles[location.pathname] ?? 'Customer'}</span>
          </div>
          <div className="header-right">
            <Badge count={1}>
              <Button type="text" icon={<BellOutlined style={{ fontSize: 18 }} />} shape="circle" />
            </Badge>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar style={{ background: '#7c3aed' }} icon={<UserOutlined />} />
              <Text strong style={{ fontSize: 14 }}>Ali Raza</Text>
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
