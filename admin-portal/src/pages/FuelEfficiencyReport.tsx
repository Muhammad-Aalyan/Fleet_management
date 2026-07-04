import { useEffect, useState, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import ReportShell from '../components/ReportShell'
import StatCard from '../components/StatCard'
import HBarChart from '../components/HBarChart'
import ReportTable from '../components/ReportTable'
import { R } from '../utils/reportTheme'
import { exportPDF, exportExcel } from '../utils/pdfExport'

interface VehicleRow {
  id: number; vehicleNumber: string; model: string; fuelType: string; capacity: number;
  totalLiters: number; totalAmount: number; totalKm: number; kmPerLiter: number;
  costPerKm: number; avgCostPerLiter: number; fuelEntries: number; drivers: string; lastRefuel: string | null;
}
interface Totals { totalVehicles: number; totalLiters: number; totalAmount: number; totalKm: number; avgKmPerLiter: number }

const effColor = (kpl: number) => kpl >= 12 ? R.good : kpl >= 8 ? R.warn : kpl > 0 ? R.danger : R.inkFaint
const effBg = (kpl: number) => kpl >= 12 ? R.goodSoft : kpl >= 8 ? R.warnSoft : kpl > 0 ? R.dangerSoft : '#F3F4F6'
const effLabel = (kpl: number) => kpl >= 12 ? 'Efficient' : kpl >= 8 ? 'Average' : kpl > 0 ? 'High Consumption' : 'No Data'

const FUEL_BG: Record<string, string> = { PETROL: '#FEF3E9', DIESEL: '#EFF6FF', CNG: '#ECFDF5', HYBRID: '#F5F3FF', ELECTRIC: '#ECFEFF' }
const FUEL_FG: Record<string, string> = { PETROL: '#B4560A', DIESEL: '#1E40AF', CNG: '#065F46', HYBRID: '#5B21B6', ELECTRIC: '#155E75' }

const medals = ['🥇', '🥈', '🥉']

export default function FuelEfficiencyReport() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<VehicleRow[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/fuel-efficiency')
      setTotals(res.data.totals); setRows(res.data.rows)
    } catch { /* handled */ } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchData() }, [fetchData])

  const filtered = rows.filter(r => !search || r.vehicleNumber.toLowerCase().includes(search.toLowerCase()) || r.model.toLowerCase().includes(search.toLowerCase()))
  const maxKpl = Math.max(...rows.map(r => r.kmPerLiter), 1)

  const summaryCards = totals ? [
    { label: 'Vehicles Tracked', value: totals.totalVehicles },
    { label: 'Total Km Driven', value: `${totals.totalKm.toFixed(0)} km` },
    { label: 'Total Fuel Spent', value: `PKR ${totals.totalAmount.toLocaleString()}` },
    { label: 'Fleet Avg Km/L', value: `${totals.avgKmPerLiter} km/L`, highlight: true },
  ] : undefined

  const handlePDF = async () => await exportPDF({
    title: 'Fuel Efficiency Report',
    subtitle: 'Km per liter, PKR per km — ranked best to worst performing vehicles',
    sectionLabel: 'Fuel Efficiency Rankings',
    orientation: 'landscape',
    adminName: user?.name ?? 'Admin',
    recordCount: filtered.length,
    head: ['Rank', 'Vehicle', 'Model', 'Fuel Type', 'Km/Liter', 'PKR/Km', 'Total Liters', 'Cost (PKR)', 'Efficiency'],
    body: filtered.map((r, i) => [medals[i] ?? `#${i + 1}`, r.vehicleNumber, r.model, r.fuelType, r.kmPerLiter, r.costPerKm, r.totalLiters.toFixed(1), r.totalAmount.toLocaleString(), effLabel(r.kmPerLiter)]),
    fileName: 'fuel-efficiency-report',
    summaryCards,
  })

  const handleExcel = () => exportExcel('fuel-efficiency-report', 'Fuel Efficiency', filtered.map(r => ({
    Vehicle: r.vehicleNumber, Model: r.model, 'Fuel Type': r.fuelType,
    'Total Liters': r.totalLiters, 'Total Cost (PKR)': r.totalAmount,
    'Km Driven': r.totalKm, 'Km/Liter': r.kmPerLiter, 'PKR/Km': r.costPerKm,
    Efficiency: effLabel(r.kmPerLiter), Drivers: r.drivers,
  })), {
    title: 'Fuel Efficiency Report',
    subtitle: 'Km per liter, PKR per km — ranked best to worst performing vehicles',
    sectionLabel: 'Fuel Efficiency Rankings',
    adminName: user?.name ?? 'Admin',
    recordCount: filtered.length,
    summaryCards,
  })

  const effItems = rows.slice(0, 8).map(r => ({
    label: `${r.vehicleNumber}`,
    value: r.kmPerLiter,
    suffix: ' km/L',
    color: effColor(r.kmPerLiter),
  }))

  const costItems = [...rows].filter(r => r.costPerKm > 0).sort((a, b) => b.costPerKm - a.costPerKm).slice(0, 8)
    .map(r => ({ label: `${r.vehicleNumber}`, value: r.costPerKm, suffix: ' PKR/km', color: R.danger }))

  const columns = [
    {
      title: 'Rank', key: 'rank', width: 60,
      render: (_: any, __: any, i: number) => <span style={{ fontWeight: 700, color: R.inkFaint }}>{medals[i] ?? `#${i + 1}`}</span>,
    },
    {
      title: 'Vehicle', key: 'vehicle', width: 180,
      render: (_: any, r: VehicleRow) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: effBg(r.kmPerLiter), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>🚗</div>
          <div>
            <div style={{ fontWeight: 600, color: R.ink }}>{r.vehicleNumber}</div>
            <div style={{ fontSize: 12, color: R.inkFaint }}>{r.model}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Fuel Type', dataIndex: 'fuelType', key: 'fuel', width: 90,
      render: (v: string) => <span style={{ background: FUEL_BG[v] ?? '#F3F4F6', color: FUEL_FG[v] ?? R.inkSoft, padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Km / Liter', key: 'kpl', width: 180,
      render: (_: any, r: VehicleRow) => r.kmPerLiter > 0 ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ flex: 1, height: 6, background: '#EFF1F5', borderRadius: 4 }}>
              <div style={{ width: `${(r.kmPerLiter / maxKpl) * 100}%`, height: '100%', background: effColor(r.kmPerLiter), borderRadius: 4, transition: 'width 0.6s' }} />
            </div>
            <span style={{ fontWeight: 700, width: 60, textAlign: 'right', color: effColor(r.kmPerLiter), fontSize: 13 }}>{r.kmPerLiter} km/L</span>
          </div>
          <span style={{ fontSize: 11, background: effBg(r.kmPerLiter), color: effColor(r.kmPerLiter), padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>{effLabel(r.kmPerLiter)}</span>
        </div>
      ) : <span style={{ color: R.inkFaint, fontSize: 12 }}>No km data</span>,
    },
    {
      title: 'PKR / Km', dataIndex: 'costPerKm', key: 'cpk', width: 100,
      render: (v: number) => v > 0 ? <span style={{ fontWeight: 600, color: v > 20 ? R.danger : R.good }}>PKR {v}</span> : <span style={{ color: R.inkFaint }}>—</span>,
    },
    { title: 'Liters', dataIndex: 'totalLiters', key: 'liters', width: 90, render: (v: number) => <span style={{ fontWeight: 600, color: R.accent }}>{v.toFixed(1)} L</span> },
    { title: 'Fuel Cost', dataIndex: 'totalAmount', key: 'amount', width: 140, render: (v: number) => <span style={{ fontWeight: 700, color: R.good }}>PKR {v.toLocaleString()}</span> },
    {
      title: 'Last Refuel', dataIndex: 'lastRefuel', key: 'lr', width: 110,
      render: (v: string | null) => v ? <span style={{ color: R.inkSoft, fontSize: 12 }}>{new Date(v).toLocaleDateString()}</span> : <span style={{ color: R.inkFaint }}>—</span>,
    },
  ]

  return (
    <ReportShell
      title="Fuel Efficiency Report"
      subtitle="Km per liter, PKR per km — ranked best to worst performing vehicles"
      loading={loading}
      recordCount={filtered.length}
      adminName={user?.name ?? 'Admin'}
      onExcel={handleExcel}
      onPdf={handlePDF}
      filterBar={
        <>
          <input placeholder="🔍  Search vehicle, model…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: `1px solid ${R.border}`, borderRadius: 7, padding: '7px 10px', fontSize: 13, color: R.ink, width: 220, background: '#fff' }} />
          <div style={{ flex: 1 }} />
          <span style={{ color: R.inkSoft, fontSize: 13 }}>{filtered.length} vehicles</span>
        </>
      }
    >
      {totals && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          <StatCard label="Vehicles Tracked" value={totals.totalVehicles} />
          <StatCard label="Total Km Driven" value={`${totals.totalKm.toFixed(0)} km`} />
          <StatCard label="Total Fuel Spent" value={`PKR ${totals.totalAmount.toLocaleString()}`} color={R.good} colorSoft={R.goodSoft} />
          <StatCard label="Fleet Avg Km/L" value={`${totals.avgKmPerLiter} km/L`} highlight color={effColor(totals.avgKmPerLiter)} colorSoft={effBg(totals.avgKmPerLiter)} sub={effLabel(totals.avgKmPerLiter)} />
        </div>
      )}

      {rows.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14, marginBottom: 20 }}>
          <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: R.radius, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: R.ink, marginBottom: 2 }}>Efficiency Ranking (km / liter)</div>
            <div style={{ fontSize: 12.5, color: R.inkFaint, marginBottom: 16 }}>Higher is better</div>
            <HBarChart items={effItems} />
          </div>
          <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: R.radius, padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: R.ink, marginBottom: 2 }}>Cost per Km (PKR)</div>
            <div style={{ fontSize: 12.5, color: R.inkFaint, marginBottom: 16 }}>Lower is better</div>
            {costItems.length > 0 ? <HBarChart items={costItems} color={R.danger} /> : <div style={{ fontSize: 12.5, color: R.inkFaint, fontStyle: 'italic' }}>Not enough mileage data.</div>}
          </div>
        </div>
      )}

      <ReportTable columns={columns} data={filtered} rowKey="id" title="Vehicle Efficiency Details" pageSize={10} />
    </ReportShell>
  )
}
