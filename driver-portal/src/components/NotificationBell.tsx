import { useEffect, useState, useCallback } from 'react'
import { Badge, Button, Popover, Empty, Spin, Typography } from 'antd'
import { BellOutlined, CheckOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const { Text } = Typography

interface Notification {
  id: number
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/rides/notifications')
      setNotifications(res.data)
    } catch { /* silently fail */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const markRead = async (id: number) => {
    try {
      await api.patch(`/rides/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch { /* silently fail */ }
  }

  const markAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.patch('/rides/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch { /* silently fail */ }
  }

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead) await markRead(n.id)
    setOpen(false)
    navigate('/my-rides')
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const content = (
    <div style={{ width: 340, margin: '-12px -16px' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #2a2a3f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: '#f9fafb', fontWeight: 700, fontSize: 15 }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ marginLeft: 8, background: '#f97316', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button type="text" size="small" icon={<CheckOutlined />}
            style={{ color: '#f97316', fontSize: 12 }} onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        <Spin spinning={loading}>
          {notifications.length === 0 && !loading ? (
            <Empty description={<span style={{ color: '#6b7280' }}>No notifications yet</span>}
              image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '32px 0' }} />
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: n.isRead ? 'transparent' : 'rgba(249,115,22,0.08)',
                  borderBottom: '1px solid #2a2a3f',
                  borderLeft: n.isRead ? '3px solid transparent' : '3px solid #f97316',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(249,115,22,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(249,115,22,0.08)')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: '#f9fafb', fontWeight: n.isRead ? 400 : 700, fontSize: 13 }}>{n.title}</Text>
                  <Text style={{ color: '#6b7280', fontSize: 11, whiteSpace: 'nowrap', marginLeft: 8 }}>{timeAgo(n.createdAt)}</Text>
                </div>
                <Text style={{ color: '#9ca3af', fontSize: 12, lineHeight: 1.4, display: 'block' }}>{n.message}</Text>
                {!n.isRead && (
                  <Text style={{ color: '#f97316', fontSize: 11, fontWeight: 600, marginTop: 4, display: 'block' }}>
                    Click to view → My Rides
                  </Text>
                )}
              </div>
            ))
          )}
        </Spin>
      </div>
    </div>
  )

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={(v) => { setOpen(v); if (v) fetchNotifications() }}
      overlayStyle={{ padding: 0 }}
      overlayInnerStyle={{ padding: '12px 16px', borderRadius: 12, overflow: 'hidden', background: '#1e1e2e', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 20, color: unreadCount > 0 ? '#f97316' : '#fff' }} />}
          shape="circle"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        />
      </Badge>
    </Popover>
  )
}
