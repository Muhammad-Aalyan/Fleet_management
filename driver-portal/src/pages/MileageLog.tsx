import { Table, Card, Typography, message, Spin, Tag } from 'antd'
import { useEffect, useState, useCallback } from 'react'
import { ArrowRightOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import api from '../api/axios'

const { Title, Text } = Typography

interface MileageEntry {
  id: number
  startMileage: number
  endMileage: number
  createdAt: string
  pickupLocation?: string
  dropLocation?: string
  scheduledDate?: string
  customers?: { name: string; passengers: number }[]
}

export default function MileageLog() {
  const [data, setData] = useState<MileageEntry[]>([])
  const [loading, setLoading] = useState(false)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/mileage/my')
      setData(res.data)
    } catch { message.error('Failed to load mileage logs') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const columns = [
    {
      title: 'Route',
      key: 'route',
      render: (_: any, r: MileageEntry) => r.pickupLocation ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <strong>{r.pickupLocation}</strong>
          <ArrowRightOutlined style={{ color: '#f97316', fontSize: 11 }} />
          <strong>{r.dropLocation}</strong>
        </span>
      ) : <Text type="secondary">—</Text>,
    },
    {
      title: 'Customer(s)',
      key: 'customers',
      render: (_: any, r: MileageEntry) => {
        if (!r.customers || r.customers.length === 0) return <Text type="secondary">—</Text>
        const shared = r.customers.length > 1
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {shared && <Tag color="orange" icon={<TeamOutlined />} style={{ marginBottom: 4, width: 'fit-content' }}>Shared Ride</Tag>}
            {r.customers.map((c, i) => (
              <span key={i} style={{ fontSize: 13 }}>
                <UserOutlined style={{ marginRight: 4, color: '#9ca3af' }} />
                {c.name} <Text type="secondary">({c.passengers} pax)</Text>
              </span>
            ))}
          </div>
        )
      },
    },
    {
      title: 'Start (km)',
      dataIndex: 'startMileage',
      key: 'start',
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: 'End (km)',
      dataIndex: 'endMileage',
      key: 'end',
      render: (v: number, r: MileageEntry) => v === r.startMileage
        ? <Text type="secondary">Pending</Text>
        : v.toLocaleString(),
    },
    {
      title: 'Distance',
      key: 'distance',
      render: (_: any, r: MileageEntry) => {
        const d = r.endMileage - r.startMileage
        return d > 0 ? <Tag color="green">{d.toLocaleString()} km</Tag> : <Text type="secondary">—</Text>
      },
    },
    {
      title: 'Date',
      key: 'date',
      render: (_: any, r: MileageEntry) => new Date(r.createdAt).toLocaleDateString(),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: '#fff', margin: 0 }}>Mileage Log</Title>
        <Text style={{ color: '#6b7280', fontSize: 13 }}>Auto-filled from ride accept & complete events</Text>
      </div>

      <Spin spinning={loading}>
        <Card style={{ borderRadius: 12, border: '1px solid #2a2a3f', background: '#1e1e2e' }}>
          <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            size="middle"
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'No mileage entries yet. Accept a ride to start logging.' }}
          />
        </Card>
      </Spin>
    </div>
  )
}
