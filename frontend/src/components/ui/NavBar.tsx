import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const BallIcon = () => (
  <svg width="20" height="20" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="12" fill="#fff"/>
    <path d="M8 7 Q14 10 8 21" fill="none" stroke="#C0392B" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M20 7 Q14 10 20 21" fill="none" stroke="#C0392B" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="9" y1="10" x2="7" y2="12" stroke="#C0392B" strokeWidth="1" strokeLinecap="round"/>
    <line x1="9" y1="14" x2="7" y2="16" stroke="#C0392B" strokeWidth="1" strokeLinecap="round"/>
    <line x1="19" y1="10" x2="21" y2="12" stroke="#C0392B" strokeWidth="1" strokeLinecap="round"/>
    <line x1="19" y1="14" x2="21" y2="16" stroke="#C0392B" strokeWidth="1" strokeLinecap="round"/>
  </svg>
)

export default function NavBar() {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')

  return (
    <>
      <nav className="bg-[#041E42] text-white px-4 py-3 hidden md:flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-wide">
          <BallIcon />
          <span>KBO Savant</span>
        </Link>
        <Link to="/" className="text-sm hover:text-blue-200 transition-colors">홈</Link>
        <Link to="/leaderboard" className="text-sm hover:text-blue-200 transition-colors">리더보드</Link>
        <Link to="/compare" className="text-sm hover:text-blue-200 transition-colors">선수 비교</Link>
        <div className="ml-auto">
          <button onClick={toggleTheme} className="text-sm hover:text-blue-200">
            {theme === 'light' ? '🌙 다크' : '☀️ 라이트'}
          </button>
        </div>
      </nav>

      <nav className="fixed bottom-0 left-0 right-0 md:hidden h-14 bg-[#041E42] text-white flex items-center justify-around z-50">
        <Link to="/" className="flex flex-col items-center text-xs gap-1">
          <span>🏠</span><span>홈</span>
        </Link>
        <Link to="/leaderboard" className="flex flex-col items-center text-xs gap-1">
          <span>📊</span><span>리더보드</span>
        </Link>
        <Link to="/compare" className="flex flex-col items-center text-xs gap-1">
          <span>⚖️</span><span>비교</span>
        </Link>
      </nav>
    </>
  )
}
