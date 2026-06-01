import { Link } from 'react-router-dom'

interface ErrorMessageProps {
  type: 'not_found' | 'server_error' | 'network_error' | 'empty'
  onRetry?: () => void
}

const MESSAGES = {
  not_found: '선수를 찾을 수 없습니다.',
  server_error: '데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  network_error: '인터넷 연결을 확인해주세요.',
  empty: '데이터가 없습니다.',
}

export default function ErrorMessage({ type, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-6xl text-gray-200 mb-4">{type === 'not_found' ? '404' : '⚠️'}</p>
      <p className="text-[var(--color-text-primary)] font-medium mb-2">{MESSAGES[type]}</p>
      {type === 'not_found' && (
        <div className="flex gap-3 mt-4">
          <Link to="/" className="px-4 py-2 bg-[#041E42] text-white rounded text-sm">홈으로 돌아가기</Link>
          <Link to="/leaderboard" className="px-4 py-2 border border-gray-200 rounded text-sm">리더보드 보기</Link>
        </div>
      )}
      {onRetry && type !== 'not_found' && (
        <button onClick={onRetry} className="mt-4 px-4 py-2 bg-[#041E42] text-white rounded text-sm">
          다시 시도
        </button>
      )}
    </div>
  )
}
