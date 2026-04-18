interface Props {
  active: 'scores' | 'forfeits' | 'teams'
  onChange: (tab: 'scores' | 'forfeits' | 'teams') => void
}

const tabs = [
  { id: 'scores' as const, label: 'Scores', emoji: '🏆' },
  { id: 'forfeits' as const, label: 'Forfeit Wheel', emoji: '🎡' },
  { id: 'teams' as const, label: 'Teams', emoji: '👥' },
]

export function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800">
      <div className="flex">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => onChange(tab.id)}
            className={`flex-1 py-3 text-center text-xs ${active === tab.id ? 'text-white' : 'text-gray-500'}`}>
            <div className="text-lg">{tab.emoji}</div>
            <div>{tab.label}</div>
          </button>
        ))}
      </div>
    </nav>
  )
}
