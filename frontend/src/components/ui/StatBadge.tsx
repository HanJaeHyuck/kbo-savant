interface StatBadgeProps {
  label: string
  value: number | string
  highlight?: boolean
}

const PERCENTILE_COLOR: Record<string, string> = {
  red: '#C0392B',
  orange: '#E67E22',
  gray: '#95A5A6',
  blue_light: '#3498DB',
  blue: '#1E3A8A',
}

export default function StatBadge({ label, value, highlight = false }: StatBadgeProps) {
  return (
    <div
      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-mono"
      style={{
        backgroundColor: highlight ? PERCENTILE_COLOR.red : '#E8ECF0',
        color: highlight ? '#fff' : '#0A1E4E',
      }}
    >
      <span className="font-sans text-xs opacity-75">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
