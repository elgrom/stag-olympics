import { useState, useEffect } from 'react'
import { useEventData } from '../../hooks/useEventData'
import { useForfeits } from '../../hooks/useForfeits'
import { useForfeitCeremony } from '../../hooks/useForfeitCeremony'
import { RoundControl } from './RoundControl'
import { RoundScorer } from './RoundScorer'
import { QuizAdmin } from './QuizAdmin'
import type { Player } from '../../lib/types'
import { supabase } from '../../lib/supabase'

export function AdminPanel() {
  useEffect(() => { document.title = '⚙️ SO - Admin' }, [])
  const { teams, players, rounds, totals, currentRound, refetchRounds, refetchAll } = useEventData()
  const { forfeits, addForfeit, clearAll: clearForfeits, refetch: refetchForfeits } = useForfeits()
  const { state: ceremonyState, updateCeremony, resetCeremony } = useForfeitCeremony()
  const [forfeitText, setForfeitText] = useState('')

  const handleAddForfeit = async () => {
    if (!forfeitText.trim()) return
    await addForfeit(forfeitText.trim())
    setForfeitText('')
  }

  const assignPlayerToTeam = async (playerId: string, teamId: string) => {
    await supabase.from('players').update({ team_id: teamId }).eq('id', playerId)
  }

  const unassignedPlayers = players.filter(p => !p.team_id)

  const renameTeam = async (teamId: string, newName: string) => {
    if (!newName.trim()) return
    await supabase.from('teams').update({ name: newName.trim() }).eq('id', teamId)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 pb-8">
      <h1 className="text-xl font-bold mb-1">⚙️ Admin Panel</h1>
      <p className="text-xs text-gray-500 mb-4">
        Score: {teams.map(t => `${t.name} ${totals[t.id] ?? 0}`).join(' - ')}
      </p>

      {/* Team Names */}
      {teams.length === 2 && (
        <div className="bg-gray-900 rounded-lg p-4 mb-4">
          <h3 className="font-bold text-sm mb-3">✏️ Team Names</h3>
          <div className="flex gap-2">
            {teams.map(t => (
              <input key={t.id} defaultValue={t.name}
                onBlur={e => renameTeam(t.id, e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-center" />
            ))}
          </div>
        </div>
      )}

      <RoundControl rounds={rounds} onRefetch={refetchRounds} onRefetchAll={() => { refetchAll(); refetchForfeits() }} onResetCeremony={resetCeremony} />

      {currentRound?.number === 1 && (
        <QuizAdmin
          players={players}
          onQuizComplete={async (results) => {
            // Save quiz scores as individual scores
            for (const r of results) {
              if (r.score > 0) {
                await supabase.from('individual_scores').insert({
                  round_id: currentRound.id,
                  player_id: r.playerId,
                  points: r.score,
                })
              }
            }
          }}
        />
      )}

      {currentRound && currentRound.number !== 1 && (
        <RoundScorer round={currentRound} teams={teams} players={players}
          ceremonyState={ceremonyState} onCeremonyUpdate={updateCeremony} />
      )}

      {teams.length === 2 && (
        <div className="bg-gray-900 rounded-lg p-4 mb-4">
          <h3 className="font-bold text-sm mb-3">🎯 Team Draft</h3>
          <div className="flex gap-2 mb-3">
            {teams.map(t => {
              const count = players.filter(p => p.team_id === t.id).length
              return (
                <div key={t.id} className="flex-1 text-center bg-gray-800 rounded py-2">
                  <div className="text-xs text-gray-400">{t.name}</div>
                  <div className="text-lg font-bold">{count}</div>
                </div>
              )
            })}
            {unassignedPlayers.length > 0 && (
              <div className="flex-1 text-center bg-gray-800 rounded py-2">
                <div className="text-xs text-yellow-400">Unassigned</div>
                <div className="text-lg font-bold text-yellow-400">{unassignedPlayers.length}</div>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-2">Tap a team name to assign/reassign.</p>
          {players
            .sort((a, b) => a.first_name.localeCompare(b.first_name))
            .map(player => (
            <DraftRow key={player.id} player={player}
              teamNames={teams.map(t => ({ id: t.id, name: t.name }))}
              onAssign={assignPlayerToTeam} />
          ))}
        </div>
      )}

      <div className="bg-gray-900 rounded-lg p-4 mb-4">
        <h3 className="font-bold text-sm mb-3">🎡 Forfeits ({forfeits.length})</h3>
        <div className="flex gap-2 mb-3">
          <input type="text" value={forfeitText} onChange={e => setForfeitText(e.target.value)}
            placeholder="e.g. Dance like a chicken"
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm" />
          <button onClick={handleAddForfeit}
            className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 rounded text-sm font-medium">
            Add
          </button>
        </div>
        {forfeits.length > 0 && (
          <button onClick={() => confirm('Clear all forfeits?') && clearForfeits()}
            className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-400">
            🗑️ Clear all forfeits
          </button>
        )}
      </div>

      <a href="/" className="block text-center text-sm text-blue-400 underline">View leaderboard →</a>
    </div>
  )
}

function DraftRow({ player, teamNames, onAssign }: {
  player: Player; teamNames: { id: string; name: string }[]; onAssign: (playerId: string, teamId: string) => void
}) {
  const setNickname = async (nickname: string) => {
    await supabase.from('players').update({ nickname: nickname || null }).eq('id', player.id)
  }

  return (
    <div className="flex items-center gap-2 py-2 border-b border-gray-800">
      <div className="flex-1 min-w-0">
        <span className="text-sm">{player.nickname || player.first_name} {player.last_name}</span>
        <input
          defaultValue={player.nickname || ''}
          onBlur={e => setNickname(e.target.value.trim())}
          placeholder="nickname"
          className="block w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs mt-1"
        />
      </div>
      <div className="flex gap-1 shrink-0">
        {teamNames.map(team => {
          const isCurrentTeam = player.team_id === team.id
          return (
            <button key={team.id} onClick={() => onAssign(player.id, team.id)}
              className={`px-3 py-1 rounded text-xs font-medium ${
                isCurrentTeam
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}>
              {team.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
