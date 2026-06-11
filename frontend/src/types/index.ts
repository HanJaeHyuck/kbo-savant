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
