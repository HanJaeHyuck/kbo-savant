import { useState, useRef, useEffect, useCallback } from 'react'
import { usePlayerSearch } from '../../hooks/usePlayerSearch'
import type { Player, PlayerSearchInputProps } from '../../types'

export default function PlayerSearchInput({ onSelect, placeholder = '선수명 검색' }: PlayerSearchInputProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const { results, search } = usePlayerSearch()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setQuery(v)
    setActiveIdx(-1)
    search(v)
    setOpen(v.length >= 2)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      setActiveIdx(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      setActiveIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      handleSelect(results[activeIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const handleSelect = useCallback((player: Player) => {
    setQuery(player.name)
    setOpen(false)
    onSelect(player)
  }, [onSelect])

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-mid)]"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-[var(--color-border)] rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((player, idx) => (
            <li
              key={player.id}
              className={`px-4 py-2 cursor-pointer flex items-center gap-3 ${idx === activeIdx ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              onMouseDown={() => handleSelect(player)}
            >
              <span className="font-medium text-[var(--color-text-primary)]">{player.name}</span>
              <span className="text-sm text-[var(--color-text-secondary)]">{player.team}</span>
              <span className="text-xs text-[var(--color-text-muted)] ml-auto">{player.position}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
