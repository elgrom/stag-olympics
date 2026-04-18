import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
  const [activeTab, setActiveTab] = useState<'scores' | 'forfeits' | 'teams'>('scores')
  const [scoreTab, setScoreTab] = useState<'teams' | 'individual'>('teams')
  const { teams, players, rounds, totals, roundScores, individualRankings, currentRound } = useEventData()
  const { forfeits, markUsed } = useForfeits()

  // Show quiz view when Round 1 is live
  const isQuizActive = currentRound?.number === 1

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {isQuizActive && <QuizPlayer players={players} />}
      {!isQuizActive && activeTab === 'scores' && (
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
      {!isQuizActive && activeTab === 'forfeits' && <ForfeitWheel forfeits={forfeits} onMarkUsed={markUsed} />}
      {!isQuizActive && activeTab === 'teams' && <TeamRosters teams={teams} players={players} />}
      {!isQuizActive && <BottomNav active={activeTab} onChange={setActiveTab} />}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
