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
    const t = n.title.toLowerCase()
    if (t.includes('reimbursement')) navigate('/reimbursement')
    else navigate('/my-rides')
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
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #E7E8EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: '#1a1a2e', fontWeight: 700, fontSize: 15 }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ marginLeft: 8, background: '#E01E2B', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button type="text" size="small" icon={<CheckOutlined />}
            style={{ color: '#E01E2B', fontSize: 12 }} onClick={markAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {/* List */}
      <div style={{ maxHeight: 380, overflowY: 'auto' }}>
        <Spin spinning={loading}>
          {notifications.length === 0 && !loading ? (
            <Empty description="No notifications yet" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '32px 0' }} />
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: n.isRead ? 'transparent' : '#FDEAEB',
                  borderBottom: '1px solid #f3f4f6',
                  borderLeft: n.isRead ? '3px solid transparent' : '3px solid #E01E2B',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FBD5D8')}
                onMouseLeave={e => (e.currentTarget.style.background = n.isRead ? 'transparent' : '#FDEAEB')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: '#1a1a2e', fontWeight: n.isRead ? 400 : 700, fontSize: 13 }}>{n.title}</Text>
                  <Text style={{ color: '#9ca3af', fontSize: 11, whiteSpace: 'nowrap', marginLeft: 8 }}>{timeAgo(n.createdAt)}</Text>
                </div>
                <Text style={{ color: '#6b7280', fontSize: 12, lineHeight: 1.4, display: 'block' }}>{n.message}</Text>
                {!n.isRead && (
                  <Text style={{ color: '#E01E2B', fontSize: 11, fontWeight: 600, marginTop: 4, display: 'block' }}>
                    {n.title.toLowerCase().includes('reimbursement') ? 'Click to view → Reimbursement' : 'Click to view → My Rides'}
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
      overlayInnerStyle={{ padding: '12px 16px', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]} color="#E01E2B">
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 20, color: unreadCount > 0 ? '#E01E2B' : '#6A6D76' }} />}
          shape="circle"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        />
      </Badge>
    </Popover>
  )
}
