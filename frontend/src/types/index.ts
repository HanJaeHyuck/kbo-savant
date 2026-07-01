export interface Player {
  id: number
  name: string
  team: string
  position: string
  throws?: string
  bats?: string
}

export interface ZoneData {
  zone: number
  pitches: number
  batting_avg: number
  whiff_pct: number
}

export interface SprayData {
  spray_x: number
  spray_y: number
  result: string
  exit_velocity: number
  launch_angle: number
}

export interface PitchType {
  pitch_type: string
  count: number
  pct: number
  avg_velocity: number
}

export interface VeloPoint {
  game_date: string
  avg_velocity: number
  [pitchType: string]: number | string
}

export interface MovementPoint {
  pitch_type: string
  count: number
  pct: number
  avg_velocity: number
  h_break: number
  v_break: number
}

export interface MovementProfileProps {
  data: MovementPoint[]
  armAngle?: number | null
}

export interface Percentiles {
  [key: string]: number
}

export interface StrikeZoneMapProps {
  data: ZoneData[]
  colorBy: 'batting_avg' | 'whiff_pct'
  width?: number
  height?: number
}

export interface SprayChartProps {
  data: SprayData[]
  colorBy: 'result' | 'exit_velocity'
  width?: number
  height?: number
}

export interface PitchMixProps {
  data: PitchType[]
  season: number
}

export interface VeloTrendProps {
  data: VeloPoint[]
  pitchType?: string
}

export interface PercentileBarProps {
  label: string
  value: number | string
  percentile: number
  tooltip?: string
  invertColor?: boolean
}

export interface RadarChartProps {
  players: {
    name: string
    data: { [stat: string]: number }
  }[]
  stats: string[]
}

export interface PlayerSearchInputProps {
  onSelect: (player: Player) => void
  placeholder?: string
}

export interface LeaderboardTableProps {
  data: LeaderboardRow[]
  type: 'batting' | 'pitching'
  onPlayerClick: (playerId: number) => void
}

export interface LeaderboardRow {
  rank: number
  player_id: number
  name: string
  team: string
  position: string
  [key: string]: number | string
}

// ── 선수 상세 확장 ──────────────────────────────

export interface PitchLocation {
  plate_x: number
  plate_z: number
  pitch_type: string
  result: string
  velocity?: number
  batter?: string
  bat_hand?: string | null
}

export interface PitchCountRow {
  count: string
  pitches: number
  breakdown: { pitch_type: string; pct: number }[]
}

export interface CareerRow {
  season: number
  [key: string]: number | null
}

export interface PitchZoneMapProps {
  data: PitchLocation[]
  colorBy?: 'pitch_type' | 'result'
  width?: number
  height?: number
}

export interface PitchCountBreakdownProps {
  data: PitchCountRow[]
}

export interface CareerSplitsTableProps {
  data: CareerRow[]
  type: 'batter' | 'pitcher'
  selectedYear: number
  onYearSelect: (year: number) => void
}

export interface ZoneGridCell {
  col: number
  row: number
  batting_avg: number
  whiff_pct: number
  weight: number
}

export interface ZoneHeatmapGridProps {
  data: ZoneGridCell[]
  metric: 'batting_avg' | 'whiff_pct'
}

export interface PitchArsenalRow {
  season: number
  pitch_type: string
  count: number
  rhb: number
  lhb: number
  pct: number
  velocity: number | null
  spin: number | null
  pa: number
  ab: number
  h: number
  b2: number
  b3: number
  hr: number
  so: number
  bbe: number
  ba: number | null
  xba: number | null
  slg: number | null
  xslg: number | null
  woba: number | null
  xwoba: number | null
  ev: number | null
  la: number | null
  whiff_pct: number
  putaway_pct: number
}

export interface PitchArsenalTableProps {
  rows: PitchArsenalRow[]
}

export interface RollingPoint {
  game_date: string
  velocity: number | null
  whiff_pct: number | null
  csw_pct: number | null
}

export interface RollingTrendProps {
  data: RollingPoint[]
}

export interface VsHandStat {
  pitches: number
  bbe: number
  whiff_pct: number
  csw_pct: number
  chase_pct: number
  ba: number
  woba: number
  hard_hit_pct: number
  avg_ev: number
}

export interface VsHandSplitsData {
  L: VsHandStat
  R: VsHandStat
}

export interface VsHandSplitsProps {
  data: VsHandSplitsData
}

export interface GameLogRow {
  game_date: string
  pitches: number
  k: number
  bb: number
  whiffs: number
  inplay: number
  avg_velocity: number | null
}

export interface GameLogTableProps {
  rows: GameLogRow[]
}
