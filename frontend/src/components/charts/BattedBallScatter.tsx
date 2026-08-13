import React from 'react'
import type { SprayData } from '../../types'

/*
 Baseball Savant 스타일 타구 산점도 — 발사각(X) × 타구속도(Y).
 배럴 존(EV>=158 & LA 26~30)을 음영으로 표시해 "좋은 타구" 영역을 직관화.
*/

const W = 300, H = 230
const PAD_L = 34, PAD_R = 10, PAD_T = 12, PAD_B = 28
const PW = W - PAD_L - PAD_R
const PH = H - PAD_T - PAD_B

const LA_RANGE = [-40, 70] as const   // 발사각(도)
const EV_RANGE = [100, 180] as const  // 타구속도(km/h)

const sx = (la: number) => PAD_L + ((la - LA_RANGE[0]) / (LA_RANGE[1] - LA_RANGE[0])) * PW
const sy = (ev: number) => PAD_T + ((EV_RANGE[1] - ev) / (EV_RANGE[1] - EV_RANGE[0])) * PH

const RESULT_COLOR: Record<string, string> = {
  홈런: '#C0392B', '3루타': '#E67E22', '2루타': '#E67E22',
  안타: '#F5A623', 아웃: '#94A3B8', 실책: '#94A3B8',
}
const colorOf = (r: string) => RESULT_COLOR[r] ?? '#94A3B8'

const LA_TICKS = [-30, 0, 30, 60]
const EV_TICKS = [110, 130, 150, 170]

const BattedBallScatter = React.memo(function BattedBallScatter({ data }: { data: SprayData[] }) {
  const pts = (data ?? []).filter(d => d.exit_velocity != null && d.launch_angle != null)
  if (pts.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-[var(--color-text-muted)]" data-testid="bb-scatter-empty">
        데이터가 없습니다.
      </div>
    )
  }

  // 배럴 존 사각형 (EV >= 158, LA 26~30)
  const bx = sx(26), bw = sx(30) - sx(26)
  const by = sy(EV_RANGE[1]), bh = sy(158) - sy(EV_RANGE[1])
  const barrels = pts.filter(p => p.exit_velocity >= 158 && p.launch_angle >= 26 && p.launch_angle <= 30).length
  const sweet = pts.filter(p => p.launch_angle >= 8 && p.launch_angle <= 32).length

  return (
    <div data-testid="bb-scatter">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block mx-auto" style={{ maxWidth: W }}>
        <rect x={PAD_L} y={PAD_T} width={PW} height={PH} fill="#F8FAFC" stroke="#E2E8F0" strokeWidth={0.5} />

        {/* 스위트스팟 밴드 (LA 8~32) */}
        <rect x={sx(8)} y={PAD_T} width={sx(32) - sx(8)} height={PH} fill="#3498DB" fillOpacity={0.07} />
        {/* 배럴 존 */}
        <rect x={bx} y={by} width={bw} height={bh} fill="#C0392B" fillOpacity={0.14} stroke="#C0392B"
          strokeWidth={0.8} strokeDasharray="3 2" />

        {/* 눈금 */}
        {LA_TICKS.map(t => (
          <g key={`x${t}`}>
            <line x1={sx(t)} y1={PAD_T} x2={sx(t)} y2={PAD_T + PH} stroke="#E2E8F0" strokeWidth={0.5} />
            <text x={sx(t)} y={H - 14} fontSize={8} fill="#94A3B8" textAnchor="middle">{t}°</text>
          </g>
        ))}
        {EV_TICKS.map(t => (
          <g key={`y${t}`}>
            <line x1={PAD_L} y1={sy(t)} x2={PAD_L + PW} y2={sy(t)} stroke="#E2E8F0" strokeWidth={0.5} />
            <text x={PAD_L - 4} y={sy(t) + 3} fontSize={8} fill="#94A3B8" textAnchor="end">{t}</text>
          </g>
        ))}

        {/* 타구 점 */}
        {pts.slice(0, 400).map((p, i) => (
          <circle key={i} cx={sx(p.launch_angle)} cy={sy(p.exit_velocity)} r={2.2}
            fill={colorOf(p.result)} fillOpacity={0.7} />
        ))}

        {/* 축 라벨 */}
        <text x={PAD_L + PW / 2} y={H - 3} fontSize={8} fill="#64748B" textAnchor="middle">발사각 (도)</text>
        <text x={10} y={PAD_T + PH / 2} fontSize={8} fill="#64748B" textAnchor="middle"
          transform={`rotate(-90 10 ${PAD_T + PH / 2})`}>타구속도 (km/h)</text>
      </svg>

      {/* 범례 + 요약 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10px] text-[var(--color-text-secondary)]">
        {['홈런', '2루타', '안타', '아웃'].map(r => (
          <span key={r} className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: colorOf(r) }} />{r}
          </span>
        ))}
        <span className="ml-auto font-mono">
          배럴 <b className="text-[#C0392B]">{barrels}</b> · 스위트스팟 <b>{sweet}</b> / {pts.length}타구
        </span>
      </div>
    </div>
  )
})

export default BattedBallScatter
