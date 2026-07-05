import { useEffect, useState } from 'react'
import { Table, Input, Card, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import api from '../api/axios'
import RdBadge from '../components/Badge'

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
          <div className="rd-avatar" style={{ width: 32, height: 32, fontSize: 12, background: 'linear-gradient(135deg,#4A4D57,#22232A)' }}>
            {r.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="rd-cell-strong">{r.name}</div>
            <div className="rd-cell-sub">{r.email}</div>
          </div>
        </div>
      ),
    },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Total Rides', dataIndex: 'totalRides', key: 'total', render: (v: number) => v ?? 0 },
    { title: 'Completed',   dataIndex: 'completedRides', key: 'completed', render: (v: number) => <RdBadge status="COMPLETED" label={String(v ?? 0)} /> },
    { title: 'Active',      dataIndex: 'activeRides',    key: 'active',    render: (v: number) => <RdBadge status="APPROVED" label={String(v ?? 0)} /> },
    { title: 'Cancelled',   dataIndex: 'cancelledRides', key: 'cancelled', render: (v: number) => <RdBadge status="CANCELLED" label={String(v ?? 0)} /> },
    {
      title: 'Status', dataIndex: 'isActive', key: 'status',
      render: (v: boolean) => <RdBadge status={v ? 'AVAILABLE' : 'INACTIVE'} label={v ? 'Active' : 'Inactive'} />,
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
      <div className="rd-row-between">
        <div className="rd-page-title" style={{ margin: 0 }}>Customers</div>
      </div>
      <Card style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search by name, phone or email"
          prefix={<SearchOutlined />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 280 }}
        />
      </Card>
      <Card>
        <Spin spinning={loading}>
          <Table dataSource={data} columns={columns} rowKey="id" pagination={{ pageSize: 20 }} scroll={{ x: 'max-content' }} />
        </Spin>
      </Card>
    </div>
  )
}
