import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { ROUND_INFO } from '../../lib/round-info'
import { displayName } from '../../lib/types'
import type { Round, Team, Player, Forfeit } from '../../lib/types'
import type { CeremonyPhase } from '../../hooks/useForfeitCeremony'

interface Props {
  round: Round
  teams: Team[]
  players: Player[]
  forfeits: Forfeit[]
  onMarkForfeitUsed: (id: string) => void
  onCeremonyUpdate: (fields: { phase?: CeremonyPhase; winner_name?: string; loser_name?: string; stag_forfeit?: string; loser_forfeit?: string; loser_penalty?: string }) => void
}

// How many players per side for each round with individual scoring
const PLAYERS_PER_SIDE: Record<number, number> = {
  2: 3, // Petanque 3v3
  4: 2, // Beer Pong 2v2
  5: 2, // Tennis 2v2
}

export function RoundScorer({ round, teams, players, forfeits, onMarkForfeitUsed, onCeremonyUpdate }: Props) {
  const [matchNumber, setMatchNumber] = useState(1)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [forfeitPhase, setForfeitPhase] = useState<'none' | 'stag' | 'loser' | 'done'>('none')
  const [lastWinnerId, setLastWinnerId] = useState<string | null>(null)
  const [forfeitResult, setForfeitResult] = useState<string | null>(null)
  const [loserChoice, setLoserChoice] = useState<'forfeit' | 'penalty' | null>(null)

  // Lineups: { [matchNumber]: { [teamId]: playerId[] } }
  const [lineups, setLineups] = useState<Record<number, Record<string, string[]>>>({})

  const playersPerSide = PLAYERS_PER_SIDE[round.number] ?? 2

  const getLineup = (match: number, teamId: string): string[] => {
    return lineups[match]?.[teamId] ?? []
  }

  const togglePlayer = (match: number, teamId: string, playerId: string) => {
    setLineups(prev => {
      const current = prev[match]?.[teamId] ?? []
      const updated = current.includes(playerId)
        ? current.filter(id => id !== playerId)
        : current.length < playersPerSide
          ? [...current, playerId]
          : current
      return {
        ...prev,
        [match]: { ...prev[match], [teamId]: updated },
      }
    })
  }

  const scoreMatch = async (winningTeamId: string) => {
    setSaving(true)
    setMessage('')
    const losingTeamId = teams.find(t => t.id !== winningTeamId)!.id
    const matchNum = round.has_sub_matches ? matchNumber : null

    // Insert team scores
    const { error } = await supabase.from('team_scores').insert([
      { round_id: round.id, team_id: winningTeamId, match_number: matchNum, points: round.points_per_win },
      { round_id: round.id, team_id: losingTeamId, match_number: matchNum, points: round.points_per_loss },
    ])

    if (error) {
      setMessage(`Error: ${error.message}`)
      setSaving(false)
      return
    }

    // Insert individual scores for winning players
    if (round.has_individual_scoring) {
      const winningPlayers = getLineup(matchNumber, winningTeamId)
      if (winningPlayers.length > 0) {
        await supabase.from('individual_scores').insert(
          winningPlayers.map(playerId => ({
            round_id: round.id,
            player_id: playerId,
            match_number: matchNum,
            points: 1,
          }))
        )
      }
    }

    const winnerName = teams.find(t => t.id === winningTeamId)!.name
    setMessage(`✅ ${winnerName} wins${round.has_sub_matches ? ` match ${matchNumber}` : ''}! (+${round.points_per_win} pts)`)
    setLastWinnerId(winningTeamId)

    // Don't auto-start ceremony — admin triggers it manually

    if (round.has_sub_matches) setMatchNumber(prev => prev + 1)
    setSaving(false)
  }

  const spinForfeit = useCallback((): string | null => {
    const available = forfeits.filter(f => !f.is_used)
    if (available.length === 0) {
      setForfeitResult('No forfeits left!')
      return null
    }
    const chosen = available[Math.floor(Math.random() * available.length)]
    setForfeitResult(chosen.text)
    onMarkForfeitUsed(chosen.id)
    return chosen.text
  }, [forfeits, onMarkForfeitUsed])

  const nextRoundNumber = round.number + 1
  const nextRoundInfo = ROUND_INFO[nextRoundNumber]
  const nextPenalty = nextRoundInfo?.penalty

  // Quiz handled elsewhere
  if (round.number === 1) {
    return <QuizScorer teams={teams} onSubmit={async (a, b) => {
      setSaving(true)
      setMessage('')
      const { error } = await supabase.from('team_scores').insert([
        { round_id: round.id, team_id: teams[0].id, match_number: null, points: a },
        { round_id: round.id, team_id: teams[1].id, match_number: null, points: b },
      ])
      if (error) setMessage(`Error: ${error.message}`)
      else setMessage(`✅ Scores saved: ${teams[0].name} ${a} - ${b} ${teams[1].name}`)
      setSaving(false)
    }} saving={saving} message={message} />
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-4">
      <h3 className="font-bold text-sm mb-1">{round.emoji} R{round.number}: {round.name}</h3>

      {/* Round info panel */}
      {ROUND_INFO[round.number] && (
        <RoundInfoPanel info={ROUND_INFO[round.number]} />
      )}

      {round.has_sub_matches && (
        <p className="text-xs text-yellow-400 mb-2">
          Match {matchNumber} of {round.sub_match_count}
        </p>
      )}

      {/* Lineup picker for rounds with individual scoring */}
      {round.has_individual_scoring && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2">
            Pick {playersPerSide} players per team for match {matchNumber}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {teams.map(team => {
              const teamPlayers = players.filter(p => p.team_id === team.id)
              const selected = getLineup(matchNumber, team.id)

              // Collect players already used in previous matches
              const usedInPrevious = new Set<string>()
              for (let m = 1; m < matchNumber; m++) {
                for (const id of getLineup(m, team.id)) {
                  usedInPrevious.add(id)
                }
              }

              return (
                <div key={team.id}>
                  <p className="text-xs text-gray-500 mb-1 font-medium">{team.name} ({selected.length}/{playersPerSide})</p>
                  <div className="space-y-1">
                    {teamPlayers
                      .sort((a, b) => a.first_name.localeCompare(b.first_name))
                      .map(p => {
                        const isSelected = selected.includes(p.id)
                        const isUsed = usedInPrevious.has(p.id)
                        const isFull = selected.length >= playersPerSide && !isSelected
                        return (
                          <button key={p.id}
                            onClick={() => !isUsed && togglePlayer(matchNumber, team.id, p.id)}
                            disabled={isFull || isUsed}
                            className={`w-full py-1.5 px-2 rounded text-xs text-left ${
                              isUsed
                                ? 'bg-gray-800/30 text-gray-600 line-through'
                                : isSelected
                                  ? 'bg-blue-700 text-white'
                                  : isFull
                                    ? 'bg-gray-800/50 text-gray-600'
                                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            }`}>
                            {displayName(p)}
                            {isUsed && <span className="ml-1 no-underline">✓</span>}
                          </button>
                        )
                      })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Score buttons */}
      {forfeitPhase === 'none' && (
        <>
          <p className="text-xs text-gray-400 mb-2">Who won?</p>
          <div className="flex gap-2">
            {teams.map(team => (
              <button key={team.id} onClick={() => scoreMatch(team.id)} disabled={saving}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded font-medium text-sm disabled:opacity-50">
                {team.name}
              </button>
            ))}
          </div>
        </>
      )}

      {message && <p className="text-xs mt-2 text-center">{message}</p>}

      {/* Manual trigger for forfeit ceremony after scoring */}
      {forfeitPhase === 'none' && lastWinnerId && (
        <button onClick={() => {
          setForfeitPhase('stag')
          const winnerName = teams.find(t => t.id === lastWinnerId)!.name
          const loserName = teams.find(t => t.id !== lastWinnerId)!.name
          onCeremonyUpdate({ phase: 'stag_spinning', winner_name: winnerName, loser_name: loserName })
        }}
          className="w-full py-2 mt-3 bg-yellow-700 hover:bg-yellow-600 rounded text-sm font-medium">
          🎡 Start Forfeit Ceremony
        </button>
      )}

      {/* ── FORFEIT CEREMONY ── */}
      {forfeitPhase !== 'none' && (
        <div className="bg-gray-800 rounded-lg p-4 mt-3 space-y-3">
          <h4 className="font-bold text-sm text-yellow-400">🎡 Forfeit Ceremony</h4>

          {/* Step 1: Spin for Diccon */}
          {forfeitPhase === 'stag' && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Step 1: Spin for Diccon (the stag)</p>
              {!forfeitResult ? (
                <button onClick={() => {
                  onCeremonyUpdate({ phase: 'stag_spinning' })
                  setTimeout(() => {
                    const result = spinForfeit()
                    if (result) onCeremonyUpdate({ phase: 'stag_result', stag_forfeit: result })
                  }, 1500)
                }}
                  className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 rounded font-bold text-sm">
                  🎰 Spin the Wheel for Diccon
                </button>
              ) : (
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Diccon must do:</p>
                  <p className="text-lg font-bold text-yellow-400">{forfeitResult}</p>
                  <button onClick={() => { setForfeitResult(null); setForfeitPhase('loser'); onCeremonyUpdate({ phase: 'stag_result' }) }}
                    className="mt-3 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                    Next → Losing Team
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Losing team choice */}
          {forfeitPhase === 'loser' && (
            <div>
              <p className="text-xs text-gray-400 mb-2">
                Step 2: {teams.find(t => t.id !== lastWinnerId)?.name} — forfeit or penalty?
              </p>

              {!loserChoice && (
                <div className="flex gap-2">
                  <button onClick={() => setLoserChoice('forfeit')}
                    className="flex-1 py-3 bg-red-700 hover:bg-red-600 rounded font-medium text-sm">
                    🎰 Spin a Forfeit
                  </button>
                  <button onClick={() => {
                    setLoserChoice('penalty')
                    onCeremonyUpdate({ phase: 'loser_penalty', loser_penalty: nextPenalty ?? 'No penalty' })
                  }}
                    className="flex-1 py-3 bg-orange-700 hover:bg-orange-600 rounded font-medium text-sm">
                    ⚠️ Take Penalty
                  </button>
                </div>
              )}

              {loserChoice === 'forfeit' && !forfeitResult && (
                <button onClick={() => {
                  onCeremonyUpdate({ phase: 'loser_spinning' })
                  setTimeout(() => {
                    const result = spinForfeit()
                    if (result) onCeremonyUpdate({ phase: 'loser_forfeit', loser_forfeit: result })
                  }, 1500)
                }}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 rounded font-bold text-sm">
                  🎰 Spin the Wheel
                </button>
              )}

              {loserChoice === 'forfeit' && forfeitResult && (
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">{teams.find(t => t.id !== lastWinnerId)?.name} must do:</p>
                  <p className="text-lg font-bold text-red-400">{forfeitResult}</p>
                  <button onClick={() => {
                    setForfeitPhase('done')
                    onCeremonyUpdate({ phase: 'done' })
                  }}
                    className="mt-3 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                    Done ✓
                  </button>
                </div>
              )}

              {loserChoice === 'penalty' && (
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">
                    {teams.find(t => t.id !== lastWinnerId)?.name} takes the penalty into R{nextRoundNumber}:
                  </p>
                  <p className="text-lg font-bold text-orange-400">⚠️ {nextPenalty ?? 'No penalty defined'}</p>
                  <button onClick={() => {
                    setForfeitPhase('done')
                    onCeremonyUpdate({ phase: 'done' })
                  }}
                    className="mt-3 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                    Done ✓
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Done */}
          {forfeitPhase === 'done' && (
            <div className="text-center">
              <p className="text-xs text-green-400 mb-2">✅ Forfeit ceremony complete — end the round when ready.</p>
              <button onClick={() => onCeremonyUpdate({ phase: 'idle' })}
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-400">
                Dismiss from public screen
              </button>
            </div>
          )}
        </div>
      )}
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

function RoundInfoPanel({ info }: { info: import('../../lib/round-info').RoundInfo }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mb-3">
      <button onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-400 mb-1">
        {expanded ? '▼ Hide details' : '▶ Rules, kit & drinking'}
      </button>
      {expanded && (
        <div className="bg-gray-800 rounded p-3 text-xs space-y-2">
          <div>
            <span className="text-gray-500 uppercase tracking-wide text-[10px]">Format</span>
            <p className="text-gray-300 mt-0.5">{info.format}</p>
          </div>
          <div>
            <span className="text-gray-500 uppercase tracking-wide text-[10px]">Scoring</span>
            <p className="text-gray-300 mt-0.5">{info.scoring}</p>
          </div>
          {info.rules && (
            <div>
              <span className="text-gray-500 uppercase tracking-wide text-[10px]">Game Rules</span>
              <ol className="text-gray-300 mt-1 space-y-1 list-decimal list-inside">
                {info.rules.map((rule, i) => (
                  <li key={i} className="leading-snug">{rule}</li>
                ))}
              </ol>
            </div>
          )}
          <div>
            <span className="text-gray-500 uppercase tracking-wide text-[10px]">Kit needed</span>
            <p className="text-gray-300 mt-0.5">{info.kit}</p>
          </div>
          <div>
            <span className="text-gray-500 uppercase tracking-wide text-[10px]">Drinking rule</span>
            <p className="text-yellow-400 mt-0.5">🍺 {info.drinking}</p>
          </div>
          {info.penalty && (
            <div>
              <span className="text-gray-500 uppercase tracking-wide text-[10px]">Penalty (if loser skips forfeit)</span>
              <p className="text-orange-400 mt-0.5">⚠️ {info.penalty}</p>
            </div>
          )}
          <div className="border-t border-gray-700 pt-2 mt-2">
            <span className="text-gray-500 uppercase tracking-wide text-[10px]">End of round</span>
            <p className="text-gray-300 mt-0.5">1. Winner spins the wheel → Diccon does the forfeit</p>
            <p className="text-gray-300">2. Losing team picks someone for a forfeit OR takes the penalty into the next round</p>
          </div>
        </div>
      )}
    </div>
  )
}
