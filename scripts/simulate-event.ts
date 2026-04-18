import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function pickWinner(teamIds: string[]): [string, string] {
  const winner = Math.random() > 0.5 ? 0 : 1
  return [teamIds[winner], teamIds[1 - winner]]
}

async function simulate() {
  console.log('🏆 Simulating Stag Olympics...\n')

  const { data: teams } = await supabase.from('teams').select('*').order('name')
  const { data: rounds } = await supabase.from('rounds').select('*').order('number')
  const { data: players } = await supabase.from('players').select('*')

  if (!teams || !rounds || !players) {
    console.error('Missing data — run seed first')
    process.exit(1)
  }

  const teamIds = teams.map(t => t.id)

  // Assign players to teams randomly if not already assigned
  const unassigned = players.filter(p => !p.team_id)
  if (unassigned.length > 0) {
    console.log('Assigning players to teams...')
    const shuffled = unassigned.sort(() => Math.random() - 0.5)
    for (let i = 0; i < shuffled.length; i++) {
      const teamId = teamIds[i % 2]
      await supabase.from('players').update({ team_id: teamId }).eq('id', shuffled[i].id)
    }
    console.log('  Done\n')
  }

  // Clear existing scores
  await supabase.from('individual_scores').delete().neq('id', '')
  await supabase.from('team_scores').delete().neq('id', '')

  // Reset all rounds to upcoming
  await supabase.from('rounds').update({ status: 'upcoming' }).neq('id', '')

  for (const round of rounds) {
    console.log(`\n--- Round ${round.number}: ${round.emoji} ${round.name} ---`)

    await supabase.from('rounds').update({ status: 'live' }).eq('id', round.id)
    console.log('  Status: LIVE')
    await sleep(2000)

    if (round.number === 1) {
      const scoreA = Math.floor(Math.random() * 6) + 4
      const scoreB = Math.floor(Math.random() * 6) + 4
      await supabase.from('team_scores').insert([
        { round_id: round.id, team_id: teamIds[0], points: scoreA },
        { round_id: round.id, team_id: teamIds[1], points: scoreB },
      ])
      console.log(`  ${teams[0].name}: ${scoreA} pts, ${teams[1].name}: ${scoreB} pts`)
    } else if (round.has_sub_matches) {
      for (let m = 1; m <= (round.sub_match_count ?? 3); m++) {
        const [winnerId, loserId] = pickWinner(teamIds)
        const winner = teams.find(t => t.id === winnerId)!
        await supabase.from('team_scores').insert([
          { round_id: round.id, team_id: winnerId, match_number: m, points: round.points_per_win },
          { round_id: round.id, team_id: loserId, match_number: m, points: round.points_per_loss },
        ])

        if (round.has_individual_scoring) {
          const teamPlayers = players.filter(p => p.team_id === winnerId)
          const picked = teamPlayers.sort(() => Math.random() - 0.5).slice(0, 2)
          for (const p of picked) {
            await supabase.from('individual_scores').insert({
              round_id: round.id, player_id: p.id, match_number: m, points: 1,
            })
          }
        }

        console.log(`  Match ${m}: ${winner.name} wins (+${round.points_per_win})`)
        await sleep(1500)
      }
    } else {
      const [winnerId, loserId] = pickWinner(teamIds)
      const winner = teams.find(t => t.id === winnerId)!
      await supabase.from('team_scores').insert([
        { round_id: round.id, team_id: winnerId, points: round.points_per_win },
        { round_id: round.id, team_id: loserId, points: round.points_per_loss },
      ])
      console.log(`  ${winner.name} wins (+${round.points_per_win})`)
    }

    await supabase.from('rounds').update({ status: 'completed' }).eq('id', round.id)
    console.log('  Status: COMPLETED')
    await sleep(1000)
  }

  const { data: finalScores } = await supabase.from('team_scores').select('team_id, points')
  const teamTotals: Record<string, number> = {}
  for (const s of finalScores ?? []) {
    teamTotals[s.team_id] = (teamTotals[s.team_id] ?? 0) + s.points
  }

  console.log('\n\n🏆 FINAL RESULTS 🏆')
  for (const team of teams) {
    console.log(`  ${team.name}: ${teamTotals[team.id] ?? 0} pts`)
  }
  console.log('\nDone! Check the leaderboard to see the results update in realtime.')
}

simulate().catch(err => { console.error('Simulation failed:', err); process.exit(1) })
