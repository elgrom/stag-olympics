# Stag Olympics — Leaderboard & Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a live leaderboard web app with team/individual scoring, forfeit wheel, and admin score entry panel — backed by Supabase with realtime updates.

**Architecture:** React + TypeScript SPA with Vite, Tailwind CSS for styling, Supabase for database/realtime/auth-free data access. Admin panel at `/admin` for score entry. All score calculation done client-side from raw score rows. Realtime subscriptions push updates to all connected clients.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Supabase JS client, Vitest + React Testing Library

---

## File Structure

```
stag-olympics/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css                    # Tailwind directives + global styles
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client singleton
│   │   ├── types.ts                # Database row types
│   │   └── scores.ts               # Score calculation pure functions
│   ├── hooks/
│   │   ├── useRealtimeTable.ts     # Generic realtime subscription hook
│   │   ├── useEventData.ts         # Combines all tables into event state
│   │   └── useForfeits.ts          # Forfeits with add/mark-used
│   ├── components/
│   │   ├── ScoreHeader.tsx         # Big team scores + ratio bar
│   │   ├── RoundCard.tsx           # Single round timeline card
│   │   ├── RoundTimeline.tsx       # List of round cards
│   │   ├── IndividualBoard.tsx     # Player leaderboard table
│   │   ├── TeamRosters.tsx         # Two team member lists
│   │   ├── ForfeitWheel.tsx        # Animated spinning wheel
│   │   ├── BottomNav.tsx           # Tab navigation
│   │   └── admin/
│   │       ├── AdminPanel.tsx      # Admin page layout
│   │       ├── RoundScorer.tsx     # Score entry for current round
│   │       └── RoundControl.tsx    # Start/end round buttons
│   └── seed/
│       └── data.ts                 # Seed data (rounds, players, forfeits)
├── tests/
│   ├── setup.ts                    # Vitest setup
│   ├── scores.test.ts              # Score calculation unit tests
│   ├── ScoreHeader.test.tsx        # Component tests
│   └── ForfeitWheel.test.tsx       # Wheel logic tests
└── scripts/
    └── seed.ts                     # Seed script runner
```

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`
- Create: `tests/setup.ts`

- [ ] **Step 1: Initialize project with Vite**

```bash
cd /Users/david.jensen/repos/stag-olympics
npm create vite@latest . -- --template react-ts
```

When prompted about existing files, choose to ignore/skip. This creates the base files.

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js react-router-dom
npm install -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Tailwind via Vite plugin**

Replace `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
})
```

- [ ] **Step 4: Set up CSS with Tailwind**

Replace `src/index.css`:

```css
@import "tailwindcss";
```

- [ ] **Step 5: Create test setup**

Create `tests/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 6: Create minimal App**

Replace `src/App.tsx`:

```tsx
function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <h1 className="text-2xl font-bold text-center pt-8">🏆 Stag Olympics</h1>
    </div>
  )
}

export default App
```

Replace `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 7: Verify it runs**

```bash
npm run dev
```

Expected: App loads at localhost:5173 with dark background and "Stag Olympics" heading.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: project scaffolding with Vite, React, TypeScript, Tailwind"
```

---

### Task 2: Database types and Supabase client

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/supabase.ts`
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create the database migration SQL**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Teams
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Players
create table players (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  team_id uuid references teams(id),
  created_at timestamptz default now()
);

-- Rounds
create table rounds (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique,
  name text not null,
  emoji text,
  scheduled_time text,
  format text,
  scoring_guidance text,
  max_team_points integer,
  has_individual_scoring boolean default false,
  has_sub_matches boolean default false,
  sub_match_count integer,
  points_per_win integer default 3,
  points_per_loss integer default 1,
  status text default 'upcoming' check (status in ('upcoming', 'live', 'completed')),
  created_at timestamptz default now()
);

-- Team scores
create table team_scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id),
  team_id uuid not null references teams(id),
  match_number integer,
  points integer not null,
  created_at timestamptz default now()
);

-- Individual scores
create table individual_scores (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds(id),
  player_id uuid not null references players(id),
  match_number integer,
  points integer not null,
  created_at timestamptz default now()
);

-- Forfeits
create table forfeits (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  is_used boolean default false,
  created_at timestamptz default now()
);

-- Enable realtime on tables that change during the event
alter publication supabase_realtime add table team_scores;
alter publication supabase_realtime add table individual_scores;
alter publication supabase_realtime add table rounds;
alter publication supabase_realtime add table forfeits;

-- Allow anonymous read access to all tables
alter table teams enable row level security;
alter table players enable row level security;
alter table rounds enable row level security;
alter table team_scores enable row level security;
alter table individual_scores enable row level security;
alter table forfeits enable row level security;

create policy "Public read access" on teams for select using (true);
create policy "Public read access" on players for select using (true);
create policy "Public read access" on rounds for select using (true);
create policy "Public read access" on team_scores for select using (true);
create policy "Public read access" on individual_scores for select using (true);
create policy "Public read access" on forfeits for select using (true);

-- Allow inserts/updates via anon key (admin panel — no auth for this event)
create policy "Public insert" on team_scores for insert with check (true);
create policy "Public insert" on individual_scores for insert with check (true);
create policy "Public insert" on forfeits for insert with check (true);
create policy "Public update" on rounds for update using (true);
create policy "Public update" on forfeits for update using (true);
create policy "Public update" on players for update using (true);
```

- [ ] **Step 2: Create TypeScript types**

Create `src/lib/types.ts`:

```ts
export interface Team {
  id: string
  name: string
  created_at: string
}

export interface Player {
  id: string
  first_name: string
  last_name: string
  team_id: string | null
  created_at: string
}

export interface Round {
  id: string
  number: number
  name: string
  emoji: string | null
  scheduled_time: string | null
  format: string | null
  scoring_guidance: string | null
  max_team_points: number | null
  has_individual_scoring: boolean
  has_sub_matches: boolean
  sub_match_count: number | null
  points_per_win: number
  points_per_loss: number
  status: 'upcoming' | 'live' | 'completed'
  created_at: string
}

export interface TeamScore {
  id: string
  round_id: string
  team_id: string
  match_number: number | null
  points: number
  created_at: string
}

export interface IndividualScore {
  id: string
  round_id: string
  player_id: string
  match_number: number | null
  points: number
  created_at: string
}

export interface Forfeit {
  id: string
  text: string
  is_used: boolean
  created_at: string
}
```

- [ ] **Step 3: Create Supabase client**

Create `src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 4: Create .env.example**

Create `.env.example`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Add `.env` and `.env.local` to `.gitignore` (already there).

- [ ] **Step 5: Commit**

```bash
git add supabase/ src/lib/types.ts src/lib/supabase.ts .env.example
git commit -m "feat: database schema, TypeScript types, and Supabase client"
```

---

### Task 3: Seed data

**Files:**
- Create: `src/seed/data.ts`
- Create: `scripts/seed.ts`

- [ ] **Step 1: Create seed data**

Create `src/seed/data.ts`:

```ts
export const TEAMS = [
  { name: 'Alpha' },
  { name: 'Beta' },
]

export const PLAYERS = [
  { first_name: 'Adam', last_name: 'Broomhead' },
  { first_name: 'Ady', last_name: 'LeRoux' },
  { first_name: 'Brandon', last_name: 'Austin' },
  { first_name: 'Bryan', last_name: 'Bennet' },
  { first_name: 'Cam', last_name: 'Miskin' },
  { first_name: 'Dave', last_name: 'Jensen' },
  { first_name: 'Dom', last_name: 'Obrien' },
  { first_name: 'Dom', last_name: 'Andre' },
  { first_name: 'Grahame', last_name: 'Johnston' },
  { first_name: 'Ian', last_name: 'Dyckhoff' },
  { first_name: 'Iggy', last_name: 'Harris' },
  { first_name: 'Jonathan', last_name: 'Midgely' },
  { first_name: 'Pedro', last_name: 'Leon' },
  { first_name: 'Ricky', last_name: 'Iles' },
  { first_name: 'Seb', last_name: 'Mayfield' },
  { first_name: 'Simon', last_name: 'None' },
  { first_name: 'Marc', last_name: 'Sparrow' },
]

export const ROUNDS = [
  {
    number: 1,
    name: 'How Well Do You Know Diccon?',
    emoji: '🧠',
    scheduled_time: '12:00',
    format: 'Quiz — 10 questions, each team writes answers on paper.',
    scoring_guidance: 'Enter each team\'s correct answer count. 1 pt per correct answer.',
    max_team_points: 10,
    has_individual_scoring: false,
    has_sub_matches: false,
    sub_match_count: null,
    points_per_win: 1,
    points_per_loss: 0,
  },
  {
    number: 2,
    name: 'Petanque',
    emoji: '🎯',
    scheduled_time: '12:30',
    format: 'Best of 3 matches, 3v3 from each team.',
    scoring_guidance: 'Score each match — pick the winning team. 3 pts to winner, 1 to loser.',
    max_team_points: 9,
    has_individual_scoring: true,
    has_sub_matches: true,
    sub_match_count: 3,
    points_per_win: 3,
    points_per_loss: 1,
  },
  {
    number: 3,
    name: 'Water Balloon Toss',
    emoji: '💦',
    scheduled_time: '13:00',
    format: 'Pairs face each other, step back after each catch. Last pair standing wins.',
    scoring_guidance: 'Pick the winning team. 3 pts to winner, 1 to loser.',
    max_team_points: 3,
    has_individual_scoring: false,
    has_sub_matches: false,
    sub_match_count: null,
    points_per_win: 3,
    points_per_loss: 1,
  },
  {
    number: 4,
    name: 'Beer Pong',
    emoji: '🍺',
    scheduled_time: '13:30',
    format: 'Best of 3 rounds, rotating doubles pairs from each team.',
    scoring_guidance: 'Score each round — pick the winning team. 3 pts to winner, 1 to loser.',
    max_team_points: 9,
    has_individual_scoring: true,
    has_sub_matches: true,
    sub_match_count: 3,
    points_per_win: 3,
    points_per_loss: 1,
  },
  {
    number: 5,
    name: 'Tennis',
    emoji: '🎾',
    scheduled_time: '14:30',
    format: 'Best of 3 doubles matches. First to 11 points per match, no deuces.',
    scoring_guidance: 'Score each match — pick the winning team. 3 pts to winner, 1 to loser.',
    max_team_points: 9,
    has_individual_scoring: true,
    has_sub_matches: true,
    sub_match_count: 3,
    points_per_win: 3,
    points_per_loss: 1,
  },
  {
    number: 6,
    name: 'Taskmaster: Portrait of the Groom',
    emoji: '🎨',
    scheduled_time: '15:30',
    format: '10 minutes to create a portrait/sculpture of Diccon using found materials. Diccon judges.',
    scoring_guidance: 'Diccon picks the winner. 5 pts to winner, 2 to loser.',
    max_team_points: 5,
    has_individual_scoring: false,
    has_sub_matches: false,
    sub_match_count: null,
    points_per_win: 5,
    points_per_loss: 2,
  },
  {
    number: 7,
    name: 'Dizzy Bat Relay',
    emoji: '🌀',
    scheduled_time: '16:00',
    format: 'Forehead on bat, 10 spins, sprint to cone and back. Full team relay.',
    scoring_guidance: 'Pick the winning team. 3 pts to winner, 1 to loser.',
    max_team_points: 3,
    has_individual_scoring: false,
    has_sub_matches: false,
    sub_match_count: null,
    points_per_win: 3,
    points_per_loss: 1,
  },
  {
    number: 8,
    name: 'Flip Cup Finale',
    emoji: '🏁',
    scheduled_time: '16:30',
    format: 'Full team relay. Line up, drink, flip, next person goes. Best of 3.',
    scoring_guidance: 'Pick the winning team. 5 pts to winner, 2 to loser.',
    max_team_points: 5,
    has_individual_scoring: false,
    has_sub_matches: false,
    sub_match_count: null,
    points_per_win: 5,
    points_per_loss: 2,
  },
]

export const FORFEITS = [
  'Down your drink',
  'Do 10 press-ups',
  'Speak in a French accent for the next round',
  'Swap a clothing item with the person to your left',
  'Do your best impression of Diccon',
  'Sing the chorus of a song chosen by the other team',
  'Let the other team draw something on your face',
  'Take a selfie with a stranger and post it to the group',
  'Do a lap of the castle in your pants',
  'Drink a mystery cocktail made by the other team',
  'Stand on one leg for the entirety of the next round',
  'Call your mum and tell her you love her on speakerphone',
  'Dance for 30 seconds with no music — the other team picks the style',
  'Eat a spoonful of mustard',
  'Let someone in the group send a message from your phone',
]
```

- [ ] **Step 2: Create seed script**

Create `scripts/seed.ts`:

```ts
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

  // Seed teams
  const { data: teams, error: teamsErr } = await supabase
    .from('teams')
    .insert(TEAMS)
    .select()
  if (teamsErr) throw teamsErr
  console.log(`  ${teams.length} teams created`)

  // Seed players (no team assignment yet — that happens Friday night)
  const { data: players, error: playersErr } = await supabase
    .from('players')
    .insert(PLAYERS)
    .select()
  if (playersErr) throw playersErr
  console.log(`  ${players.length} players created`)

  // Seed rounds
  const { data: rounds, error: roundsErr } = await supabase
    .from('rounds')
    .insert(ROUNDS)
    .select()
  if (roundsErr) throw roundsErr
  console.log(`  ${rounds.length} rounds created`)

  // Seed forfeits
  const { data: forfeits, error: forfeitsErr } = await supabase
    .from('forfeits')
    .insert(FORFEITS.map(text => ({ text })))
    .select()
  if (forfeitsErr) throw forfeitsErr
  console.log(`  ${forfeits.length} forfeits created`)

  console.log('Done!')
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
```

- [ ] **Step 3: Add seed script to package.json**

Add to the `"scripts"` section in `package.json`:

```json
"seed": "npx tsx scripts/seed.ts"
```

- [ ] **Step 4: Install tsx**

```bash
npm install -D tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/seed/ scripts/seed.ts
git commit -m "feat: seed data for rounds, players, and forfeits"
```

---

### Task 4: Score calculation logic (TDD)

**Files:**
- Create: `src/lib/scores.ts`
- Create: `tests/scores.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/scores.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  calcTeamTotals,
  calcRoundScores,
  calcIndividualTotals,
  getLeadingTeamId,
} from '../src/lib/scores'
import type { Team, TeamScore, IndividualScore, Player, Round } from '../src/lib/types'

const teamA: Team = { id: 'a', name: 'Alpha', created_at: '' }
const teamB: Team = { id: 'b', name: 'Beta', created_at: '' }
const teams = [teamA, teamB]

const round1: Round = {
  id: 'r1', number: 1, name: 'Quiz', emoji: '🧠', scheduled_time: '12:00',
  format: '', scoring_guidance: '', max_team_points: 10,
  has_individual_scoring: false, has_sub_matches: false, sub_match_count: null,
  points_per_win: 1, points_per_loss: 0, status: 'completed', created_at: '',
}
const round2: Round = {
  id: 'r2', number: 2, name: 'Petanque', emoji: '🎯', scheduled_time: '12:30',
  format: '', scoring_guidance: '', max_team_points: 9,
  has_individual_scoring: true, has_sub_matches: true, sub_match_count: 3,
  points_per_win: 3, points_per_loss: 1, status: 'completed', created_at: '',
}

describe('calcTeamTotals', () => {
  it('returns zero for both teams when no scores', () => {
    const result = calcTeamTotals(teams, [])
    expect(result).toEqual({ a: 0, b: 0 })
  })

  it('sums scores across rounds', () => {
    const scores: TeamScore[] = [
      { id: '1', round_id: 'r1', team_id: 'a', match_number: null, points: 7, created_at: '' },
      { id: '2', round_id: 'r1', team_id: 'b', match_number: null, points: 4, created_at: '' },
      { id: '3', round_id: 'r2', team_id: 'a', match_number: 1, points: 3, created_at: '' },
      { id: '4', round_id: 'r2', team_id: 'b', match_number: 1, points: 1, created_at: '' },
    ]
    const result = calcTeamTotals(teams, scores)
    expect(result).toEqual({ a: 10, b: 5 })
  })
})

describe('calcRoundScores', () => {
  it('returns scores grouped by round', () => {
    const scores: TeamScore[] = [
      { id: '1', round_id: 'r1', team_id: 'a', match_number: null, points: 7, created_at: '' },
      { id: '2', round_id: 'r1', team_id: 'b', match_number: null, points: 4, created_at: '' },
      { id: '3', round_id: 'r2', team_id: 'a', match_number: 1, points: 3, created_at: '' },
      { id: '4', round_id: 'r2', team_id: 'b', match_number: 1, points: 1, created_at: '' },
    ]
    const result = calcRoundScores(scores)
    expect(result['r1']).toEqual({ a: 7, b: 4 })
    expect(result['r2']).toEqual({ a: 3, b: 1 })
  })

  it('sums sub-match scores within a round', () => {
    const scores: TeamScore[] = [
      { id: '1', round_id: 'r2', team_id: 'a', match_number: 1, points: 3, created_at: '' },
      { id: '2', round_id: 'r2', team_id: 'b', match_number: 1, points: 1, created_at: '' },
      { id: '3', round_id: 'r2', team_id: 'a', match_number: 2, points: 1, created_at: '' },
      { id: '4', round_id: 'r2', team_id: 'b', match_number: 2, points: 3, created_at: '' },
    ]
    const result = calcRoundScores(scores)
    expect(result['r2']).toEqual({ a: 4, b: 4 })
  })
})

describe('calcIndividualTotals', () => {
  it('returns empty array when no scores', () => {
    const result = calcIndividualTotals([], [])
    expect(result).toEqual([])
  })

  it('sums individual points and sorts descending', () => {
    const players: Player[] = [
      { id: 'p1', first_name: 'Cam', last_name: 'Miskin', team_id: 'a', created_at: '' },
      { id: 'p2', first_name: 'Ricky', last_name: 'Iles', team_id: 'a', created_at: '' },
      { id: 'p3', first_name: 'Dom', last_name: 'Obrien', team_id: 'b', created_at: '' },
    ]
    const scores: IndividualScore[] = [
      { id: '1', round_id: 'r2', player_id: 'p1', match_number: 1, points: 1, created_at: '' },
      { id: '2', round_id: 'r2', player_id: 'p2', match_number: 1, points: 1, created_at: '' },
      { id: '3', round_id: 'r2', player_id: 'p1', match_number: 2, points: 1, created_at: '' },
      { id: '4', round_id: 'r2', player_id: 'p3', match_number: 2, points: 1, created_at: '' },
    ]
    const result = calcIndividualTotals(players, scores)
    expect(result[0]).toEqual({ player: players[0], total: 2 })
    expect(result[1]).toEqual({ player: players[2], total: 1 })
    expect(result[2]).toEqual({ player: players[1], total: 1 })
  })
})

describe('getLeadingTeamId', () => {
  it('returns the team id with more points', () => {
    const totals = { a: 10, b: 7 }
    expect(getLeadingTeamId(totals)).toBe('a')
  })

  it('returns null when tied', () => {
    const totals = { a: 5, b: 5 }
    expect(getLeadingTeamId(totals)).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/scores.test.ts
```

Expected: FAIL — cannot find module `../src/lib/scores`

- [ ] **Step 3: Implement score calculation functions**

Create `src/lib/scores.ts`:

```ts
import type { Team, TeamScore, IndividualScore, Player } from './types'

export function calcTeamTotals(
  teams: Team[],
  scores: TeamScore[],
): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const team of teams) {
    totals[team.id] = 0
  }
  for (const score of scores) {
    totals[score.team_id] = (totals[score.team_id] ?? 0) + score.points
  }
  return totals
}

export function calcRoundScores(
  scores: TeamScore[],
): Record<string, Record<string, number>> {
  const byRound: Record<string, Record<string, number>> = {}
  for (const score of scores) {
    if (!byRound[score.round_id]) {
      byRound[score.round_id] = {}
    }
    byRound[score.round_id][score.team_id] =
      (byRound[score.round_id][score.team_id] ?? 0) + score.points
  }
  return byRound
}

export interface PlayerTotal {
  player: Player
  total: number
}

export function calcIndividualTotals(
  players: Player[],
  scores: IndividualScore[],
): PlayerTotal[] {
  const totals: Record<string, number> = {}
  for (const score of scores) {
    totals[score.player_id] = (totals[score.player_id] ?? 0) + score.points
  }

  return players
    .filter(p => totals[p.id] !== undefined)
    .map(p => ({ player: p, total: totals[p.id] }))
    .sort((a, b) => b.total - a.total)
}

export function getLeadingTeamId(
  totals: Record<string, number>,
): string | null {
  const entries = Object.entries(totals)
  if (entries.length < 2) return null
  const sorted = entries.sort((a, b) => b[1] - a[1])
  if (sorted[0][1] === sorted[1][1]) return null
  return sorted[0][0]
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/scores.test.ts
```

Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/scores.ts tests/scores.test.ts
git commit -m "feat: score calculation functions with tests"
```

---

### Task 5: Score header component

**Files:**
- Create: `src/components/ScoreHeader.tsx`
- Create: `tests/ScoreHeader.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `tests/ScoreHeader.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreHeader } from '../src/components/ScoreHeader'
import type { Team, Round } from '../src/lib/types'

const teams: Team[] = [
  { id: 'a', name: 'Alpha', created_at: '' },
  { id: 'b', name: 'Beta', created_at: '' },
]

const liveRound: Round = {
  id: 'r4', number: 4, name: 'Beer Pong', emoji: '🍺', scheduled_time: '13:30',
  format: '', scoring_guidance: '', max_team_points: 9,
  has_individual_scoring: true, has_sub_matches: true, sub_match_count: 3,
  points_per_win: 3, points_per_loss: 1, status: 'live', created_at: '',
}

describe('ScoreHeader', () => {
  it('renders team names and scores', () => {
    render(
      <ScoreHeader teams={teams} totals={{ a: 24, b: 19 }} currentRound={liveRound} />
    )
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText('24')).toBeInTheDocument()
    expect(screen.getByText('19')).toBeInTheDocument()
  })

  it('shows current round info', () => {
    render(
      <ScoreHeader teams={teams} totals={{ a: 24, b: 19 }} currentRound={liveRound} />
    )
    expect(screen.getByText(/Round 4 of 8/)).toBeInTheDocument()
    expect(screen.getByText(/Beer Pong/)).toBeInTheDocument()
  })

  it('highlights the leading team', () => {
    const { container } = render(
      <ScoreHeader teams={teams} totals={{ a: 24, b: 19 }} currentRound={liveRound} />
    )
    const leadingBox = container.querySelector('[data-leading="true"]')
    expect(leadingBox).toBeInTheDocument()
    expect(leadingBox?.textContent).toContain('Alpha')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/ScoreHeader.test.tsx
```

Expected: FAIL — cannot find module

- [ ] **Step 3: Implement ScoreHeader**

Create `src/components/ScoreHeader.tsx`:

```tsx
import type { Team, Round } from '../lib/types'
import { getLeadingTeamId } from '../lib/scores'

interface Props {
  teams: Team[]
  totals: Record<string, number>
  currentRound: Round | null
}

export function ScoreHeader({ teams, totals, currentRound }: Props) {
  const leadingId = getLeadingTeamId(totals)
  const totalPoints = Object.values(totals).reduce((a, b) => a + b, 0)

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Title */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold">🏆 Stag Olympics</h1>
        {currentRound && (
          <p className="text-sm text-gray-400 mt-1">
            Round {currentRound.number} of 8 — {currentRound.emoji} {currentRound.name}
          </p>
        )}
      </div>

      {/* Score boxes */}
      <div className="flex gap-3 mb-3">
        {teams.map(team => {
          const isLeading = team.id === leadingId
          return (
            <div
              key={team.id}
              data-leading={isLeading}
              className={`flex-1 rounded-xl p-4 text-center border-2 ${
                isLeading
                  ? 'bg-green-950/50 border-green-600'
                  : 'bg-gray-900 border-gray-700'
              }`}
            >
              <div className={`text-xs uppercase tracking-widest ${
                isLeading ? 'text-green-500' : 'text-gray-400'
              }`}>
                {team.name}
              </div>
              <div className={`text-4xl font-bold mt-1 ${
                isLeading ? 'text-green-400' : 'text-gray-200'
              }`}>
                {totals[team.id] ?? 0}
              </div>
              {isLeading && (
                <div className="text-xs text-green-500 mt-1">⭐ Leading</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Ratio bar */}
      {totalPoints > 0 && (
        <div className="flex h-1.5 rounded-full overflow-hidden">
          {teams.map((team, i) => (
            <div
              key={team.id}
              className={i === 0 ? 'bg-green-600' : 'bg-red-600'}
              style={{ flex: totals[team.id] ?? 0 }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/ScoreHeader.test.tsx
```

Expected: All 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ScoreHeader.tsx tests/ScoreHeader.test.tsx
git commit -m "feat: score header with team totals and ratio bar"
```

---

### Task 6: Round timeline and round cards

**Files:**
- Create: `src/components/RoundCard.tsx`
- Create: `src/components/RoundTimeline.tsx`

- [ ] **Step 1: Implement RoundCard**

Create `src/components/RoundCard.tsx`:

```tsx
import type { Round, Team } from '../lib/types'

interface Props {
  round: Round
  teams: Team[]
  scores: Record<string, number> | undefined // { teamId: points }
}

export function RoundCard({ round, teams, scores }: Props) {
  const isLive = round.status === 'live'
  const isCompleted = round.status === 'completed'
  const isUpcoming = round.status === 'upcoming'

  let winningTeamId: string | null = null
  if (isCompleted && scores && teams.length === 2) {
    const [t1, t2] = teams
    const s1 = scores[t1.id] ?? 0
    const s2 = scores[t2.id] ?? 0
    if (s1 > s2) winningTeamId = t1.id
    else if (s2 > s1) winningTeamId = t2.id
  }

  const borderColor = isLive
    ? 'border-yellow-500'
    : isCompleted
      ? winningTeamId === teams[0]?.id
        ? 'border-green-600'
        : 'border-red-600'
      : 'border-gray-700'

  return (
    <div className={`bg-gray-900 rounded-lg p-3 border-l-4 ${borderColor} ${
      isUpcoming ? 'opacity-50' : ''
    }`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="font-bold text-sm">
          {round.emoji} R{round.number} {round.name}
        </span>
        {isLive && (
          <span className="text-xs text-yellow-400 bg-yellow-900/50 px-2 py-0.5 rounded">
            LIVE
          </span>
        )}
        {isCompleted && winningTeamId && (
          <span className={`text-xs ${
            winningTeamId === teams[0]?.id ? 'text-green-400' : 'text-red-400'
          }`}>
            {teams.find(t => t.id === winningTeamId)?.name} wins!
          </span>
        )}
        {isUpcoming && (
          <span className="text-xs text-gray-500">{round.scheduled_time}</span>
        )}
      </div>

      {/* Format description */}
      <p className="text-xs text-gray-500 mt-1">{round.format}</p>

      {/* Scores */}
      {scores && isCompleted && (
        <div className="flex gap-2 mt-2">
          {teams.map(team => (
            <div
              key={team.id}
              className={`flex-1 text-center text-xs py-1 rounded ${
                team.id === teams[0]?.id ? 'bg-green-950/30' : 'bg-red-950/30'
              }`}
            >
              <span className={team.id === teams[0]?.id ? 'text-green-400' : 'text-red-400'}>
                +{scores[team.id] ?? 0} pts
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Scoring guidance for live rounds */}
      {isLive && (
        <p className="text-xs text-gray-600 mt-2">
          {round.scoring_guidance}
        </p>
      )}

      {/* Points available for upcoming */}
      {isUpcoming && (
        <p className="text-xs text-gray-600 mt-1">
          {round.max_team_points} pts available
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Implement RoundTimeline**

Create `src/components/RoundTimeline.tsx`:

```tsx
import type { Round, Team } from '../lib/types'
import { RoundCard } from './RoundCard'

interface Props {
  rounds: Round[]
  teams: Team[]
  roundScores: Record<string, Record<string, number>>
}

export function RoundTimeline({ rounds, teams, roundScores }: Props) {
  const completed = rounds
    .filter(r => r.status === 'completed')
    .sort((a, b) => b.number - a.number)
  const live = rounds.filter(r => r.status === 'live')
  const upcoming = rounds
    .filter(r => r.status === 'upcoming')
    .sort((a, b) => a.number - b.number)

  const ordered = [...live, ...completed, ...upcoming]

  return (
    <div className="px-4 space-y-2 pb-24">
      {live.length > 0 || completed.length > 0 ? null : (
        <p className="text-center text-gray-500 text-sm py-8">
          No rounds started yet
        </p>
      )}

      {ordered.map(round => (
        <RoundCard
          key={round.id}
          round={round}
          teams={teams}
          scores={roundScores[round.id]}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Verify components render**

```bash
npx vitest run
```

Expected: All existing tests still pass (no new tests for these — they're presentational wrappers around tested logic).

- [ ] **Step 4: Commit**

```bash
git add src/components/RoundCard.tsx src/components/RoundTimeline.tsx
git commit -m "feat: round timeline with live/completed/upcoming cards"
```

---

### Task 7: Individual leaderboard

**Files:**
- Create: `src/components/IndividualBoard.tsx`

- [ ] **Step 1: Implement IndividualBoard**

Create `src/components/IndividualBoard.tsx`:

```tsx
import type { PlayerTotal } from '../lib/scores'
import type { Team } from '../lib/types'

interface Props {
  rankings: PlayerTotal[]
  teams: Team[]
}

export function IndividualBoard({ rankings, teams }: Props) {
  if (rankings.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-gray-500 text-sm">
        No individual scores yet
      </div>
    )
  }

  const lastIdx = rankings.length - 1

  return (
    <div className="px-4 pb-24">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs uppercase">
            <th className="text-left py-2 w-8">#</th>
            <th className="text-left py-2">Player</th>
            <th className="text-right py-2">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((entry, i) => {
            const isMvp = i === 0
            const isSpoon = i === lastIdx && rankings.length > 1
            const team = teams.find(t => t.id === entry.player.team_id)
            const teamColor = team === teams[0]
              ? 'bg-green-600' : 'bg-red-600'

            return (
              <tr
                key={entry.player.id}
                className={`border-b border-gray-800 ${
                  isMvp ? 'bg-yellow-900/20' : isSpoon ? 'bg-gray-800/30' : ''
                }`}
              >
                <td className="py-2 text-gray-400">
                  {isMvp ? '🏅' : isSpoon ? '🥄' : i + 1}
                </td>
                <td className="py-2">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${teamColor}`} />
                    {entry.player.first_name} {entry.player.last_name}
                  </span>
                </td>
                <td className="py-2 text-right font-bold">{entry.total}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/IndividualBoard.tsx
git commit -m "feat: individual player leaderboard with MVP and wooden spoon"
```

---

### Task 8: Bottom navigation and page routing

**Files:**
- Create: `src/components/BottomNav.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement BottomNav**

Create `src/components/BottomNav.tsx`:

```tsx
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
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 py-3 text-center text-xs ${
              active === tab.id
                ? 'text-white'
                : 'text-gray-500'
            }`}
          >
            <div className="text-lg">{tab.emoji}</div>
            <div>{tab.label}</div>
          </button>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Wire up App with routing**

Replace `src/App.tsx`:

```tsx
import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'

function MainApp() {
  const [activeTab, setActiveTab] = useState<'scores' | 'forfeits' | 'teams'>('scores')

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {activeTab === 'scores' && (
        <div className="text-center pt-8 text-gray-500">Scores view — coming soon</div>
      )}
      {activeTab === 'forfeits' && (
        <div className="text-center pt-8 text-gray-500">Forfeit wheel — coming soon</div>
      )}
      {activeTab === 'teams' && (
        <div className="text-center pt-8 text-gray-500">Teams view — coming soon</div>
      )}
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}

function AdminApp() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <h1 className="text-xl font-bold">Admin Panel — coming soon</h1>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/admin" element={<AdminApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

- [ ] **Step 3: Verify navigation works**

```bash
npm run dev
```

Expected: Three tabs at the bottom, clicking switches between placeholder views. `/admin` shows admin placeholder.

- [ ] **Step 4: Commit**

```bash
git add src/components/BottomNav.tsx src/App.tsx
git commit -m "feat: bottom navigation and route structure"
```

---

### Task 9: Team rosters view

**Files:**
- Create: `src/components/TeamRosters.tsx`

- [ ] **Step 1: Implement TeamRosters**

Create `src/components/TeamRosters.tsx`:

```tsx
import type { Team, Player } from '../lib/types'

interface Props {
  teams: Team[]
  players: Player[]
}

export function TeamRosters({ teams, players }: Props) {
  const unassigned = players.filter(p => !p.team_id)

  return (
    <div className="px-4 pt-6 pb-24">
      <h2 className="text-xl font-bold text-center mb-4">👥 Teams</h2>

      <div className="grid grid-cols-2 gap-3">
        {teams.map((team, i) => {
          const teamPlayers = players
            .filter(p => p.team_id === team.id)
            .sort((a, b) => a.first_name.localeCompare(b.first_name))
          const color = i === 0 ? 'border-green-600' : 'border-red-600'

          return (
            <div key={team.id} className={`bg-gray-900 rounded-lg p-3 border-t-2 ${color}`}>
              <h3 className="font-bold text-sm text-center mb-2">{team.name}</h3>
              {teamPlayers.length === 0 ? (
                <p className="text-xs text-gray-500 text-center">Draft pending</p>
              ) : (
                <ul className="space-y-1">
                  {teamPlayers.map(p => (
                    <li key={p.id} className="text-xs text-gray-300">
                      {p.first_name} {p.last_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {unassigned.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm text-gray-500 text-center mb-2">
            Awaiting draft ({unassigned.length})
          </h3>
          <div className="flex flex-wrap gap-1 justify-center">
            {unassigned.map(p => (
              <span key={p.id} className="text-xs bg-gray-800 px-2 py-1 rounded">
                {p.first_name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TeamRosters.tsx
git commit -m "feat: team rosters view with draft-pending state"
```

---

### Task 10: Forfeit wheel (TDD)

**Files:**
- Create: `src/components/ForfeitWheel.tsx`
- Create: `tests/ForfeitWheel.test.tsx`

- [ ] **Step 1: Write failing tests for wheel logic**

Create `tests/ForfeitWheel.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ForfeitWheel } from '../src/components/ForfeitWheel'
import type { Forfeit } from '../src/lib/types'

const forfeits: Forfeit[] = [
  { id: '1', text: 'Down your drink', is_used: false, created_at: '' },
  { id: '2', text: 'Do 10 press-ups', is_used: false, created_at: '' },
  { id: '3', text: 'Sing a song', is_used: false, created_at: '' },
  { id: '4', text: 'Dance for 30 seconds', is_used: false, created_at: '' },
]

describe('ForfeitWheel', () => {
  it('renders the spin button', () => {
    render(<ForfeitWheel forfeits={forfeits} onMarkUsed={() => {}} />)
    expect(screen.getByRole('button', { name: /spin/i })).toBeInTheDocument()
  })

  it('shows a result after spinning', async () => {
    vi.useFakeTimers()
    render(<ForfeitWheel forfeits={forfeits} onMarkUsed={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /spin/i }))

    // Advance past the spin animation (3 seconds)
    await act(async () => {
      vi.advanceTimersByTime(3500)
    })

    // One of the forfeit texts should be displayed as the result
    const resultTexts = forfeits.map(f => f.text)
    const displayed = resultTexts.some(text =>
      screen.queryByText(text, { exact: false })
    )
    expect(displayed).toBe(true)

    vi.useRealTimers()
  })

  it('disables button while spinning', () => {
    render(<ForfeitWheel forfeits={forfeits} onMarkUsed={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /spin/i }))

    const button = screen.getByRole('button', { name: /spinning/i })
    expect(button).toBeDisabled()
  })

  it('shows message when no forfeits available', () => {
    render(<ForfeitWheel forfeits={[]} onMarkUsed={() => {}} />)
    expect(screen.getByText(/no forfeits/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/ForfeitWheel.test.tsx
```

Expected: FAIL — cannot find module

- [ ] **Step 3: Implement ForfeitWheel**

Create `src/components/ForfeitWheel.tsx`:

```tsx
import { useState, useRef, useCallback } from 'react'
import type { Forfeit } from '../lib/types'

interface Props {
  forfeits: Forfeit[]
  onMarkUsed: (id: string) => void
}

export function ForfeitWheel({ forfeits, onMarkUsed }: Props) {
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<Forfeit | null>(null)
  const [rotation, setRotation] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const available = forfeits.filter(f => !f.is_used)

  const spin = useCallback(() => {
    if (available.length === 0 || spinning) return

    setSpinning(true)
    setResult(null)

    // Pick a random forfeit
    const idx = Math.floor(Math.random() * available.length)
    const chosen = available[idx]

    // Calculate rotation: at least 3 full spins + land on the segment
    const segmentAngle = 360 / available.length
    const targetAngle = 360 - (idx * segmentAngle + segmentAngle / 2)
    const totalRotation = rotation + 360 * 5 + targetAngle

    setRotation(totalRotation)

    // Show result after animation
    timerRef.current = setTimeout(() => {
      setResult(chosen)
      setSpinning(false)
    }, 3000)
  }, [available, spinning, rotation])

  if (forfeits.length === 0) {
    return (
      <div className="px-4 pt-6 pb-24 text-center">
        <h2 className="text-xl font-bold mb-4">🎡 Forfeit Wheel</h2>
        <p className="text-gray-500">No forfeits loaded yet</p>
      </div>
    )
  }

  const segmentAngle = available.length > 0 ? 360 / available.length : 360

  return (
    <div className="px-4 pt-6 pb-24 text-center">
      <h2 className="text-xl font-bold mb-4">🎡 Forfeit Wheel</h2>

      {/* Wheel */}
      <div className="relative w-72 h-72 mx-auto mb-6">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 text-2xl">
          ▼
        </div>

        {/* Spinning disc */}
        <div
          className="w-full h-full rounded-full border-4 border-gray-700 overflow-hidden relative"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
          }}
        >
          {available.map((forfeit, i) => {
            const startAngle = i * segmentAngle
            const colors = [
              'bg-red-800', 'bg-blue-800', 'bg-green-800', 'bg-yellow-800',
              'bg-purple-800', 'bg-pink-800', 'bg-indigo-800', 'bg-orange-800',
            ]
            return (
              <div
                key={forfeit.id}
                className={`absolute inset-0 ${colors[i % colors.length]}`}
                style={{
                  clipPath: `conic-gradient(from ${startAngle}deg, transparent 0deg, transparent ${segmentAngle}deg)`,
                  // Use a simpler visual approach
                  transform: `rotate(${startAngle}deg)`,
                  clipPath: `polygon(50% 50%, 50% 0%, ${
                    50 + 50 * Math.sin((segmentAngle * Math.PI) / 180)
                  }% ${
                    50 - 50 * Math.cos((segmentAngle * Math.PI) / 180)
                  }%)`,
                }}
              />
            )
          })}

          {/* Center circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center text-2xl">
              🎲
            </div>
          </div>
        </div>
      </div>

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={spinning || available.length === 0}
        className={`px-8 py-3 rounded-full font-bold text-lg ${
          spinning
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-yellow-600 text-white hover:bg-yellow-500 active:scale-95'
        } transition-all`}
      >
        {spinning ? '🌀 Spinning...' : '🎰 Spin!'}
      </button>

      {/* Result */}
      {result && (
        <div className="mt-6 bg-gray-900 rounded-lg p-4 mx-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">The forfeit is...</p>
          <p className="text-xl font-bold text-yellow-400">{result.text}</p>
          <button
            onClick={() => onMarkUsed(result.id)}
            className="mt-3 text-xs text-gray-500 underline"
          >
            Mark as done (remove from wheel)
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/ForfeitWheel.test.tsx
```

Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ForfeitWheel.tsx tests/ForfeitWheel.test.tsx
git commit -m "feat: animated forfeit wheel with spin and result display"
```

---

### Task 11: Realtime hooks

**Files:**
- Create: `src/hooks/useRealtimeTable.ts`
- Create: `src/hooks/useEventData.ts`
- Create: `src/hooks/useForfeits.ts`

- [ ] **Step 1: Create generic realtime table hook**

Create `src/hooks/useRealtimeTable.ts`:

```ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtimeTable<T extends { id: string }>(
  table: string,
  orderBy?: { column: string; ascending?: boolean },
): T[] {
  const [rows, setRows] = useState<T[]>([])

  useEffect(() => {
    // Initial fetch
    const query = supabase.from(table).select('*')
    if (orderBy) {
      query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
    }
    query.then(({ data }) => {
      if (data) setRows(data as T[])
    })

    // Subscribe to changes
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRows(prev => [...prev, payload.new as T])
          } else if (payload.eventType === 'UPDATE') {
            setRows(prev =>
              prev.map(row => row.id === (payload.new as T).id ? payload.new as T : row)
            )
          } else if (payload.eventType === 'DELETE') {
            setRows(prev =>
              prev.filter(row => row.id !== (payload.old as T).id)
            )
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, orderBy?.column, orderBy?.ascending])

  return rows
}
```

- [ ] **Step 2: Create event data hook that combines all tables**

Create `src/hooks/useEventData.ts`:

```ts
import { useMemo } from 'react'
import { useRealtimeTable } from './useRealtimeTable'
import { calcTeamTotals, calcRoundScores, calcIndividualTotals } from '../lib/scores'
import type { Team, Player, Round, TeamScore, IndividualScore } from '../lib/types'

export function useEventData() {
  const teams = useRealtimeTable<Team>('teams')
  const players = useRealtimeTable<Player>('players')
  const rounds = useRealtimeTable<Round>('rounds', { column: 'number', ascending: true })
  const teamScores = useRealtimeTable<TeamScore>('team_scores')
  const individualScores = useRealtimeTable<IndividualScore>('individual_scores')

  const totals = useMemo(
    () => calcTeamTotals(teams, teamScores),
    [teams, teamScores],
  )

  const roundScores = useMemo(
    () => calcRoundScores(teamScores),
    [teamScores],
  )

  const individualRankings = useMemo(
    () => calcIndividualTotals(players, individualScores),
    [players, individualScores],
  )

  const currentRound = useMemo(
    () => rounds.find(r => r.status === 'live') ?? null,
    [rounds],
  )

  return {
    teams,
    players,
    rounds,
    teamScores,
    individualScores,
    totals,
    roundScores,
    individualRankings,
    currentRound,
  }
}
```

- [ ] **Step 3: Create forfeits hook with mutations**

Create `src/hooks/useForfeits.ts`:

```ts
import { useCallback } from 'react'
import { useRealtimeTable } from './useRealtimeTable'
import { supabase } from '../lib/supabase'
import type { Forfeit } from '../lib/types'

export function useForfeits() {
  const forfeits = useRealtimeTable<Forfeit>('forfeits')

  const addForfeit = useCallback(async (text: string) => {
    await supabase.from('forfeits').insert({ text })
  }, [])

  const markUsed = useCallback(async (id: string) => {
    await supabase.from('forfeits').update({ is_used: true }).eq('id', id)
  }, [])

  return { forfeits, addForfeit, markUsed }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks/
git commit -m "feat: realtime hooks for all tables with event data aggregation"
```

---

### Task 12: Wire up the main app

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Connect all components to live data**

Replace `src/App.tsx`:

```tsx
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

function MainApp() {
  const [activeTab, setActiveTab] = useState<'scores' | 'forfeits' | 'teams'>('scores')
  const [scoreTab, setScoreTab] = useState<'teams' | 'individual'>('teams')
  const { teams, players, rounds, totals, roundScores, individualRankings, currentRound } = useEventData()
  const { forfeits, markUsed } = useForfeits()

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {activeTab === 'scores' && (
        <>
          <ScoreHeader teams={teams} totals={totals} currentRound={currentRound} />

          {/* Teams / Individual tabs */}
          <div className="flex border-b border-gray-800 mx-4 mb-3">
            <button
              onClick={() => setScoreTab('teams')}
              className={`flex-1 py-2 text-sm font-medium ${
                scoreTab === 'teams'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-500'
              }`}
            >
              Teams
            </button>
            <button
              onClick={() => setScoreTab('individual')}
              className={`flex-1 py-2 text-sm font-medium ${
                scoreTab === 'individual'
                  ? 'text-white border-b-2 border-white'
                  : 'text-gray-500'
              }`}
            >
              Individual
            </button>
          </div>

          {scoreTab === 'teams' && (
            <RoundTimeline rounds={rounds} teams={teams} roundScores={roundScores} />
          )}
          {scoreTab === 'individual' && (
            <IndividualBoard rankings={individualRankings} teams={teams} />
          )}
        </>
      )}

      {activeTab === 'forfeits' && (
        <ForfeitWheel forfeits={forfeits} onMarkUsed={markUsed} />
      )}

      {activeTab === 'teams' && (
        <TeamRosters teams={teams} players={players} />
      )}

      <BottomNav active={activeTab} onChange={setActiveTab} />
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
```

- [ ] **Step 2: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire up all components with realtime data"
```

---

### Task 13: Admin panel — score entry and round management

**Files:**
- Create: `src/components/admin/AdminPanel.tsx`
- Create: `src/components/admin/RoundScorer.tsx`
- Create: `src/components/admin/RoundControl.tsx`

- [ ] **Step 1: Implement RoundControl**

Create `src/components/admin/RoundControl.tsx`:

```tsx
import { supabase } from '../../lib/supabase'
import type { Round } from '../../lib/types'

interface Props {
  rounds: Round[]
}

export function RoundControl({ rounds }: Props) {
  const currentLive = rounds.find(r => r.status === 'live')
  const nextUpcoming = rounds
    .filter(r => r.status === 'upcoming')
    .sort((a, b) => a.number - b.number)[0]

  const startRound = async (round: Round) => {
    // End any currently live round first
    if (currentLive) {
      await supabase
        .from('rounds')
        .update({ status: 'completed' })
        .eq('id', currentLive.id)
    }
    await supabase
      .from('rounds')
      .update({ status: 'live' })
      .eq('id', round.id)
  }

  const endRound = async (round: Round) => {
    await supabase
      .from('rounds')
      .update({ status: 'completed' })
      .eq('id', round.id)
  }

  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-4">
      <h3 className="font-bold text-sm mb-3">Round Control</h3>

      {currentLive && (
        <div className="mb-3">
          <p className="text-xs text-yellow-400 mb-2">
            🔴 LIVE: R{currentLive.number} — {currentLive.name}
          </p>
          <button
            onClick={() => endRound(currentLive)}
            className="w-full py-2 bg-red-700 hover:bg-red-600 rounded text-sm font-medium"
          >
            End Round {currentLive.number}
          </button>
        </div>
      )}

      {nextUpcoming && !currentLive && (
        <button
          onClick={() => startRound(nextUpcoming)}
          className="w-full py-2 bg-green-700 hover:bg-green-600 rounded text-sm font-medium"
        >
          Start Round {nextUpcoming.number}: {nextUpcoming.emoji} {nextUpcoming.name}
        </button>
      )}

      {!nextUpcoming && !currentLive && (
        <p className="text-xs text-gray-500 text-center">All rounds complete! 🎉</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Implement RoundScorer**

Create `src/components/admin/RoundScorer.tsx`:

```tsx
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
      {
        round_id: round.id,
        team_id: winningTeamId,
        match_number: round.has_sub_matches ? matchNumber : null,
        points: round.points_per_win,
      },
      {
        round_id: round.id,
        team_id: losingTeamId,
        match_number: round.has_sub_matches ? matchNumber : null,
        points: round.points_per_loss,
      },
    ]

    const { error } = await supabase.from('team_scores').insert(scores)

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      const winnerName = teams.find(t => t.id === winningTeamId)!.name
      setMessage(`✅ ${winnerName} wins${round.has_sub_matches ? ` match ${matchNumber}` : ''}! (+${round.points_per_win} pts)`)
      if (round.has_sub_matches) {
        setMatchNumber(prev => prev + 1)
      }
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

  // Quiz-style scoring (round 1)
  if (round.number === 1) {
    return <QuizScorer teams={teams} onSubmit={scoreQuiz} saving={saving} message={message} />
  }

  // Standard win/lose scoring
  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-4">
      <h3 className="font-bold text-sm mb-1">
        {round.emoji} R{round.number}: {round.name}
      </h3>
      <p className="text-xs text-gray-500 mb-3">{round.scoring_guidance}</p>

      {round.has_sub_matches && (
        <p className="text-xs text-yellow-400 mb-2">
          Match {matchNumber} of {round.sub_match_count}
        </p>
      )}

      <p className="text-xs text-gray-400 mb-2">Who won?</p>
      <div className="flex gap-2">
        {teams.map(team => (
          <button
            key={team.id}
            onClick={() => scoreMatch(team.id)}
            disabled={saving}
            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded font-medium text-sm disabled:opacity-50"
          >
            {team.name}
          </button>
        ))}
      </div>

      {message && (
        <p className="text-xs mt-2 text-center">{message}</p>
      )}
    </div>
  )
}

function QuizScorer({
  teams,
  onSubmit,
  saving,
  message,
}: {
  teams: Team[]
  onSubmit: (a: number, b: number) => void
  saving: boolean
  message: string
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
            <input
              type="number"
              min={0}
              max={10}
              value={i === 0 ? scoreA : scoreB}
              onChange={e => i === 0
                ? setScoreA(parseInt(e.target.value) || 0)
                : setScoreB(parseInt(e.target.value) || 0)
              }
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-center"
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => onSubmit(scoreA, scoreB)}
        disabled={saving}
        className="w-full py-2 bg-blue-700 hover:bg-blue-600 rounded text-sm font-medium disabled:opacity-50"
      >
        Submit Quiz Scores
      </button>

      {message && (
        <p className="text-xs mt-2 text-center">{message}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Implement AdminPanel**

Create `src/components/admin/AdminPanel.tsx`:

```tsx
import { useState } from 'react'
import { useEventData } from '../../hooks/useEventData'
import { useForfeits } from '../../hooks/useForfeits'
import { RoundControl } from './RoundControl'
import { RoundScorer } from './RoundScorer'
import type { Player } from '../../lib/types'
import { supabase } from '../../lib/supabase'

export function AdminPanel() {
  const { teams, players, rounds, totals, currentRound } = useEventData()
  const { addForfeit } = useForfeits()
  const [forfeitText, setForfeitText] = useState('')

  const handleAddForfeit = async () => {
    if (!forfeitText.trim()) return
    await addForfeit(forfeitText.trim())
    setForfeitText('')
  }

  // Team assignment for the draft
  const assignPlayerToTeam = async (playerId: string, teamId: string) => {
    await supabase.from('players').update({ team_id: teamId }).eq('id', playerId)
  }

  const unassignedPlayers = players.filter(p => !p.team_id)

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 pb-8">
      <h1 className="text-xl font-bold mb-1">⚙️ Admin Panel</h1>
      <p className="text-xs text-gray-500 mb-4">
        Score: {teams.map(t => `${t.name} ${totals[t.id] ?? 0}`).join(' - ')}
      </p>

      {/* Round control */}
      <RoundControl rounds={rounds} />

      {/* Score entry for current live round */}
      {currentRound && (
        <RoundScorer round={currentRound} teams={teams} players={players} />
      )}

      {/* Team draft */}
      {unassignedPlayers.length > 0 && teams.length === 2 && (
        <div className="bg-gray-900 rounded-lg p-4 mb-4">
          <h3 className="font-bold text-sm mb-3">🎯 Team Draft</h3>
          <p className="text-xs text-gray-500 mb-2">Tap a name, then pick their team</p>
          {unassignedPlayers.map(player => (
            <DraftRow
              key={player.id}
              player={player}
              teamNames={teams.map(t => ({ id: t.id, name: t.name }))}
              onAssign={assignPlayerToTeam}
            />
          ))}
        </div>
      )}

      {/* Add forfeit */}
      <div className="bg-gray-900 rounded-lg p-4 mb-4">
        <h3 className="font-bold text-sm mb-3">🎡 Add Forfeit</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={forfeitText}
            onChange={e => setForfeitText(e.target.value)}
            placeholder="e.g. Dance like a chicken"
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
          />
          <button
            onClick={handleAddForfeit}
            className="px-4 py-2 bg-yellow-700 hover:bg-yellow-600 rounded text-sm font-medium"
          >
            Add
          </button>
        </div>
      </div>

      {/* Link to leaderboard */}
      <a
        href="/"
        className="block text-center text-sm text-blue-400 underline"
      >
        View leaderboard →
      </a>
    </div>
  )
}

function DraftRow({
  player,
  teamNames,
  onAssign,
}: {
  player: Player
  teamNames: { id: string; name: string }[]
  onAssign: (playerId: string, teamId: string) => void
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800">
      <span className="text-sm">{player.first_name} {player.last_name}</span>
      <div className="flex gap-1">
        {teamNames.map(team => (
          <button
            key={team.id}
            onClick={() => onAssign(player.id, team.id)}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs"
          >
            {team.name}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify admin panel renders**

```bash
npm run dev
```

Navigate to `http://localhost:5173/admin`. Expected: Admin panel with round control, draft section, and add forfeit input.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/
git commit -m "feat: admin panel with score entry, round control, draft, and forfeit management"
```

---

### Task 14: Simulated event script

**Files:**
- Create: `scripts/simulate-event.ts`

- [ ] **Step 1: Create simulation script**

Create `scripts/simulate-event.ts`:

```ts
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

  // Get teams and rounds
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
  await supabase.from('team_scores').delete().neq('id', '')
  await supabase.from('individual_scores').delete().neq('id', '')

  // Reset all rounds to upcoming
  await supabase.from('rounds').update({ status: 'upcoming' }).neq('id', '')

  // Simulate each round
  for (const round of rounds) {
    console.log(`\n--- Round ${round.number}: ${round.emoji} ${round.name} ---`)

    // Start round
    await supabase.from('rounds').update({ status: 'live' }).eq('id', round.id)
    console.log('  Status: LIVE')
    await sleep(2000)

    if (round.number === 1) {
      // Quiz — random scores
      const scoreA = Math.floor(Math.random() * 6) + 4  // 4-9
      const scoreB = Math.floor(Math.random() * 6) + 4
      await supabase.from('team_scores').insert([
        { round_id: round.id, team_id: teamIds[0], points: scoreA },
        { round_id: round.id, team_id: teamIds[1], points: scoreB },
      ])
      console.log(`  ${teams[0].name}: ${scoreA} pts, ${teams[1].name}: ${scoreB} pts`)
    } else if (round.has_sub_matches) {
      // Multi-match rounds
      for (let m = 1; m <= (round.sub_match_count ?? 3); m++) {
        const [winnerId, loserId] = pickWinner(teamIds)
        const winner = teams.find(t => t.id === winnerId)!
        await supabase.from('team_scores').insert([
          { round_id: round.id, team_id: winnerId, match_number: m, points: round.points_per_win },
          { round_id: round.id, team_id: loserId, match_number: m, points: round.points_per_loss },
        ])

        // Individual scores for winning players
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
      // Single result
      const [winnerId, loserId] = pickWinner(teamIds)
      const winner = teams.find(t => t.id === winnerId)!
      await supabase.from('team_scores').insert([
        { round_id: round.id, team_id: winnerId, points: round.points_per_win },
        { round_id: round.id, team_id: loserId, points: round.points_per_loss },
      ])
      console.log(`  ${winner.name} wins (+${round.points_per_win})`)
    }

    // Complete round
    await supabase.from('rounds').update({ status: 'completed' }).eq('id', round.id)
    console.log('  Status: COMPLETED')
    await sleep(1000)
  }

  // Final scores
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

simulate().catch(err => {
  console.error('Simulation failed:', err)
  process.exit(1)
})
```

- [ ] **Step 2: Add script to package.json**

Add to `"scripts"`:

```json
"simulate": "npx tsx scripts/simulate-event.ts"
```

- [ ] **Step 3: Commit**

```bash
git add scripts/simulate-event.ts
git commit -m "feat: event simulation script for end-to-end testing"
```

---

### Task 15: Run all tests and verify

- [ ] **Step 1: Run the full test suite**

```bash
npx vitest run
```

Expected: All tests pass (scores: 7, ScoreHeader: 3, ForfeitWheel: 4 = 14 total)

- [ ] **Step 2: Verify dev server works**

```bash
npm run dev
```

Navigate to `http://localhost:5173` — leaderboard should render (empty state until Supabase is connected and seeded).
Navigate to `http://localhost:5173/admin` — admin panel should render.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "chore: verify all tests passing and app renders"
```

---

### Task 16: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

Create `README.md`:

```markdown
# Stag Olympics Leaderboard

Live leaderboard for Diccon's stag olympics. Real-time score tracking, forfeit wheel, and admin panel.

## Requirements

- Node.js 18+
- Supabase account (free tier)

## Setup

1. Clone and install:

```bash
git clone <repo-url>
cd stag-olympics
npm install
```

2. Create a Supabase project at [supabase.com](https://supabase.com)

3. Run the migration in Supabase SQL editor: copy `supabase/migrations/001_initial_schema.sql`

4. Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

5. Seed the database:

```bash
SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<service-key> npm run seed
```

6. Start the dev server:

```bash
npm run dev
```

## Usage

- **Leaderboard:** `http://localhost:5173` — public, share with everyone
- **Admin panel:** `http://localhost:5173/admin` — score entry, round control, team draft
- **Simulate event:** `SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<key> npm run simulate`

## Admin Panel

- Start/end rounds
- Enter scores (pick the winner, or enter quiz scores)
- Assign players to teams (Friday night draft)
- Add forfeits to the wheel
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup and usage instructions"
```
