import { useState } from 'react'
import { Table, Button, Input, Card, Avatar, Typography } from 'antd'
import { SearchOutlined, UserOutlined } from '@ant-design/icons'

const { Title } = Typography

const data = [
  { key: 1, name: 'Ali Raza', phone: '0300-1234567', email: 'ali@email.com', totalRides: 12, joined: '2026-01-15' },
  { key: 2, name: 'Sara Khan', phone: '0312-9876543', email: 'sara@email.com', totalRides: 8, joined: '2026-02-20' },
  { key: 3, name: 'Umar Farooq', phone: '0321-5556789', email: 'umar@email.com', totalRides: 25, joined: '2025-11-10' },
  { key: 4, name: 'Nadia Ahmed', phone: '0333-1112222', email: 'nadia@email.com', totalRides: 5, joined: '2026-04-01' },
  { key: 5, name: 'Bilal Sheikh', phone: '0345-3334444', email: 'bilal@email.com', totalRides: 19, joined: '2025-09-05' },
]

export default function Customers() {
  const [search, setSearch] = useState('')

  const filtered = data.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) || c.email.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      title: 'Customer', key: 'customer',
      render: (_: unknown, r: typeof data[0]) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar icon={<UserOutlined />} style={{ background: '#722ed1' }} />
          <div>
            <div style={{ fontWeight: 600 }}>{r.name}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{r.email}</div>
          </div>
        </div>
      ),
    },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Total Rides', dataIndex: 'totalRides', key: 'totalRides' },
    { title: 'Joined', dataIndex: 'joined', key: 'joined' },
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>Customers</Title>

      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Input placeholder="Search by name, phone or email..." prefix={<SearchOutlined />} value={search} onChange={e => setSearch(e.target.value)} style={{ width: 320 }} />
      </Card>

      <Card style={{ borderRadius: 12 }}>
        <Table dataSource={filtered} columns={columns} rowKey="key" size="middle" />
      </Card>
    </div>
  )
}
