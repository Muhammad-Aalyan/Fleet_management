import { useEffect, useState } from 'react'
import { Modal, Table, Spin, Button, Typography } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import api from '../api/axios'
import { IconVehicle, IconDollar, IconFuel, IconCheck } from '../components/icons'

const { Text } = Typography

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
    { title: 'Amount (PKR)', dataIndex: 'amount', key: 'amount', className: 'rd-amount-red', render: (v: number) => Number(v).toLocaleString() },
    { title: 'Mileage (km)', dataIndex: 'currentMileage', key: 'mileage', render: (v: number) => Number(v).toLocaleString() },
    {
      title: 'Receipt', key: 'receipt',
      render: (_: any, r: FuelLog) => {
        if (!r.receiptPhoto) return <span className="rd-badge rd-b-pending">No receipt</span>
        if (r.receiptViewedAt) {
          const hoursLeft = Math.max(0, Math.round(
            (new Date(r.receiptViewedAt).getTime() + 86400000 - Date.now()) / 3600000
          ))
          return <span className="rd-badge rd-b-maintenance">Viewed · {hoursLeft}h left</span>
        }
        return (
          <Button size="small" type="primary" icon={<EyeOutlined />}
            loading={receiptLoading === r.id}
            onClick={() => handleViewReceipt(r.id)}>
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

  return (
    <Spin spinning={loading}>
      <div className="rd-page-title">Fuel Records</div>

      <div className="rd-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="rd-stat">
          <div className="top">
            <span className="label">Total Fuel Cost (PKR)</span>
            <div className="icon rd-ic-red"><IconDollar /></div>
          </div>
          <div className="value">{totalAmount.toLocaleString()}</div>
        </div>
        <div className="rd-stat">
          <div className="top">
            <span className="label">Total Liters Filled</span>
            <div className="icon rd-ic-blue"><IconFuel /></div>
          </div>
          <div className="value">{totalLiters.toFixed(1)} L</div>
        </div>
        <div className="rd-stat">
          <div className="top">
            <span className="label">Avg Cost / Liter (PKR)</span>
            <div className="icon rd-ic-good"><IconCheck /></div>
          </div>
          <div className="value">{avgPerLiter.toFixed(0)}</div>
        </div>
      </div>

      {groups.length === 0 && !loading ? (
        <div className="rd-panel" style={{ textAlign: 'center', padding: 40 }}>
          <Text type="secondary">No fuel records found</Text>
        </div>
      ) : (
        groups.map((g) => (
          <div className="rd-fuel-group" key={g.vehicleId}>
            <div className="rd-fuel-group-head">
              <div className="veh">
                <div className="rd-fuel-icon"><IconVehicle /></div>
                <div>
                  <div className="veh-name">{g.vehicleNumber}</div>
                  <div className="veh-model">{g.model} · {g.fuelType}</div>
                </div>
              </div>
              <div className="rd-fuel-meta">
                <div><div className="m-label">Entries</div><div className="m-value">{g.totalEntries}</div></div>
                <div><div className="m-label">Total Liters</div><div className="m-value blue">{Number(g.totalLiters).toFixed(1)} L</div></div>
                <div><div className="m-label">Total Cost</div><div className="m-value red">PKR {Number(g.totalAmount).toLocaleString()}</div></div>
                <div><div className="m-label">Last Fill</div><div className="m-value">{g.lastFuelDate ? new Date(g.lastFuelDate).toLocaleDateString() : '—'}</div></div>
              </div>
            </div>
            {g.logs.length === 0 ? (
              <div className="rd-empty-note">No fuel entries for this vehicle yet</div>
            ) : (
              <Table dataSource={g.logs} columns={logColumns} rowKey="id" size="small"
                pagination={g.logs.length > 10 ? { pageSize: 10 } : false} scroll={{ x: 'max-content' }} />
            )}
          </div>
        ))
      )}

      {/* Receipt Modal */}
      <Modal
        title={<span><EyeOutlined style={{ marginRight: 8, color: '#E01E2B' }} />Fuel Receipt</span>}
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
