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

function colorFor(p: PitchLocation, colorBy: 'pitch_type' | 'result') {
  if (colorBy === 'result') return RESULT_COLORS[p.result] ?? '#9CA3AF'
  return PITCH_COLORS[p.pitch_type] ?? '#9CA3AF'
}

const W = 220, H = 260, PAD = 24
const ZONE = { xMin: -0.28, xMax: 0.28, zMin: 0.45, zMax: 1.05 }
const X_RANGE = [-0.7, 0.7], Z_RANGE = [0, 1.3]
const sx = (x: number) => PAD + ((x - X_RANGE[0]) / (X_RANGE[1] - X_RANGE[0])) * (W - PAD * 2)
const sz = (z: number) => H - PAD - ((z - Z_RANGE[0]) / (Z_RANGE[1] - Z_RANGE[0])) * (H - PAD * 2)

function Field({ data, colorBy, r, hovered, onHover, big }: {
  data: PitchLocation[]; colorBy: 'pitch_type' | 'result'; r: number;
  hovered: number | null; onHover: (i: number | null) => void; big?: boolean
}) {
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: big ? 460 : 240 }}
      data-testid="pitch-zone-map" className="cursor-pointer block mx-auto">
      <rect x={sx(ZONE.xMin)} y={sz(ZONE.zMax)} width={sx(ZONE.xMax) - sx(ZONE.xMin)}
        height={sz(ZONE.zMin) - sz(ZONE.zMax)} fill="none" stroke="#334155" strokeWidth={1.5} />
      {[1, 2].map(i => {
        const x = ZONE.xMin + ((ZONE.xMax - ZONE.xMin) * i) / 3
        const z = ZONE.zMin + ((ZONE.zMax - ZONE.zMin) * i) / 3
        return (
          <g key={i} stroke="#CBD5E1" strokeWidth={0.5}>
            <line x1={sx(x)} y1={sz(ZONE.zMax)} x2={sx(x)} y2={sz(ZONE.zMin)} />
            <line x1={sx(ZONE.xMin)} y1={sz(z)} x2={sx(ZONE.xMax)} y2={sz(z)} />
          </g>
        )
      })}
      <polygon points={`${sx(-0.28)},${H - 12} ${sx(0.28)},${H - 12} ${sx(0.28)},${H - 8} ${sx(0)},${H - 4} ${sx(-0.28)},${H - 8}`}
        fill="#E2E8F0" stroke="#94A3B8" strokeWidth={0.5} />
      {data.map((p, i) => (
        <circle key={i} cx={sx(p.plate_x)} cy={sz(p.plate_z)}
          r={hovered === i ? r + 2.5 : r}
          fill={colorFor(p, colorBy)} fillOpacity={hovered === null || hovered === i ? 0.8 : 0.25}
          stroke={hovered === i ? '#111' : '#fff'} strokeWidth={hovered === i ? 1.2 : 0.5}
          onMouseEnter={() => onHover(i)} onMouseLeave={() => onHover(null)} />
      ))}
    </svg>
  )
}

function Legend({ data, colorBy }: { data: PitchLocation[]; colorBy: 'pitch_type' | 'result' }) {
  const types = Array.from(new Set(data.map(d => (colorBy === 'result' ? d.result : d.pitch_type))))
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center min-h-[34px] content-start">
      {types.map(t => (
        <span key={t} className="flex items-center gap-1 text-[10px] text-[var(--color-text-secondary)]">
          <span className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ background: colorBy === 'result' ? (RESULT_COLORS[t] ?? '#9CA3AF') : (PITCH_COLORS[t] ?? '#9CA3AF') }} />
          {t}
        </span>
      ))}
    </div>
  )
}

function detailText(p: PitchLocation | undefined): string {
  if (!p) return '점에 마우스를 올리면 상세 정보'
  const v = p.velocity ? ` · ${p.velocity}km/h` : ''
  const b = p.batter ? ` · vs ${p.batter}` : ''
  return `${p.pitch_type}${v}${b} · ${p.result}`
}

const PitchZoneMap = React.memo(function PitchZoneMap({ data, colorBy = 'pitch_type' }: PitchZoneMapProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [enlarged, setEnlarged] = useState(false)

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-[var(--color-text-muted)]" data-testid="pitch-zone-empty">
        데이터가 없습니다.
      </div>
    )
  }

  return (
    <div>
      <div onClick={() => setEnlarged(true)} title="클릭하면 크게 보기">
        <Field data={data} colorBy={colorBy} r={3.5} hovered={hovered} onHover={setHovered} />
      </div>
      {/* 상세 정보 — 고정 높이로 레이아웃 흔들림 방지 */}
      <p className="text-[11px] text-center text-[var(--color-text-secondary)] mt-1 h-4 truncate font-mono">
        {detailText(hovered !== null ? data[hovered] : undefined)}
      </p>
      <Legend data={data} colorBy={colorBy} />

      {/* 크게 보기 모달 */}
      {enlarged && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setEnlarged(false)} data-testid="pitch-zone-modal">
          <div className="bg-white rounded-lg p-5 max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">투구 탄착군 (전체 {data.length}구)</h3>
              <button className="text-xs bg-[var(--color-border)] rounded px-2 py-1" onClick={() => setEnlarged(false)}>닫기 ✕</button>
            </div>
            <Field data={data} colorBy={colorBy} r={5} hovered={hovered} onHover={setHovered} big />
            <p className="text-xs text-center text-[var(--color-text-secondary)] mt-1 h-5 font-mono">
              {detailText(hovered !== null ? data[hovered] : undefined)}
            </p>
            <Legend data={data} colorBy={colorBy} />
          </div>
        </div>
      )}
    </div>
  )
})

export default PitchZoneMap
