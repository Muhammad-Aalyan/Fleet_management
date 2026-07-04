import type { ReactNode } from 'react'
import { R } from '../utils/reportTheme'

interface Props {
  title: string
  subtitle: string
  loading?: boolean
  onExcel?: () => void | Promise<void>
  onPdf?: () => void | Promise<void>
  filterBar?: ReactNode
  recordCount?: number
  adminName?: string
  children: ReactNode
}

const DownIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 14, height: 14 }}>
    <path d="M8 2v9M4 8l4 4 4-4M2 13h12" />
  </svg>
)

export default function ReportShell({ title, subtitle, loading, onExcel, onPdf, filterBar, recordCount, adminName, children }: Props) {
  return (
    <div style={{ background: R.bg, minHeight: '100%', paddingBottom: 48 }}>
      {/* Branded header */}
      <div style={{ borderRadius: R.radius, overflow: 'hidden', marginBottom: 20, border: `1px solid ${R.border}` }}>
        <div style={{
          background: R.brandDark, padding: '22px 28px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, letterSpacing: -0.2, color: '#fff' }}>{title}</h1>
            <p style={{ margin: 0, color: '#9AA1AC', fontSize: 13.5 }}>{subtitle}</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: '0.02em' }}>
              Ride <span style={{ color: R.brandRed }}>On</span>
            </div>
            <div style={{ marginTop: 3, fontSize: 10, letterSpacing: '0.14em', color: '#8B909C', fontWeight: 600 }}>FLEET OPERATIONS</div>
          </div>
        </div>

        <div style={{ height: 4, background: `linear-gradient(90deg, ${R.brandRed}, #7A1414)` }} />

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          padding: '12px 28px', borderBottom: `1px solid ${R.border}`, background: '#FBFBFC',
        }}>
          <div style={{ fontSize: 12, color: R.inkSoft }}>
            Live data · Viewing as <b style={{ color: R.ink }}>{adminName ?? 'Admin'}</b>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {typeof recordCount === 'number' && (
              <span style={{
                background: R.redSoft, color: R.brandRed, fontWeight: 700,
                padding: '3px 12px', borderRadius: 20, fontSize: 11.5,
              }}>{recordCount} RECORD{recordCount !== 1 ? 'S' : ''}</span>
            )}
            {onExcel && (
              <button onClick={onExcel} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: `1px solid ${R.border}`, background: R.surface, color: R.ink, cursor: 'pointer',
              }}>
                <DownIcon /> Export Excel
              </button>
            )}
            {onPdf && (
              <button onClick={onPdf} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: `1px solid ${R.brandRed}`, background: R.brandRed, color: '#fff', cursor: 'pointer',
              }}>
                <DownIcon /> Export PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      {filterBar && (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20,
          padding: '12px 16px', background: R.surface, border: `1px solid ${R.border}`, borderRadius: R.radius,
        }}>
          {filterBar}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', zIndex: 0, opacity: 0.045, overflow: 'hidden',
        }}>
          <img src="/logo.png" alt="" style={{ width: 380, maxWidth: '55%' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: R.inkFaint, fontSize: 13 }}>Loading…</div>
          ) : children}
        </div>
      </div>

      {!loading && (
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${R.border}`, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 34, height: 1, background: R.brandRed }} />
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', color: R.brandDark }}>
              BRING IT <span style={{ color: R.brandRed }}>ON!</span>
            </span>
            <div style={{ width: 34, height: 1, background: R.brandRed }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 10.5, color: R.inkFaint }}>Ride On Fleet Operations</div>
        </div>
      )}
    </div>
  )
}
