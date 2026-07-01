import { useEffect, useState } from 'react'
import { Card, Statistic, Row, Col, Typography, Tag, Button, Modal, Table, Spin, Collapse, Badge } from 'antd'
import { DollarOutlined, CarOutlined, EyeOutlined, DropboxOutlined, CalendarOutlined } from '@ant-design/icons'
import api from '../api/axios'

const { Title, Text } = Typography

interface FuelLog {
  id: number; liters: number; amount: number; currentMileage: number
  receiptPhoto: string | null; receiptViewedAt: string | null; createdAt: string
  driver: { name: string }
}
interface VehicleGroup {
  vehicleId: number; vehicleNumber: string; model: string; fuelType: string
  totalEntries: number; totalLiters: number; totalAmount: number
  lastFuelDate: string | null; logs: FuelLog[]
}

export default function FuelRecords() {
  const [groups, setGroups] = useState<VehicleGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [receiptModal, setReceiptModal] = useState<string | null>(null)
  const [receiptLoading, setReceiptLoading] = useState<number | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/fuel/by-vehicle')
      setGroups(res.data)
    } catch { }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleViewReceipt = async (logId: number) => {
    setReceiptLoading(logId)
    try {
      const res = await api.patch(`/fuel/${logId}/view-receipt`)
      if (!res.data.receiptPhoto) { alert('Receipt not available or already deleted'); return }
      setReceiptModal(res.data.receiptPhoto)
      fetchData()
    } catch { alert('Failed to load receipt') }
    finally { setReceiptLoading(null) }
  }

  const totalAmount = groups.reduce((s, g) => s + Number(g.totalAmount), 0)
  const totalLiters = groups.reduce((s, g) => s + Number(g.totalLiters), 0)
  const avgPerLiter = totalLiters > 0 ? totalAmount / totalLiters : 0

  const logColumns = [
    { title: 'Driver', dataIndex: 'driver', key: 'driver', render: (d: any) => d?.name ?? '—' },
    { title: 'Liters', dataIndex: 'liters', key: 'liters', render: (v: number) => `${v} L` },
    { title: 'Amount (PKR)', dataIndex: 'amount', key: 'amount', render: (v: number) => Number(v).toLocaleString() },
    { title: 'Mileage (km)', dataIndex: 'currentMileage', key: 'mileage', render: (v: number) => Number(v).toLocaleString() },
    {
      title: 'Receipt', key: 'receipt',
      render: (_: any, r: FuelLog) => {
        if (!r.receiptPhoto) return <Tag>No receipt</Tag>
        if (r.receiptViewedAt) {
          const hoursLeft = Math.max(0, Math.round(
            (new Date(r.receiptViewedAt).getTime() + 86400000 - Date.now()) / 3600000
          ))
          return <Tag color="orange">Viewed · {hoursLeft}h left</Tag>
        }
        return (
          <Button size="small" type="primary" icon={<EyeOutlined />}
            loading={receiptLoading === r.id}
            onClick={() => handleViewReceipt(r.id)}
            style={{ background: '#1677ff', borderColor: '#1677ff' }}>
            View Receipt
          </Button>
        )
      },
    },
    {
      title: 'Date', dataIndex: 'createdAt', key: 'date',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
  ]

  const collapseItems = groups.map((g) => ({
    key: String(g.vehicleId),
    label: (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: 'linear-gradient(135deg, #1677ff22, #1677ff44)',
            border: '1.5px solid #1677ff55',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CarOutlined style={{ color: '#1677ff', fontSize: 18 }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{g.vehicleNumber}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{g.model} · <Tag style={{ fontSize: 11, margin: 0 }}>{g.fuelType}</Tag></div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>Entries</div>
            <Badge count={g.totalEntries} style={{ background: '#6b7280' }} showZero />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>Total Liters</div>
            <div style={{ fontWeight: 700, color: '#1677ff', fontSize: 14 }}>{Number(g.totalLiters).toFixed(1)} L</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>Total Cost</div>
            <div style={{ fontWeight: 700, color: '#fa541c', fontSize: 14 }}>PKR {Number(g.totalAmount).toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>Last Fill</div>
            <div style={{ fontSize: 12, color: '#374151', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CalendarOutlined style={{ fontSize: 11 }} />
              {g.lastFuelDate ? new Date(g.lastFuelDate).toLocaleDateString() : '—'}
            </div>
          </div>
        </div>
      </div>
    ),
    children: (
      <Table
        dataSource={g.logs}
        columns={logColumns}
        rowKey="id"
        size="small"
        pagination={g.logs.length > 10 ? { pageSize: 10 } : false}
        locale={{ emptyText: 'No fuel entries for this vehicle yet' }}
      />
    ),
  }))

  return (
    <Spin spinning={loading}>
      <Title level={4} style={{ marginBottom: 24 }}>Fuel Records</Title>

      {/* Summary cards */}
      <Row gutter={16} style={{ marginBottom: 28 }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Total Fuel Cost (PKR)" value={totalAmount.toLocaleString()}
              prefix={<DollarOutlined />} valueStyle={{ color: '#fa541c' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Total Liters Filled" value={`${totalLiters.toFixed(1)} L`}
              prefix={<DropboxOutlined />} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Avg Cost / Liter (PKR)" value={avgPerLiter.toFixed(0)}
              valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      {/* Per-vehicle accordion */}
      {groups.length === 0 && !loading ? (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: 40 }}>
          <Text type="secondary">No fuel records found</Text>
        </Card>
      ) : (
        <Collapse
          accordion={false}
          items={collapseItems}
          style={{ borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff' }}
          expandIconPosition="end"
        />
      )}

      {/* Receipt Modal */}
      <Modal
        title={<span><EyeOutlined style={{ marginRight: 8, color: '#1677ff' }} />Fuel Receipt</span>}
        open={!!receiptModal}
        onCancel={() => setReceiptModal(null)}
        footer={<Text type="secondary" style={{ fontSize: 12 }}>Receipt auto-deletes 24 hours after first view</Text>}
        centered width={500}
      >
        {receiptModal && (
          <img src={receiptModal} alt="fuel receipt"
            style={{ width: '100%', borderRadius: 8, border: '1px solid #f0f0f0' }} />
        )}
      </Modal>
    </Spin>
  )
}
