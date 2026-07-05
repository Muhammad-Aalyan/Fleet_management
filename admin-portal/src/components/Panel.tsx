import type { ReactNode } from 'react'

interface Props {
  title?: ReactNode
  headExtra?: ReactNode
  footer?: ReactNode
  children: ReactNode
  style?: React.CSSProperties
}

export default function Panel({ title, headExtra, footer, children, style }: Props) {
  return (
    <div className="rd-panel" style={style}>
      {(title || headExtra) && (
        <div className="rd-panel-head">
          {title && <h3>{title}</h3>}
          {headExtra}
        </div>
      )}
      {children}
      {footer && <div className="rd-foot">{footer}</div>}
    </div>
  )
}
