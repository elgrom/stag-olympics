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
  await supabase.from('individual_scores').delete().gte('created_at', '1970-01-01')
  await supabase.from('team_scores').delete().gte('created_at', '1970-01-01')
  await supabase.from('players').delete().gte('created_at', '1970-01-01')
  await supabase.from('rounds').delete().gte('created_at', '1970-01-01')
  await supabase.from('forfeits').delete().gte('created_at', '1970-01-01')
  await supabase.from('teams').delete().gte('created_at', '1970-01-01')

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
