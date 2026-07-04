import { useEffect, useState, useCallback } from 'react'
import { Select } from 'antd'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import ReportShell from '../components/ReportShell'
import StatCard from '../components/StatCard'
import HBarChart from '../components/HBarChart'
import ReportTable from '../components/ReportTable'
import { R } from '../utils/reportTheme'
import { exportPDF, exportExcel } from '../utils/pdfExport'

interface FuelRow { id: number; driverName: string; vehicleNumber: string; vehicleModel: string; fuelType: string; liters: number; amount: number; currentMileage: number; date: string }
interface DriverSummary { driverName: string; totalLiters: number; totalAmount: number; entries: number }
interface Totals { totalLiters: number; totalAmount: number; totalEntries: number; avgCostPerLiter: string }

const FUEL_BG: Record<string, string> = { PETROL: '#FEF3E9', DIESEL: '#EFF6FF', CNG: '#ECFDF5', HYBRID: '#F5F3FF', ELECTRIC: '#ECFEFF' }
const FUEL_FG: Record<string, string> = { PETROL: '#B4560A', DIESEL: '#1E40AF', CNG: '#065F46', HYBRID: '#5B21B6', ELECTRIC: '#155E75' }
const FTag = ({ v }: { v: string }) => (
  <span style={{ display: 'inline-block', background: FUEL_BG[v] ?? '#F3F4F6', color: FUEL_FG[v] ?? R.inkSoft, padding: '3px 9px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{v}</span>
)

export default function FuelReport() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<FuelRow[]>([])
  const [byDriver, setByDriver] = useState<DriverSummary[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [search, setSearch] = useState('')
  const [driverFilter, setDriverFilter] = useState('ALL')
  const [fuelFilter, setFuelFilter] = useState('ALL')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/fuel')
      setTotals(res.data.totals); setRows(res.data.rows); setByDriver(res.data.byDriver)
    } catch { /* handled */ } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchData() }, [fetchData])

  const drivers = [...new Set(rows.map(r => r.driverName))]
  const fuelTypes = [...new Set(rows.map(r => r.fuelType))]
  const filtered = rows.filter(r =>
    (!search || r.driverName.toLowerCase().includes(search.toLowerCase()) || r.vehicleNumber.toLowerCase().includes(search.toLowerCase()))
    && (driverFilter === 'ALL' || r.driverName === driverFilter)
    && (fuelFilter === 'ALL' || r.fuelType === fuelFilter)
  )

  const driverAmountItems = [...byDriver].sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 8).map(d => ({ label: d.driverName, value: Math.round(d.totalAmount), suffix: ' PKR' }))
  const driverLiterItems = [...byDriver].sort((a, b) => b.totalLiters - a.totalLiters).slice(0, 8).map(d => ({ label: d.driverName, value: +d.totalLiters.toFixed(1), suffix: ' L' }))

  const summaryCards = totals ? [
    { label: 'Total Liters', value: `${totals.totalLiters.toFixed(1)} L` },
    { label: 'Total Spent', value: `PKR ${totals.totalAmount.toLocaleString()}`, highlight: true },
    { label: 'Total Entries', value: totals.totalEntries },
    { label: 'Avg Cost / Liter', value: `PKR ${totals.avgCostPerLiter}` },
  ] : undefined

  const handlePDF = async () => await exportPDF({
    title: 'Fuel Report',
    subtitle: 'Driver fuel consumption, costs, and mileage tracking',
    sectionLabel: 'Fuel Log Entries',
    orientation: 'landscape',
    adminName: user?.name ?? 'Admin',
    recordCount: filtered.length,
    head: ['Driver', 'Vehicle', 'Model', 'Fuel Type', 'Liters', 'Amount (PKR)', 'Mileage (km)', 'Date'],
    body: filtered.map(r => [r.driverName, r.vehicleNumber, r.vehicleModel, r.fuelType, r.liters.toFixed(1), r.amount.toLocaleString(), r.currentMileage.toLocaleString(), new Date(r.date).toLocaleDateString()]),
    fileName: 'fuel-report',
    summaryCards,
  })

  const handleExcel = () => exportExcel('fuel-report', 'Fuel', filtered.map(r => ({
    Driver: r.driverName, Vehicle: r.vehicleNumber, Model: r.vehicleModel,
    'Fuel Type': r.fuelType, 'Liters (L)': r.liters, 'Amount (PKR)': r.amount,
    'Mileage (km)': r.currentMileage, Date: new Date(r.date).toLocaleDateString(),
  })), {
    title: 'Fuel Report',
    subtitle: 'Driver fuel consumption, costs, and mileage tracking',
    sectionLabel: 'Fuel Log Entries',
    adminName: user?.name ?? 'Admin',
    recordCount: filtered.length,
    summaryCards,
  })

  const columns = [
    { title: 'Driver', dataIndex: 'driverName', key: 'driver', render: (v: string) => <span style={{ fontWeight: 600, color: R.ink }}>{v}</span> },
    { title: 'Vehicle', key: 'vehicle', render: (_: any, r: FuelRow) => <div><div style={{ fontWeight: 600, color: R.ink }}>{r.vehicleNumber}</div><div style={{ fontSize: 12, color: R.inkFaint }}>{r.vehicleModel}</div></div> },
    { title: 'Fuel', dataIndex: 'fuelType', key: 'fuel', render: (v: string) => <FTag v={v} /> },
    { title: 'Liters', dataIndex: 'liters', key: 'liters', render: (v: number) => <span style={{ fontWeight: 600, color: R.accent }}>{v.toFixed(1)} L</span> },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => <span style={{ fontWeight: 700, color: R.good }}>PKR {v.toLocaleString()}</span> },
    { title: 'Mileage', dataIndex: 'currentMileage', key: 'mileage', render: (v: number) => <span style={{ color: R.inkSoft }}>{v.toLocaleString()} km</span> },
    { title: 'Date', dataIndex: 'date', key: 'date', render: (v: string) => <span style={{ color: R.inkSoft }}>{new Date(v).toLocaleDateString()}</span> },
  ]

  return (
    <ReportShell
      title="Fuel Report"
      subtitle="Driver fuel consumption, costs, and mileage tracking"
      loading={loading}
      recordCount={filtered.length}
      adminName={user?.name ?? 'Admin'}
      onExcel={handleExcel}
      onPdf={handlePDF}
      filterBar={
        <>
          <Select value={driverFilter} onChange={setDriverFilter} style={{ width: 150 }} size="small" options={[{ value: 'ALL', label: 'All drivers' }, ...drivers.map(d => ({ value: d, label: d }))]} />
          <Select value={fuelFilter} onChange={setFuelFilter} style={{ width: 140 }} size="small" options={[{ value: 'ALL', label: 'All fuel types' }, ...fuelTypes.map(f => ({ value: f, label: f }))]} />
          <div style={{ flex: 1 }} />
          <span style={{ color: R.inkSoft, fontSize: 13 }}>{filtered.length} entries</span>
        </>
      }
    >
      {totals && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          <StatCard label="Total Liters" value={`${totals.totalLiters.toFixed(1)} L`} sub={`${totals.totalEntries} fill-ups`} />
          <StatCard label="Total Spent" value={`PKR ${totals.totalAmount.toLocaleString()}`} sub="fuel cost" highlight />
          <StatCard label="Total Entries" value={totals.totalEntries} sub="logged fill-ups" />
          <StatCard label="Avg Cost / Liter" value={`PKR ${totals.avgCostPerLiter}`} sub="fleet average" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: R.radius, padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: R.ink, marginBottom: 2 }}>Fuel Spend by Driver</div>
          <div style={{ fontSize: 12.5, color: R.inkFaint, marginBottom: 16 }}>PKR spent, all time</div>
          {driverAmountItems.length > 0 ? <HBarChart items={driverAmountItems} /> : <div style={{ fontSize: 12.5, color: R.inkFaint, fontStyle: 'italic' }}>No fuel records yet.</div>}
        </div>
        <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: R.radius, padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: R.ink, marginBottom: 2 }}>Liters Consumed by Driver</div>
          <div style={{ fontSize: 12.5, color: R.inkFaint, marginBottom: 16 }}>Total liters, all time</div>
          {driverLiterItems.length > 0 ? <HBarChart items={driverLiterItems} /> : <div style={{ fontSize: 12.5, color: R.inkFaint, fontStyle: 'italic' }}>No fuel records yet.</div>}
        </div>
      </div>

      <ReportTable columns={columns} data={filtered} rowKey="id" title="Fuel Log Entries"
        extra={<input placeholder="🔍  Search driver, vehicle…" value={search} onChange={e => setSearch(e.target.value)} style={{ border: `1px solid ${R.border}`, borderRadius: 7, padding: '7px 12px', fontSize: 13, color: R.ink, width: 220, background: '#fff' }} />}
        footer={`${filtered.length} entries`} pageSize={12} />
    </ReportShell>
  )
}
