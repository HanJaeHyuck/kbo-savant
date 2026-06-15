import React, { useState } from 'react'
import type { PitchZoneMapProps, PitchLocation } from '../../types'

const PITCH_COLORS: Record<string, string> = {
  직구: '#1E3A8A', 포심: '#1E3A8A', 슬라이더: '#0F6E56', 체인지업: '#BA7517',
  커브: '#7C3AED', 커터: '#0EA5E9', 싱커: '#65A30D', 스플리터: '#DB2777',
}
const RESULT_COLORS: Record<string, string> = {
  인플레이: '#C0392B', 헛스윙: '#7C3AED', 스트라이크: '#E67E22',
  루킹스트라이크: '#E67E22', 파울: '#F5A623', 볼: '#3498DB',
}
const dotColor = (p: PitchLocation, by: 'pitch_type' | 'result') =>
  by === 'result' ? (RESULT_COLORS[p.result] ?? '#9CA3AF') : (PITCH_COLORS[p.pitch_type] ?? '#9CA3AF')

const W = 220, H = 260, PAD = 24
const ZONE = { xMin: -0.28, xMax: 0.28, zMin: 0.45, zMax: 1.05 }
const XR = [-0.7, 0.7], ZR = [0, 1.3]
const sx = (x: number) => PAD + ((x - XR[0]) / (XR[1] - XR[0])) * (W - PAD * 2)
const sz = (z: number) => H - PAD - ((z - ZR[0]) / (ZR[1] - ZR[0])) * (H - PAD * 2)

// 밀도 → 색 (파랑→크림→빨강)
function lerp(a: number[], b: number[], t: number) {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`
}
function heatColor(t: number) {
  return t < 0.5 ? lerp([30, 58, 138], [245, 245, 220], t * 2) : lerp([245, 245, 220], [192, 57, 43], (t - 0.5) * 2)
}

const NX = 7, NZ = 8

function ZoneFrame() {
  return (
    <>
      <rect x={sx(ZONE.xMin)} y={sz(ZONE.zMax)} width={sx(ZONE.xMax) - sx(ZONE.xMin)}
        height={sz(ZONE.zMin) - sz(ZONE.zMax)} fill="none" stroke="#111" strokeWidth={1.5} />
      <polygon points={`${sx(-0.28)},${H - 12} ${sx(0.28)},${H - 12} ${sx(0.28)},${H - 8} ${sx(0)},${H - 4} ${sx(-0.28)},${H - 8}`}
        fill="#E2E8F0" stroke="#94A3B8" strokeWidth={0.5} />
    </>
  )
}

function Heatmap({ data }: { data: PitchLocation[] }) {
  const bins: number[][] = Array.from({ length: NZ }, () => Array(NX).fill(0))
  for (const p of data) {
    const ix = Math.min(NX - 1, Math.max(0, Math.floor(((p.plate_x - XR[0]) / (XR[1] - XR[0])) * NX)))
    const iz = Math.min(NZ - 1, Math.max(0, Math.floor(((p.plate_z - ZR[0]) / (ZR[1] - ZR[0])) * NZ)))
    bins[iz][ix]++
  }
  const max = Math.max(1, ...bins.flat())
  const cw = (W - PAD * 2) / NX, ch = (H - PAD * 2) / NZ
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: 240 }} data-testid="pitch-zone-map" className="block mx-auto cursor-pointer">
      {bins.map((row, iz) => row.map((c, ix) => (
        <rect key={`${iz}-${ix}`} x={PAD + ix * cw} y={PAD + (NZ - 1 - iz) * ch} width={cw} height={ch}
          fill={c === 0 ? '#F8FAFC' : heatColor(c / max)} fillOpacity={c === 0 ? 0.4 : 0.85} />
      )))}
      <ZoneFrame />
    </svg>
  )
}

function Scatter({ data, colorBy, hovered, onHover }: {
  data: PitchLocation[]; colorBy: 'pitch_type' | 'result'; hovered: number | null; onHover: (i: number | null) => void
}) {
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: 440 }} data-testid="pitch-zone-scatter" className="block mx-auto">
      <ZoneFrame />
      {data.map((p, i) => (
        <circle key={i} cx={sx(p.plate_x)} cy={sz(p.plate_z)} r={hovered === i ? 7 : 5}
          fill={dotColor(p, colorBy)} fillOpacity={hovered === null || hovered === i ? 0.8 : 0.25}
          stroke={hovered === i ? '#111' : '#fff'} strokeWidth={hovered === i ? 1.2 : 0.5}
          onMouseOver={() => onHover(i)} onMouseOut={() => onHover(null)} />
      ))}
    </svg>
  )
}

function detailText(p?: PitchLocation) {
  if (!p) return '점에 마우스를 올리면 상세 정보'
  return `${p.pitch_type}${p.velocity ? ` · ${p.velocity}km/h` : ''}${p.batter ? ` · vs ${p.batter}` : ''} · ${p.result}`
}

const PitchZoneMap = React.memo(function PitchZoneMap({ data }: PitchZoneMapProps) {
  const [open, setOpen] = useState(false)
  const [colorBy, setColorBy] = useState<'pitch_type' | 'result'>('pitch_type')
  const [hovered, setHovered] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-48 text-sm text-[var(--color-text-muted)]" data-testid="pitch-zone-empty">데이터가 없습니다.</div>
  }

  const types = Array.from(new Set(data.map(d => colorBy === 'result' ? d.result : d.pitch_type)))

  return (
    <div>
      <div onClick={() => setOpen(true)} title="클릭하면 개별 투구(산점도) 보기">
        <Heatmap data={data} />
      </div>
      <p className="text-[10px] text-center text-[var(--color-text-muted)] mt-1">밀도 히트맵 · 클릭 시 개별 투구</p>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)} data-testid="pitch-zone-modal">
          <div className="bg-white rounded-lg p-5 max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2 gap-3">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">투구 탄착군 ({data.length}구)</h3>
              <select className="text-xs border rounded px-1 py-0.5 ml-auto" value={colorBy}
                onChange={e => setColorBy(e.target.value as 'pitch_type' | 'result')} data-testid="loc-color-select">
                <option value="pitch_type">구종별</option>
                <option value="result">결과별</option>
              </select>
              <button className="text-xs bg-[var(--color-border)] rounded px-2 py-1" onClick={() => setOpen(false)}>닫기 ✕</button>
            </div>
            <Scatter data={data} colorBy={colorBy} hovered={hovered} onHover={setHovered} />
            <p className="text-xs text-center text-[var(--color-text-secondary)] mt-1 h-5 font-mono">{detailText(hovered !== null ? data[hovered] : undefined)}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 justify-center">
              {types.map(t => (
                <span key={t} className="flex items-center gap-1 text-[10px] text-[var(--color-text-secondary)]">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: colorBy === 'result' ? (RESULT_COLORS[t] ?? '#9CA3AF') : (PITCH_COLORS[t] ?? '#9CA3AF') }} />{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default PitchZoneMap
