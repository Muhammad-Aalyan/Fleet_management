import { useEffect, useState, useCallback } from 'react'
import { Select } from 'antd'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import ReportShell from '../components/ReportShell'
import StatCard from '../components/StatCard'
import ReportTable from '../components/ReportTable'
import { R } from '../utils/reportTheme'
import { exportPDF, exportExcel } from '../utils/pdfExport'

const S_BG: Record<string, string> = { APPROVED: R.goodSoft, PENDING: R.warnSoft, REJECTED: R.dangerSoft }
const S_FG: Record<string, string> = { APPROVED: R.good, PENDING: R.warn, REJECTED: R.danger }

interface Summary { total: number; pending: number; approved: number; rejected: number; totalAmount: number; approvedAmount: number; pendingAmount: number }
interface CombinedRow { id: number; type: 'Customer' | 'Driver'; name: string; purpose: string; amount: number; status: string; date: string }
interface Combined { totalAmount: number; approvedAmount: number; pendingAmount: number; totalClaims: number }

const SummaryBox = ({ title, s, sub }: { title: string; s: Summary; sub: string }) => (
  <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: R.radius, padding: '18px 20px', flex: 1 }}>
    <div style={{ fontWeight: 700, fontSize: 14.5, color: R.ink, marginBottom: 2 }}>{title}</div>
    <div style={{ fontSize: 12.5, color: R.inkFaint, marginBottom: 16 }}>{sub}</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
      {[
        { label: 'Approved', count: s.approved, amount: s.approvedAmount, fg: R.good, bg: R.goodSoft },
        { label: 'Pending', count: s.pending, amount: s.pendingAmount, fg: R.warn, bg: R.warnSoft },
        { label: 'Rejected', count: s.rejected, amount: s.totalAmount - s.approvedAmount - s.pendingAmount, fg: R.danger, bg: R.dangerSoft },
      ].map(item => (
        <div key={item.label} style={{ background: item.bg, border: `1px solid ${item.fg}30`, borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, color: item.fg, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>{item.label}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: item.fg, lineHeight: 1 }}>{item.count}</div>
          <div style={{ fontSize: 11, color: R.inkFaint, marginTop: 4 }}>PKR {item.amount.toLocaleString()}</div>
        </div>
      ))}
    </div>
  </div>
)

export default function ReimbursementsReport() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [customer, setCustomer] = useState<Summary | null>(null)
  const [driver, setDriver] = useState<Summary | null>(null)
  const [combined, setCombined] = useState<Combined | null>(null)
  const [rows, setRows] = useState<CombinedRow[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/reimbursements')
      setCustomer(res.data.customer); setDriver(res.data.driver)
      setCombined(res.data.combined); setRows(res.data.rows)
    } catch { /* handled */ } finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchData() }, [fetchData])

  const filtered = rows.filter(r => {
    const s = search.toLowerCase()
    return (!search || r.name.toLowerCase().includes(s) || r.purpose.toLowerCase().includes(s))
      && (typeFilter === 'ALL' || r.type === typeFilter)
      && (statusFilter === 'ALL' || r.status === statusFilter)
  })

  const summaryCards = combined ? [
    { label: 'Total Claims', value: combined.totalClaims },
    { label: 'Total Submitted', value: `PKR ${combined.totalAmount.toLocaleString()}` },
    { label: 'Approved', value: `PKR ${combined.approvedAmount.toLocaleString()}`, highlight: true },
    { label: 'Pending', value: `PKR ${combined.pendingAmount.toLocaleString()}` },
  ] : undefined

  const handlePDF = async () => await exportPDF({
    title: 'Reimbursements Summary',
    subtitle: 'Customer and driver claims — approved, pending, and rejected',
    sectionLabel: 'Reimbursement Claims',
    orientation: 'landscape',
    adminName: user?.name ?? 'Admin',
    recordCount: filtered.length,
    head: ['Type', 'Name', 'Purpose', 'Amount (PKR)', 'Status', 'Date'],
    body: filtered.map(r => [r.type, r.name, r.purpose, r.amount.toLocaleString(), r.status, new Date(r.date).toLocaleDateString()]),
    fileName: 'reimbursements-report',
    summaryCards,
  })

  const handleExcel = () => exportExcel('reimbursements-report', 'Reimbursements', filtered.map(r => ({
    Type: r.type, Name: r.name, Purpose: r.purpose,
    'Amount (PKR)': r.amount, Status: r.status, Date: new Date(r.date).toLocaleDateString(),
  })), {
    title: 'Reimbursements Summary',
    subtitle: 'Customer and driver claims — approved, pending, and rejected',
    sectionLabel: 'Reimbursement Claims',
    adminName: user?.name ?? 'Admin',
    recordCount: filtered.length,
    summaryCards,
  })

  const columns = [
    {
      title: 'Type', key: 'type', width: 90,
      render: (_: any, r: CombinedRow) => (
        <span style={{ background: r.type === 'Customer' ? R.accentSoft : R.warnSoft, color: r.type === 'Customer' ? R.accent : R.warn, padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{r.type}</span>
      ),
    },
    {
      title: 'Name', key: 'name', width: 160,
      render: (_: any, r: CombinedRow) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: r.type === 'Customer' ? R.accentSoft : R.warnSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: r.type === 'Customer' ? R.accent : R.warn, flexShrink: 0 }}>
            {r.name.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontWeight: 600, color: R.ink }}>{r.name}</span>
        </div>
      ),
    },
    { title: 'Purpose / Description', dataIndex: 'purpose', key: 'purpose', render: (v: string) => <span style={{ color: R.inkSoft, fontSize: 13 }}>{v}</span> },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 140, render: (v: number) => <span style={{ fontWeight: 700, color: R.good }}>PKR {v.toLocaleString()}</span> },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 110,
      render: (v: string) => <span style={{ background: S_BG[v] ?? '#F3F4F6', color: S_FG[v] ?? R.inkSoft, padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{v}</span>,
    },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 110, render: (v: string) => <span style={{ color: R.inkSoft }}>{new Date(v).toLocaleDateString()}</span> },
  ]

  return (
    <ReportShell
      title="Reimbursements Summary"
      subtitle="Customer and driver claims — approved, pending, and rejected"
      loading={loading}
      recordCount={filtered.length}
      adminName={user?.name ?? 'Admin'}
      onExcel={handleExcel}
      onPdf={handlePDF}
      filterBar={
        <>
          <input placeholder="🔍  Search name, purpose…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: `1px solid ${R.border}`, borderRadius: 7, padding: '7px 10px', fontSize: 13, color: R.ink, width: 220, background: '#fff' }} />
          <Select value={typeFilter} onChange={setTypeFilter} style={{ width: 130 }} size="small"
            options={[{ value: 'ALL', label: 'All types' }, { value: 'Customer', label: 'Customer' }, { value: 'Driver', label: 'Driver' }]} />
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 130 }} size="small"
            options={[{ value: 'ALL', label: 'All statuses' }, { value: 'APPROVED', label: 'Approved' }, { value: 'PENDING', label: 'Pending' }, { value: 'REJECTED', label: 'Rejected' }]} />
          <div style={{ flex: 1 }} />
          <span style={{ color: R.inkSoft, fontSize: 13 }}>{filtered.length} claims</span>
        </>
      }
    >
      {combined && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
          <StatCard label="Total Claims" value={combined.totalClaims} />
          <StatCard label="Total Submitted" value={`PKR ${combined.totalAmount.toLocaleString()}`} />
          <StatCard label="Approved" value={`PKR ${combined.approvedAmount.toLocaleString()}`} highlight color={R.good} colorSoft={R.goodSoft} />
          <StatCard label="Pending" value={`PKR ${combined.pendingAmount.toLocaleString()}`} color={R.warn} colorSoft={R.warnSoft} />
        </div>
      )}

      {customer && driver && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <SummaryBox title="Customer Claims" s={customer} sub={`${customer.total} total claims`} />
          <SummaryBox title="Driver Claims" s={driver} sub={`${driver.total} total claims`} />
        </div>
      )}

      <ReportTable
        columns={columns} data={filtered} rowKey={r => `${(r as any).type}-${(r as any).id}`}
        title="All Claims" footer={`${filtered.length} claims`} pageSize={12}
      />
    </ReportShell>
  )
}
