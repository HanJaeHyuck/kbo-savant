import React from 'react'
import type { PitchLocation } from '../../types'

/*
 Baseball Savant "Attack Zones (Swing/Take)" 스타일.
 스트라이크존 중심 기준 체비쇼프 거리로 4영역 분류:
   Heart(중심) · Shadow(경계) · Chase(유인) · Waste(완전 바깥)
 투구 좌표(plate_x/z)만으로 프론트에서 계산.
*/

const ZONE = { cx: 0, cz: 0.75, halfX: 0.28, halfZ: 0.30 }
const SWING = new Set(['헛스윙', '파울', '인플레이', '번트'])

type ZoneKey = 'heart' | 'shadow' | 'chase' | 'waste'
const ZONES: { key: ZoneKey; label: string; color: string }[] = [
  { key: 'heart', label: 'Heart (중심)', color: '#C0392B' },
  { key: 'shadow', label: 'Shadow (경계)', color: '#E67E22' },
  { key: 'chase', label: 'Chase (유인)', color: '#3498DB' },
  { key: 'waste', label: 'Waste (바깥)', color: '#1E3A8A' },
]

function classify(x: number, z: number): ZoneKey {
  const nx = Math.abs(x - ZONE.cx) / ZONE.halfX
  const nz = Math.abs(z - ZONE.cz) / ZONE.halfZ
  const r = Math.max(nx, nz)
  if (r <= 0.67) return 'heart'
  if (r <= 1.33) return 'shadow'
  if (r <= 2.0) return 'chase'
  return 'waste'
}

// SVG 중첩 박스 반치수(px) — viewBox 200, 중심 100
const HALF: Record<ZoneKey, number> = { heart: 28, shadow: 57, chase: 85, waste: 97 }
const C = 100

const AttackZones = React.memo(function AttackZones({ data }: { data: PitchLocation[] }) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-40 text-sm text-[var(--color-text-muted)]" data-testid="attack-zones-empty">데이터가 없습니다.</div>
  }

  const agg: Record<ZoneKey, { count: number; swings: number; whiffs: number; inplay: number }> = {
    heart: { count: 0, swings: 0, whiffs: 0, inplay: 0 },
    shadow: { count: 0, swings: 0, whiffs: 0, inplay: 0 },
    chase: { count: 0, swings: 0, whiffs: 0, inplay: 0 },
    waste: { count: 0, swings: 0, whiffs: 0, inplay: 0 },
  }
  for (const p of data) {
    if (p.plate_x == null || p.plate_z == null) continue
    const k = classify(p.plate_x, p.plate_z)
    const a = agg[k]
    a.count++
    if (SWING.has(p.result)) a.swings++
    if (p.result === '헛스윙') a.whiffs++
    if (p.result === '인플레이') a.inplay++
  }
  const total = data.length
  const maxPct = Math.max(...ZONES.map(z => agg[z.key].count / total), 0.0001)
  const pctOf = (k: ZoneKey) => (agg[k].count / total) * 100
  const swingPct = (k: ZoneKey) => (agg[k].swings ? (agg[k].swings / agg[k].count) * 100 : 0)
  const whiffPct = (k: ZoneKey) => (agg[k].swings ? (agg[k].whiffs / agg[k].swings) * 100 : 0)

  const colorFor = (z: { key: ZoneKey; color: string }) =>
    z.color
  const opacityFor = (k: ZoneKey) => 0.25 + 0.65 * ((agg[k].count / total) / maxPct)

  // 라벨 위치 (각 링 영역)
  const labelPos: Record<ZoneKey, { x: number; y: number }> = {
    heart: { x: C, y: C },
    shadow: { x: C, y: C - (HALF.heart + HALF.shadow) / 2 },
    chase: { x: C, y: C - (HALF.shadow + HALF.chase) / 2 },
    waste: { x: C, y: C - (HALF.chase + HALF.waste) / 2 },
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center" data-testid="attack-zones">
      {/* 중첩 박스 그래픽 */}
      <svg width="100%" viewBox="0 0 200 200" style={{ maxWidth: 200 }} className="shrink-0">
        {/* 바깥→안쪽 순서로 그려 겹침 */}
        {(['waste', 'chase', 'shadow', 'heart'] as ZoneKey[]).map(k => {
          const z = ZONES.find(zz => zz.key === k)!
          const h = HALF[k]
          return (
            <rect key={k} x={C - h} y={C - h} width={h * 2} height={h * 2}
              rx={3} fill={colorFor(z)} fillOpacity={opacityFor(k)}
              stroke="#fff" strokeWidth={1} />
          )
        })}
        {/* 실제 스트라이크존 경계 (r=1.0) */}
        <rect x={C - 42.5} y={C - 42.5} width={85} height={85} fill="none"
          stroke="#111827" strokeWidth={1.6} strokeDasharray="4 2" />
        {/* 영역별 투구% 라벨 */}
        {ZONES.map(z => (
          <text key={z.key} x={labelPos[z.key].x} y={labelPos[z.key].y}
            fontSize={9} fontWeight="bold" textAnchor="middle" fill="#fff"
            style={{ paintOrder: 'stroke' }} stroke="#0008" strokeWidth={0.4}>
            {pctOf(z.key).toFixed(0)}%
          </text>
        ))}
      </svg>

      {/* 표 */}
      <table className="w-full text-[11px]" data-testid="attack-zones-table">
        <thead>
          <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
            <th className="text-left font-normal py-1">영역</th>
            <th className="text-right font-normal py-1">투구%</th>
            <th className="text-right font-normal py-1">스윙%</th>
            <th className="text-right font-normal py-1">Whiff%</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {ZONES.map(z => (
            <tr key={z.key} className="border-b border-[#F1F5F9]">
              <td className="py-1 font-sans">
                <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle" style={{ background: z.color }} />
                <span className="text-[var(--color-text-primary)]">{z.label}</span>
              </td>
              <td className="text-right text-[var(--color-text-primary)]">{pctOf(z.key).toFixed(1)}</td>
              <td className="text-right text-[var(--color-text-secondary)]">{swingPct(z.key).toFixed(0)}</td>
              <td className="text-right text-[var(--color-text-secondary)]">{whiffPct(z.key).toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})

export default AttackZones
