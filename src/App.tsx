import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

function usePageTitle(title: string) {
  useEffect(() => { document.title = title }, [title])
}
import { useEventData } from './hooks/useEventData'
import { useForfeits } from './hooks/useForfeits'
import { ScoreHeader } from './components/ScoreHeader'
import { RoundTimeline } from './components/RoundTimeline'
import { IndividualBoard } from './components/IndividualBoard'
import { TeamRosters } from './components/TeamRosters'
import { ForfeitWheel } from './components/ForfeitWheel'
import { BottomNav } from './components/BottomNav'
import { AdminPanel } from './components/admin/AdminPanel'
import { QuizPlayer } from './components/QuizPlayer'

function MainApp() {
  usePageTitle('🏆 Stag Olympics — Leaderboard')
  const [activeTab, setActiveTab] = useState<'scores' | 'forfeits' | 'teams'>('scores')
  const [scoreTab, setScoreTab] = useState<'teams' | 'individual'>('teams')
  const { teams, players, rounds, totals, roundScores, individualRankings, currentRound } = useEventData()
  const { forfeits, markUsed } = useForfeits()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {activeTab === 'scores' && (
        <>
          <ScoreHeader teams={teams} totals={totals} currentRound={currentRound} />
          <div className="flex border-b border-gray-800 mx-4 mb-3">
            <button onClick={() => setScoreTab('teams')}
              className={`flex-1 py-2 text-sm font-medium ${scoreTab === 'teams' ? 'text-white border-b-2 border-white' : 'text-gray-500'}`}>
              Teams
            </button>
            <button onClick={() => setScoreTab('individual')}
              className={`flex-1 py-2 text-sm font-medium ${scoreTab === 'individual' ? 'text-white border-b-2 border-white' : 'text-gray-500'}`}>
              Individual
            </button>
          </div>
          {scoreTab === 'teams' && <RoundTimeline rounds={rounds} teams={teams} roundScores={roundScores} />}
          {scoreTab === 'individual' && <IndividualBoard rankings={individualRankings} teams={teams} />}
        </>
      )}
      {activeTab === 'forfeits' && <ForfeitWheel forfeits={forfeits} onMarkUsed={markUsed} />}
      {activeTab === 'teams' && <TeamRosters teams={teams} players={players} />}
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}

function QuizPage() {
  usePageTitle('🧠 Stag Olympics — Quiz')
  const { players } = useEventData()
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <QuizPlayer players={players} />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
