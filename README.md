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
