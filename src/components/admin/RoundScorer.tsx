import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { Round, Team, Player } from '../../lib/types'

interface Props {
  round: Round
  teams: Team[]
  players: Player[]
}

export function RoundScorer({ round, teams, players }: Props) {
  const [matchNumber, setMatchNumber] = useState(1)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const scoreMatch = async (winningTeamId: string) => {
    setSaving(true)
    setMessage('')
    const losingTeamId = teams.find(t => t.id !== winningTeamId)!.id
    const scores = [
      { round_id: round.id, team_id: winningTeamId, match_number: round.has_sub_matches ? matchNumber : null, points: round.points_per_win },
      { round_id: round.id, team_id: losingTeamId, match_number: round.has_sub_matches ? matchNumber : null, points: round.points_per_loss },
    ]
    const { error } = await supabase.from('team_scores').insert(scores)
    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      const winnerName = teams.find(t => t.id === winningTeamId)!.name
      setMessage(`✅ ${winnerName} wins${round.has_sub_matches ? ` match ${matchNumber}` : ''}! (+${round.points_per_win} pts)`)
      if (round.has_sub_matches) setMatchNumber(prev => prev + 1)
    }
    setSaving(false)
  }

  const scoreQuiz = async (scoreA: number, scoreB: number) => {
    setSaving(true)
    setMessage('')
    const scores = [
      { round_id: round.id, team_id: teams[0].id, match_number: null, points: scoreA },
      { round_id: round.id, team_id: teams[1].id, match_number: null, points: scoreB },
    ]
    const { error } = await supabase.from('team_scores').insert(scores)
    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage(`✅ Scores saved: ${teams[0].name} ${scoreA} - ${scoreB} ${teams[1].name}`)
    }
    setSaving(false)
  }

  if (round.number === 1) {
    return <QuizScorer teams={teams} onSubmit={scoreQuiz} saving={saving} message={message} />
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-4">
      <h3 className="font-bold text-sm mb-1">{round.emoji} R{round.number}: {round.name}</h3>
      <p className="text-xs text-gray-500 mb-3">{round.scoring_guidance}</p>
      {round.has_sub_matches && (
        <p className="text-xs text-yellow-400 mb-2">Match {matchNumber} of {round.sub_match_count}</p>
      )}
      <p className="text-xs text-gray-400 mb-2">Who won?</p>
      <div className="flex gap-2">
        {teams.map(team => (
          <button key={team.id} onClick={() => scoreMatch(team.id)} disabled={saving}
            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded font-medium text-sm disabled:opacity-50">
            {team.name}
          </button>
        ))}
      </div>
      {message && <p className="text-xs mt-2 text-center">{message}</p>}
    </div>
  )
}

function QuizScorer({ teams, onSubmit, saving, message }: {
  teams: Team[]; onSubmit: (a: number, b: number) => void; saving: boolean; message: string
}) {
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-4">
      <h3 className="font-bold text-sm mb-1">🧠 R1: How Well Do You Know Diccon?</h3>
      <p className="text-xs text-gray-500 mb-3">Enter each team's correct answer count (0-10)</p>
      <div className="flex gap-4 mb-3">
        {teams.map((team, i) => (
          <div key={team.id} className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">{team.name}</label>
            <input type="number" min={0} max={10} value={i === 0 ? scoreA : scoreB}
              onChange={e => i === 0 ? setScoreA(parseInt(e.target.value) || 0) : setScoreB(parseInt(e.target.value) || 0)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-center" />
          </div>
        ))}
      </div>
      <button onClick={() => onSubmit(scoreA, scoreB)} disabled={saving}
        className="w-full py-2 bg-blue-700 hover:bg-blue-600 rounded text-sm font-medium disabled:opacity-50">
        Submit Quiz Scores
      </button>
      {message && <p className="text-xs mt-2 text-center">{message}</p>}
    </div>
  )
}
