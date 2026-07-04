import { R } from '../utils/reportTheme'

interface Item {
  label: string
  value: number
  suffix?: string
  color?: string
}

interface Props {
  items: Item[]
  color?: string
  note?: string
}

export default function HBarChart({ items, color = R.accent, note }: Props) {
  const max = Math.max(...items.map(i => i.value), 1)
  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ width: 90, fontSize: 13, color: R.inkSoft, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.label}>
            {item.label}
          </div>
          <div style={{ flex: 1, height: 10, background: '#EFF1F5', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              width: `${(item.value / max) * 100}%`,
              height: '100%',
              background: item.color ?? color,
              borderRadius: 6,
              transition: 'width 0.6s ease',
              minWidth: item.value > 0 ? 4 : 0,
            }} />
          </div>
          <div style={{ width: 90, textAlign: 'right', fontSize: 12.5, color: R.inkSoft, fontWeight: 600, flexShrink: 0 }}>
            {item.value}{item.suffix ?? ''}
          </div>
        </div>
      ))}
      {note && <div style={{ fontSize: 12.5, color: R.inkFaint, fontStyle: 'italic', marginTop: 4 }}>{note}</div>}
    </div>
  )
}
