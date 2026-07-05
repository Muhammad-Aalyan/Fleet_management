import { useEffect, useState, useCallback } from 'react'
import { Button, Tag, Typography, message } from 'antd'
import { AlertOutlined, CloseOutlined, CheckOutlined, CarOutlined } from '@ant-design/icons'
import api from '../api/axios'

const { Text } = Typography

interface Alert {
  id: number
  reason: string
  description?: string
  createdAt: string
  driver: { name: string; phone: string; vehicle: { vehicleNumber: string } | null }
}

const reasonLabels: Record<string, string> = {
  FLAT_TIRE: 'Flat Tire', ACCIDENT: 'Accident',
  TRAFFIC: 'Heavy Traffic', BREAKDOWN: 'Vehicle Breakdown', OTHER: 'Other',
}

export default function EmergencyBanner() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.get('/alerts/unresolved')
      setAlerts(res.data)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000) // poll every 30s
    return () => clearInterval(interval)
  }, [fetchAlerts])

  const handleResolve = async (id: number) => {
    try {
      await api.patch(`/alerts/${id}/resolve`)
      setAlerts(prev => prev.filter(a => a.id !== id))
      message.success('Alert marked as resolved')
    } catch { message.error('Failed to resolve alert') }
  }

  const visible = alerts.filter(a => !dismissed.has(a.id))
  if (visible.length === 0) return null

  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 200 }}>
      {visible.map((alert) => (
        <div key={alert.id} style={{
          background: 'linear-gradient(90deg, #6B0F16, #A3141D)',
          borderBottom: '2px solid #E01E2B',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          animation: 'pulse 2s infinite',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <AlertOutlined style={{ color: '#fca5a5', fontSize: 16 }} />
            </div>
            <div>
              <Text strong style={{ color: '#fff', fontSize: 14 }}>
                🚨 Emergency Alert — {alert.driver?.name}
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                <Tag color="red" style={{ margin: 0 }}>{reasonLabels[alert.reason] ?? alert.reason}</Tag>
                {alert.driver?.vehicle && (
                  <Text style={{ color: '#fca5a5', fontSize: 12 }}>
                    <CarOutlined style={{ marginRight: 4 }} />{alert.driver.vehicle.vehicleNumber}
                  </Text>
                )}
                <Text style={{ color: '#fca5a5', fontSize: 12 }}>{alert.driver?.phone}</Text>
                {alert.description && (
                  <Text style={{ color: '#fcd5d5', fontSize: 12 }}>· "{alert.description}"</Text>
                )}
                <Text style={{ color: '#f87171', fontSize: 11 }}>
                  {new Date(alert.createdAt).toLocaleTimeString()}
                </Text>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Button size="small" icon={<CheckOutlined />}
              style={{ background: '#16a34a', border: 'none', color: '#fff', fontSize: 12 }}
              onClick={() => handleResolve(alert.id)}>
              Resolve
            </Button>
            <Button size="small" icon={<CloseOutlined />}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }}
              onClick={() => setDismissed(prev => new Set([...prev, alert.id]))}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
