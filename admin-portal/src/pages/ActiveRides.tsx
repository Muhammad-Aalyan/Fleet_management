import { useEffect, useState } from 'react'
import { Table, Tag, Card, Badge, Typography, Spin } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import api from '../api/axios'

const { Title } = Typography

export default function ActiveRides() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/active-rides')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const columns = [
    { title: 'Customer', dataIndex: 'customerName', key: 'customer' },
    { title: 'Driver',   dataIndex: 'driverName',   key: 'driver',  render: (v: string) => v ?? '—' },
    { title: 'Vehicle',  dataIndex: 'vehicleNumber', key: 'vehicle', render: (v: string) => v ?? '—' },
    { title: 'Pickup',   dataIndex: 'pickupLocation', key: 'pickup' },
    { title: 'Drop',     dataIndex: 'dropLocation',   key: 'drop' },
    { title: 'Scheduled', dataIndex: 'scheduledDate', key: 'date',
      render: (v: string, r: any) => `${new Date(v).toLocaleDateString()} ${r.scheduledTime}` },
    { title: 'Pax', dataIndex: 'passengers', key: 'pax' },
    { title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => (
        <Tag color={s === 'IN_PROGRESS' ? 'processing' : 'purple'} icon={<ThunderboltOutlined />}>
          {s.replace('_', ' ')}
        </Tag>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Active Rides</Title>
        <Badge count={data.length} style={{ background: '#f97316' }} />
      </div>
      <Card style={{ borderRadius: 12 }}>
        <Spin spinning={loading}>
          <Table dataSource={data} columns={columns} rowKey="id" pagination={{ pageSize: 20 }} size="middle" />
        </Spin>
      </Card>
    </div>
  )
}
