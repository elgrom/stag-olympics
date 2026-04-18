import { createClient } from '@supabase/supabase-js'
import { TEAMS, PLAYERS, ROUNDS, FORFEITS } from '../src/seed/data'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seed() {
  console.log('Seeding database...')

  // Clear existing data (order matters for foreign keys)
  await supabase.from('individual_scores').delete().neq('id', '')
  await supabase.from('team_scores').delete().neq('id', '')
  await supabase.from('players').delete().neq('id', '')
  await supabase.from('rounds').delete().neq('id', '')
  await supabase.from('forfeits').delete().neq('id', '')
  await supabase.from('teams').delete().neq('id', '')

  const { data: teams, error: teamsErr } = await supabase.from('teams').insert(TEAMS).select()
  if (teamsErr) throw teamsErr
  console.log(`  ${teams.length} teams created`)

  const { data: players, error: playersErr } = await supabase.from('players').insert(PLAYERS).select()
  if (playersErr) throw playersErr
  console.log(`  ${players.length} players created`)

  const { data: rounds, error: roundsErr } = await supabase.from('rounds').insert(ROUNDS).select()
  if (roundsErr) throw roundsErr
  console.log(`  ${rounds.length} rounds created`)

  const { data: forfeits, error: forfeitsErr } = await supabase.from('forfeits').insert(FORFEITS.map(text => ({ text }))).select()
  if (forfeitsErr) throw forfeitsErr
  console.log(`  ${forfeits.length} forfeits created`)

  console.log('Done!')
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1) })
