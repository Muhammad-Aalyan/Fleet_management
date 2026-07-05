import { useEffect, useState } from 'react'
import { Table, Card, Spin } from 'antd'
import api from '../api/axios'
import RdBadge from '../components/Badge'

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
    { title: 'Driver',   dataIndex: 'driverName',   key: 'driver',  render: (v: string) => v ? <span className="rd-name-pill">{v}</span> : '—' },
    { title: 'Vehicle',  dataIndex: 'vehicleNumber', key: 'vehicle', render: (v: string) => v ?? '—' },
    { title: 'Pickup',   dataIndex: 'pickupLocation', key: 'pickup' },
    { title: 'Drop',     dataIndex: 'dropLocation',   key: 'drop' },
    { title: 'Scheduled', dataIndex: 'scheduledDate', key: 'date',
      render: (v: string, r: any) => `${new Date(v).toLocaleDateString()} ${r.scheduledTime}` },
    { title: 'Pax', dataIndex: 'passengers', key: 'pax' },
    { title: 'Status', dataIndex: 'status', key: 'status',
      render: (s: string) => <RdBadge status={s} label={s.replace('_', ' ')} />,
    },
  ]

  return (
    <div>
      <div className="rd-page-title">Active Rides</div>
      <Card>
        <Spin spinning={loading}>
          {data.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--rd-ink-faint)' }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>🏁</div>
              No active rides right now
            </div>
          ) : (
            <Table dataSource={data} columns={columns} rowKey="id" pagination={{ pageSize: 20 }} size="middle" scroll={{ x: 'max-content' }} />
          )}
        </Spin>
      </Card>
    </div>
  )
}
