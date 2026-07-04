import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { R } from '../utils/reportTheme'

interface Props<T> {
  columns: ColumnsType<T>
  data: T[]
  rowKey: string | ((r: T) => string)
  title?: string
  extra?: React.ReactNode
  pageSize?: number
  footer?: string
}

export default function ReportTable<T extends object>({ columns, data, rowKey, title, extra, pageSize = 12, footer }: Props<T>) {
  return (
    <div style={{ background: R.surface, border: `1px solid ${R.border}`, borderRadius: R.radius, overflow: 'hidden' }}>
      {(title || extra) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${R.border}` }}>
          {title && <span style={{ fontWeight: 700, fontSize: 14.5, color: R.ink }}>{title}</span>}
          {extra && <div>{extra}</div>}
        </div>
      )}
      <Table
        dataSource={data}
        columns={columns}
        rowKey={rowKey as any}
        size="middle"
        pagination={data.length > pageSize ? {
          pageSize, showSizeChanger: false,
          showTotal: (t) => footer ?? `${t} records`,
        } : false}
        locale={{ emptyText: <span style={{ color: R.inkFaint, fontSize: 13 }}>No data yet.</span> }}
        style={{ background: R.surface }}
        components={{
          header: {
            cell: ({ children, style, ...rest }: any) => (
              <th {...rest} style={{
                ...style,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#FFFFFF',
                fontWeight: 700,
                background: R.brandDark,
                borderBottom: `1px solid ${R.brandDark}`,
                padding: '11px 20px',
              }}>
                {children}
              </th>
            ),
          },
          body: {
            cell: ({ children, style, ...rest }: any) => (
              <td {...rest} style={{
                ...style,
                padding: '14px 20px',
                fontSize: 13.5,
                color: R.ink,
                borderBottom: `1px solid ${R.border}`,
              }}>
                {children}
              </td>
            ),
            row: ({ children, style, ...rest }: any) => (
              <tr {...rest} style={{ ...style, cursor: 'default' }}
                onMouseEnter={(e: any) => e.currentTarget.style.background = '#FAFBFD'}
                onMouseLeave={(e: any) => e.currentTarget.style.background = 'transparent'}
              >
                {children}
              </tr>
            ),
          },
        }}
      />
    </div>
  )
}
