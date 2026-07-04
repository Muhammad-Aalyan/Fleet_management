import { R } from '../utils/reportTheme'

interface Props {
  label: string
  value: string | number
  sub?: string
  highlight?: boolean
  color?: string
  colorSoft?: string
}

export default function StatCard({ label, value, sub, highlight, color }: Props) {
  const fg = color ?? (highlight ? R.brandRed : R.ink)

  return (
    <div style={{
      background: R.surface,
      border: `1px solid ${R.border}`,
      borderRadius: R.radius,
      padding: '16px 18px',
      flex: 1,
    }}>
      <div style={{ fontSize: 11.5, color: R.inkSoft, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.3, color: fg, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12.5, color: R.inkFaint, marginTop: 6 }}>{sub}</div>}
    </div>
  )
}
