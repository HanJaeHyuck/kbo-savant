import React from 'react'
import type { PitchZoneMapProps, PitchLocation } from '../../types'

const PITCH_COLORS: Record<string, string> = {
  직구: '#1E3A8A', 포심: '#1E3A8A', 슬라이더: '#0F6E56', 체인지업: '#BA7517',
  커브: '#7C3AED', 커터: '#0EA5E9', 싱커: '#65A30D', 스플리터: '#DB2777',
}

const W = 170, H = 210, PAD = 12, HOME_H = 22
const CHART_W = W - PAD * 2
const CHART_H = H - PAD * 2 - HOME_H
const XR = [-0.7, 0.7] as const
const ZR = [0, 1.3] as const
const ZONE = { xMin: -0.28, xMax: 0.28, zMin: 0.45, zMax: 1.05 }
const NX = 20, NZ = 22, SIGMA = 1.8

const sx = (x: number) => PAD + ((x - XR[0]) / (XR[1] - XR[0])) * CHART_W
const sy = (z: number) => PAD + ((ZR[1] - z) / (ZR[1] - ZR[0])) * CHART_H

function heatColor(t: number): string {
  if (t < 0.06) return 'rgba(0,0,0,0)'
  const a = Math.min(1, 0.25 + t * 0.9)
  if (t < 0.35) {
    const s = t / 0.35
    return `rgba(${Math.round(40 + s * 55)},${Math.round(100 + s * 95)},${Math.round(200 + s * 35)},${a.toFixed(2)})`
  }
  if (t < 0.65) {
    const s = (t - 0.35) / 0.3
    return `rgba(${Math.round(95 + s * 160)},${Math.round(195 - s * 130)},${Math.round(235 - s * 205)},${a.toFixed(2)})`
  }
  const s = (t - 0.65) / 0.35
  return `rgba(255,${Math.round(65 - s * 55)},${Math.round(30 - s * 25)},${Math.min(1, a + 0.05).toFixed(2)})`
}

function buildGrid(locs: PitchLocation[]): number[][] {
  const g: number[][] = Array.from({ length: NZ }, () => Array(NX).fill(0))
  const sample = locs.length > 400 ? locs.slice(0, 400) : locs
  for (const p of sample) {
    const fx = ((p.plate_x - XR[0]) / (XR[1] - XR[0])) * NX
    const fz = ((p.plate_z - ZR[0]) / (ZR[1] - ZR[0])) * NZ
    for (let iz = 0; iz < NZ; iz++) {
      for (let ix = 0; ix < NX; ix++) {
        const dx = ix + 0.5 - fx, dz = iz + 0.5 - fz
        g[iz][ix] += Math.exp(-(dx * dx + dz * dz) / (2 * SIGMA * SIGMA))
      }
    }
  }
  return g
}

function HomePlate() {
  const cx = W / 2, y = H - HOME_H + 5, hw = 10, hh = 7
  const pts = `${cx - hw},${y} ${cx + hw},${y} ${cx + hw},${y + hh * 0.5} ${cx},${y + hh} ${cx - hw},${y + hh * 0.5}`
  return <polygon points={pts} fill="#CBD5E1" stroke="#94A3B8" strokeWidth={0.5} />
}

const MiniCard = React.memo(function MiniCard({
  type, locs, total,
}: { type: string; locs: PitchLocation[]; total: number }) {
  const grid = React.useMemo(() => buildGrid(locs), [locs])
  const maxVal = Math.max(1, ...grid.flat())
  const cw = CHART_W / NX, ch = CHART_H / NZ
  const pitchColor = PITCH_COLORS[type] ?? '#94A3B8'
  const pct = ((locs.length / total) * 100).toFixed(1)
  const fid = `blur_${type.replace(/[^\w]/g, '_')}`
  const clipId = `clip_${type.replace(/[^\w]/g, '_')}`

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden shadow-sm" style={{ width: W }}>
      <div className="flex items-center justify-between px-2 pt-1.5 pb-0">
        <span className="text-[11px] font-bold" style={{ color: pitchColor }}>{type}</span>
        <span className="text-[10px] text-gray-400">{locs.length}구 ({pct}%)</span>
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        <defs>
          <filter id={fid} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.8" />
          </filter>
          <clipPath id={clipId}>
            <rect x={PAD - 2} y={PAD - 2} width={CHART_W + 4} height={CHART_H + 4} />
          </clipPath>
        </defs>
        <rect x={0} y={0} width={W} height={H - HOME_H + 2} fill="#F1F5F9" />
        <g filter={`url(#${fid})`} clipPath={`url(#${clipId})`}>
          {grid.map((row, iz) => row.map((val, ix) => {
            const t = val / maxVal
            const col = heatColor(t)
            if (col === 'rgba(0,0,0,0)') return null
            return (
              <rect key={`${iz}-${ix}`}
                x={PAD + ix * cw} y={PAD + (NZ - 1 - iz) * ch}
                width={cw + 1} height={ch + 1}
                fill={col} />
            )
          }))}
        </g>
        <rect
          x={sx(ZONE.xMin)} y={sy(ZONE.zMax)}
          width={sx(ZONE.xMax) - sx(ZONE.xMin)}
          height={sy(ZONE.zMin) - sy(ZONE.zMax)}
          fill="none" stroke="#1E293B" strokeWidth={1.1} strokeDasharray="3 2"
        />
        {locs.slice(0, 250).map((p, i) => (
          <circle key={i} cx={sx(p.plate_x)} cy={sy(p.plate_z)} r={1.5}
            fill={pitchColor} fillOpacity={0.28} />
        ))}
        <HomePlate />
      </svg>
    </div>
  )
})

const PitchZoneMap = React.memo(function PitchZoneMap({ data }: PitchZoneMapProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[var(--color-text-muted)]"
        data-testid="pitch-zone-empty">데이터가 없습니다.</div>
    )
  }

  const sorted = React.useMemo(() => {
    const groups = new Map<string, PitchLocation[]>()
    for (const p of data) {
      const t = p.pitch_type || '기타'
      if (!groups.has(t)) groups.set(t, [])
      groups.get(t)!.push(p)
    }
    return [...groups.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [data])

  return (
    <div data-testid="pitch-zone-map" className="flex flex-wrap gap-3">
      {sorted.map(([type, locs]) => (
        <MiniCard key={type} type={type} locs={locs} total={data.length} />
      ))}
    </div>
  )
})

export default PitchZoneMap
