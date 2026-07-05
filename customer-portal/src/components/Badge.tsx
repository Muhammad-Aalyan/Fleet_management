interface Props {
  status: string
  label?: string
}

export default function Badge({ status, label }: Props) {
  const key = status.toLowerCase().replace(/\s+/g, '_')
  return <span className={`rd-badge rd-b-${key}`}>{label ?? status}</span>
}
