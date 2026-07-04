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
  id: number; vehicleNumber: string; model: string; year: number; capacity: number;
  fuelType: string; status: string; currentMileage: number;
  totalRides: number; completedRides: number; activeRides: number;
  totalFuelLiters: number; totalFuelCost: number;
  totalKmDriven: number; fuelEfficiency: number; fuelCostPerKm: number;
  maintenanceCount: number; maintenanceCost: number; lastMaintenance: string | null;
}
interface Totals { totalVehicles: number; activeVehicles: number; totalKmDriven: number; totalFuelCost: number; totalMaintenanceCost: number }

const ST_BG: Record<string, string> = { AVAILABLE: R.goodSoft, IN_RIDE: '#DBEAFE', MAINTENANCE: R.warnSoft, INACTIVE: '#F3F4F6' }
const ST_FG: Record<string, string> = { AVAILABLE: R.good, IN_RIDE: '#1E40AF', MAINTENANCE: R.warn, INACTIVE: R.inkFaint }
const FUEL_BG: Record<string, string> = { PETROL: '#FEF3E9', DIESEL: '#EFF6FF', CNG: '#ECFDF5', HYBRID: '#F5F3FF', ELECTRIC: '#ECFEFF' }
const FUEL_FG: Record<string, string> = { PETROL: '#B4560A', DIESEL: '#1E40AF', CNG: '#065F46', HYBRID: '#5B21B6', ELECTRIC: '#155E75' }

export default function VehicleUtilizationReport() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<VehicleRow[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/vehicle-utilization')
      setTotals(res.data.totals); setRows(res.data.rows)
    } catch { /* handled */ } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchData() }, [fetchData])

  const filtered = rows.filter(r => !search || r.vehicleNumber.toLowerCase().includes(search.toLowerCase()) || r.model.toLowerCase().includes(search.toLowerCase()))
  const maxRides = Math.max(...rows.map(r => r.totalRides), 1)

  const rideItems = [...rows].sort((a, b) => b.totalRides - a.totalRides).slice(0, 8)
    .map(v => ({ label: `${v.vehicleNumber}`, value: v.totalRides }))

  const fuelCostItems = [...rows].filter(r => r.totalFuelCost > 0).sort((a, b) => b.totalFuelCost - a.totalFuelCost).slice(0, 8)
    .map(v => ({ label: `${v.vehicleNumber}`, value: Math.round(v.totalFuelCost), suffix: ' PKR' }))

  const summaryCards = totals ? [
    { label: 'Total Vehicles', value: totals.totalVehicles },
    { label: 'Total Km Driven', value: `${totals.totalKmDriven.toFixed(0)} km`, highlight: true },
    { label: 'Total Fuel Cost', value: `PKR ${totals.totalFuelCost.toLocaleString()}` },
    { label: 'Maintenance Cost', value: `PKR ${totals.totalMaintenanceCost.toLocaleString()}` },
  ] : undefined

  const handlePDF = async () => await exportPDF({
    title: 'Vehicle Utilization Report',
    subtitle: 'Ride activity, km driven, fuel cost, and maintenance per vehicle',
    sectionLabel: 'Vehicle Utilization Overview',
    orientation: 'landscape',
    adminName: user?.name ?? 'Admin',
    recordCount: filtered.length,
    head: ['Vehicle', 'Model', 'Status', 'Rides', 'Completed', 'Km Driven', 'Km/L', 'Fuel Cost (PKR)', 'Maintenance'],
    body: filtered.map(r => [r.vehicleNumber, r.model, r.status, r.totalRides, r.completedRides, r.totalKmDriven.toFixed(0), r.fuelEfficiency, r.totalFuelCost.toLocaleString(), r.maintenanceCount]),
    fileName: 'vehicle-utilization-report',
    summaryCards,
  })

  const handleExcel = () => exportExcel('vehicle-utilization-report', 'Vehicle Utilization', filtered.map(r => ({
    Vehicle: r.vehicleNumber, Model: r.model, Year: r.year, Capacity: r.capacity,
    'Fuel Type': r.fuelType, Status: r.status, 'Total Rides': r.totalRides,
    'Completed Rides': r.completedRides, 'Total Fuel (L)': r.totalFuelLiters,
    'Fuel Cost (PKR)': r.totalFuelCost, 'Km Driven': r.totalKmDriven,
    'Km/L': r.fuelEfficiency, 'PKR/Km': r.fuelCostPerKm,
    'Maintenance Count': r.maintenanceCount, 'Maintenance Cost (PKR)': r.maintenanceCost,
  })), {
    title: 'Vehicle Utilization Report',
    subtitle: 'Ride activity, km driven, fuel cost, and maintenance per vehicle',
    sectionLabel: 'Vehicle Utilization Overview',
    adminName: user?.name ?? 'Admin',
    recordCount: filtered.length,
    summaryCards,
  })

  const columns = [
    {
      title: 'Vehicle', key: 'vehicle', width: 180,
      render: (_: any, r: VehicleRow) => (
        <div>
          <div style={{ fontWeight: 600, color: R.ink }}>{r.vehicleNumber}</div>
          <div style={{ fontSize: 12, color: R.inkFaint }}>{r.model} · {r.year}</div>
        </div>
      ),
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 120,
      render: (v: string) => <span style={{ background: ST_BG[v] ?? '#F3F4F6', color: ST_FG[v] ?? R.inkSoft, padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Fuel Type', dataIndex: 'fuelType', key: 'fuel', width: 90,
      render: (v: string) => <span style={{ background: FUEL_BG[v] ?? '#F3F4F6', color: FUEL_FG[v] ?? R.inkSoft, padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Utilization', key: 'util', width: 170,
      render: (_: any, r: VehicleRow) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <div style={{ flex: 1, height: 6, background: '#EFF1F5', borderRadius: 4 }}>
              <div style={{ width: `${(r.totalRides / maxRides) * 100}%`, height: '100%', background: R.accent, borderRadius: 4 }} />
            </div>
            <span style={{ fontWeight: 600, color: R.ink, fontSize: 13, width: 24, textAlign: 'right' }}>{r.totalRides}</span>
          </div>
          <span style={{ fontSize: 12, color: R.inkFaint }}>{r.completedRides} completed</span>
        </div>
      ),
    },
    { title: 'Km Driven', key: 'km', width: 110, render: (_: any, r: VehicleRow) => r.totalKmDriven > 0 ? <span style={{ fontWeight: 600, color: R.accent }}>{r.totalKmDriven.toFixed(0)} km</span> : <span style={{ color: R.inkFaint }}>—</span> },
    {
      title: 'Fuel Cost', key: 'fuel', width: 150,
      render: (_: any, r: VehicleRow) => r.totalFuelCost > 0 ? (
        <div>
          <div style={{ fontWeight: 700, color: R.good }}>PKR {r.totalFuelCost.toLocaleString()}</div>
          {r.fuelCostPerKm > 0 && <div style={{ fontSize: 12, color: R.inkFaint }}>PKR {r.fuelCostPerKm}/km</div>}
        </div>
      ) : <span style={{ color: R.inkFaint }}>No data</span>,
    },
    {
      title: 'Maintenance', key: 'maint', width: 150,
      render: (_: any, r: VehicleRow) => r.maintenanceCount > 0 ? (
        <div>
          <span style={{ color: r.maintenanceCount >= 3 ? R.danger : R.warn, fontWeight: 600 }}>{r.maintenanceCount} log{r.maintenanceCount > 1 ? 's' : ''}</span>
          {r.maintenanceCost > 0 && <div style={{ fontSize: 12, color: R.inkFaint }}>PKR {r.maintenanceCost.toLocaleString()}</div>}
          {r.lastMaintenance && <div style={{ fontSize: 11, color: R.inkFaint }}>Last: {new Date(r.lastMaintenance).toLocaleDateString()}</div>}
        </div>
      ) : <span style={{ color: R.good, fontSize: 12 }}>No issues</span>,
    },
  ]

  return (
    <ReportShell
      title="Vehicle Utilization Report"
      subtitle="Ride activity, km driven, fuel cost, and maintenance per vehicle"
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
          <StatCard label="Total Vehicles" value={totals.totalVehicles} />
          <StatCard label="Total Km Driven" value={`${totals.totalKmDriven.toFixed(0)} km`} highlight />
          <StatCard label="Total Fuel Cost" value={`PKR ${totals.totalFuelCost.toLocaleString()}`} color={R.good} colorSoft={R.goodSoft} />
          <StatCard label="Maintenance Cost" value={`PKR ${totals.totalMaintenanceCost.toLocaleString()}`} color={totals.totalMaintenanceCost > 0 ? R.warn : R.inkFaint} colorSoft={R.warnSoft} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: R.radius, padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: R.ink, marginBottom: 2 }}>Rides by Vehicle</div>
          <div style={{ fontSize: 12.5, color: R.inkFaint, marginBottom: 16 }}>Total assigned rides, all time</div>
          {rideItems.length > 0 ? <HBarChart items={rideItems} /> : <div style={{ fontSize: 12.5, color: R.inkFaint, fontStyle: 'italic' }}>No ride data yet.</div>}
        </div>
        <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: R.radius, padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: R.ink, marginBottom: 2 }}>Fuel Cost by Vehicle</div>
          <div style={{ fontSize: 12.5, color: R.inkFaint, marginBottom: 16 }}>PKR spent on fuel, all time</div>
          {fuelCostItems.length > 0 ? <HBarChart items={fuelCostItems} /> : <div style={{ fontSize: 12.5, color: R.inkFaint, fontStyle: 'italic' }}>No fuel records yet.</div>}
        </div>
      </div>

      <ReportTable columns={columns} data={filtered} rowKey="id" title="All Vehicles" pageSize={10} />
    </ReportShell>
  )
}
