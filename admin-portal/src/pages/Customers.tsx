import { useEffect, useState } from 'react'
import { Table, Input, Card, Avatar, Typography, Tag, Spin } from 'antd'
import { SearchOutlined, UserOutlined } from '@ant-design/icons'
import api from '../api/axios'

const { Title } = Typography

export default function Customers() {
  const [raw, setRaw] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/customers')
      .then(r => setRaw(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const data = raw.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      title: 'Customer', key: 'customer',
      render: (_: unknown, r: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar icon={<UserOutlined />} style={{ background: '#722ed1' }} />
          <div>
            <div style={{ fontWeight: 600 }}>{r.name}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{r.email}</div>
          </div>
        </div>
      ),
    },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Total Rides', dataIndex: 'totalRides', key: 'total', render: (v: number) => v ?? 0 },
    { title: 'Completed',   dataIndex: 'completedRides', key: 'completed', render: (v: number) => <Tag color="green">{v ?? 0}</Tag> },
    { title: 'Active',      dataIndex: 'activeRides',    key: 'active',    render: (v: number) => v > 0 ? <Tag color="blue">{v}</Tag> : <Tag>{v ?? 0}</Tag> },
    { title: 'Cancelled',   dataIndex: 'cancelledRides', key: 'cancelled', render: (v: number) => v > 0 ? <Tag color="red">{v}</Tag> : <Tag>{v ?? 0}</Tag> },
    {
      title: 'Status', dataIndex: 'isActive', key: 'status',
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag>,
    },
    {
      title: 'Joined', dataIndex: 'joinedAt', key: 'joined',
      render: (v: string) => v ? new Date(v).toLocaleDateString() : '—',
    },
    {
      title: 'Last Ride', dataIndex: 'lastRideAt', key: 'lastRide',
      render: (v: string) => v ? new Date(v).toLocaleDateString() : '—',
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Customers</Title>
        <Input
          placeholder="Search by name, phone or email"
          prefix={<SearchOutlined />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 280 }}
        />
      </div>
      <Card style={{ borderRadius: 12 }}>
        <Spin spinning={loading}>
          <Table dataSource={data} columns={columns} rowKey="id" pagination={{ pageSize: 20 }} />
        </Spin>
      </Card>
    </div>
  )
}
