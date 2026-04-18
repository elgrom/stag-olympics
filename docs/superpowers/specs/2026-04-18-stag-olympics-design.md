# Stag Olympics Leaderboard — Design Spec

## Overview

A live leaderboard web app for Diccon's stag olympics (Saturday 2nd May), with a WhatsApp bot for score entry, proactive event guidance, and group announcements. 2 teams, 17 players, 8 rounds at a castle in France.

## Goals

- Live leaderboard anyone can view on their phone — no login required
- WhatsApp bot for score entry (admin chat) and announcements (main group)
- Bot acts as a best man's assistant — proactively guides through the day with next steps, kit reminders, and scoring rules
- Team and individual leaderboards
- Forfeit spinner wheel with pre-loaded and on-the-fly forfeits
- Realtime updates — scores appear on all phones instantly

## Non-Goals

- User authentication or login
- Photo uploads
- Push notifications
- Post-event historical data
- Native mobile app

## Tech Stack

- **Frontend:** React + TypeScript, Vite, hosted on S3 + CloudFront
- **Backend/DB:** Supabase (PostgreSQL + Realtime + Edge Functions)
- **WhatsApp:** Twilio WhatsApp API
- **Styling:** Tailwind CSS or CSS modules (dark theme, mobile-first)

## Players

17 attendees split into 2 teams via schoolyard draft on Friday night:

Adam Broomhead, Ady LeRoux, Brandon Austin, Bryan Bennet, Cam Miskin, Dave Jensen, Dom Obrien, Dom Andre, Grahame Johnston, Ian Dyckhoff, Iggy Harris, Jonathan Midgely, Pedro Leon, Ricky Iles, Seb Mayfield, Simon None, Marc Sparrow

Diccon is the groom (not on a team — he judges Round 6).

## Rounds

| # | Round | Time | Format | Team Points | Individual Scoring |
|---|-------|------|--------|-------------|-------------------|
| 1 | How Well Do You Know Diccon? | 12:00 | Quiz — 10 questions, each team writes answers | 1 pt per correct answer (up to 10) | No |
| 2 | Petanque | 12:30 | Best of 3 matches, 3v3 | 3/1 per match (up to 9) | Yes — winning pair/trio |
| 3 | Water Balloon Toss | 13:00 | Pairs, step back each catch, last standing wins | 3/1 | No |
| 4 | Beer Pong | 13:30 | Best of 3 rounds, doubles | 3/1 per round (up to 9) | Yes — winning pair |
| - | BREAK | 14:00 | Top up drinks, check scoreboard | - | - |
| 5 | Tennis | 14:30 | Best of 3 doubles, first to 11 | 3/1 per match (up to 9) | Yes — winning pair |
| 6 | Taskmaster: Portrait of the Groom | 15:30 | 10 mins, found materials, Diccon judges | 5/2 | No |
| 7 | Dizzy Bat Relay | 16:00 | Full team relay, 10 spins each | 3/1 | No |
| 8 | Flip Cup Finale | 16:30 | Full team relay, best of 3 | 5/2 | No |

**Scoring rules:**
- Standard rounds: 1st place = 3 pts, 2nd = 1 pt
- Multi-match rounds (petanque, beer pong, tennis): 3/1 per individual match
- Special rounds (taskmaster, flip cup finale): 5/2
- Quiz: 1 pt per correct answer

**Individual scoring** is results-based only — in rounds with direct competition (petanque, beer pong, tennis), each player on the winning side of a match gets 1 individual point. Team-only rounds have no individual scores. Individual points are separate from team points — they only determine MVP and wooden spoon.

## Web App

### Layout — Mobile-first, dark theme

**Top section (always visible):**
- Title: "Stag Olympics" with trophy emoji
- Current round indicator: "Round N of 8 — [Round Name]"
- Two large score boxes side by side showing team names and totals, leading team highlighted
- Thin proportional score ratio bar below the boxes

**Tab bar below scores:** "Teams" | "Individual"

**Teams tab (default):**
- Timeline of round cards, most recent at top
- Live round: highlighted border, "LIVE" badge, current match status, scoring guidance
- Completed rounds: team colour border (winning team), result text, point breakdown per team
- Upcoming rounds: greyed out, showing time and points available

**Individual tab:**
- Player leaderboard sorted by total individual points descending
- Each row: rank, player name, team colour indicator, total points
- Top player highlighted as MVP candidate
- Bottom player highlighted as wooden spoon candidate

### Bottom Navigation

Three sections:

**1. Scores** (default) — the leaderboard described above

**2. Forfeit Wheel**
- Animated spinning wheel populated with forfeit texts
- Tap/button to spin, decelerates and lands on a random forfeit
- Displays the selected forfeit prominently after landing
- Forfeits come from the database — pre-loaded list plus any added via WhatsApp on the day
- Used forfeits can optionally be marked so they don't repeat

**3. Teams**
- Two team rosters side by side (or stacked on narrow screens)
- Each team shows: team name, list of players
- Set up after the Friday night draft

## WhatsApp Bot

### Two group chats

**Admin chat** — you (Dave) plus a couple of helpers. This is where you interact with the bot to manage the event.

**Main group** — everyone. Bot posts announcements and results here. Nobody interacts with the bot in this chat.

### Admin Chat Commands

**Score entry:**
- `score r2 m1 alpha` — Round 2, Match 1, Team Alpha wins (awards 3 pts to Alpha, 1 pt to Beta)
- `score r2 m2 beta` — Round 2, Match 2, Team Beta wins
- `quiz alpha 7 beta 4` — Quiz round, Alpha got 7, Beta got 4
- `taskmaster alpha 5 beta 2` — Diccon judged, Alpha wins (5/2)

**Individual scoring (for rounds with direct competition):**
- `players r2 m1 cam ricky` — Cam and Ricky played in Round 2 Match 1 (associated with the winning team's score)

**Round management:**
- `start r3` — Announces Round 3 to the main group, marks it live on the leaderboard
- `end r3` — Marks round complete (auto-triggered when all match scores are in for multi-match rounds)

**Forfeit management:**
- `forfeit Dance like a chicken for 30 seconds` — Adds a new forfeit to the wheel
- `spin` — Bot picks a random forfeit and posts it to admin chat

**Help:**
- `help` — Lists available commands
- `status` — Shows current round, scores, what's next

### Proactive Bot Behaviour

After scores are logged for a round:

1. **Confirms in admin chat:** "Round 2 done! Petanque: Alpha 5 - Beta 7. Beta takes the round!"
2. **Posts to main group:** "🎯 Round 2 — Petanque: COMPLETE! Beta wins! Alpha 5 - 7 Beta. Overall: Alpha 16 - Beta 19. 📊 Live leaderboard: [link]"
3. **Immediately follows up in admin chat with next round guidance:**
   - "Next up: **Round 3 — Water Balloon Toss** at 13:00"
   - "Kit needed: Water balloons"
   - "Scoring: 3/1 — last pair standing wins for their team"
   - "No individual scoring this round"
   - "When you're ready, send `start r3` to announce it"

When `start r[N]` is sent:

1. **Posts to main group:** "🎈 Round 3 — Water Balloon Toss starting! Pairs face each other, step back after each catch. Last pair standing scores for their team!"
2. **Reminds admin chat:** "Round 3 is live. When it's done, send `score r3 [alpha/beta]` for the winning team."

After the final round (Round 8):

1. Posts final results to main group with overall winner
2. Prompts admin chat: "Medal ceremony time! MVP: [top individual scorer]. Wooden spoon: [lowest scorer]. Want me to announce it?"

### Message Tone

Casual, laddish, fun. Not corporate. The bot should feel like an enthusiastic mate running the show, not an automated system. Short messages, emojis welcome, bit of banter.

## Database Schema (Supabase PostgreSQL)

### teams
- `id` UUID, primary key
- `name` text, not null (e.g. "Alpha", "Beta")
- `created_at` timestamptz

### players
- `id` UUID, primary key
- `first_name` text, not null
- `last_name` text, not null
- `team_id` UUID, foreign key → teams.id (nullable — null before draft)
- `created_at` timestamptz

### rounds
- `id` UUID, primary key
- `number` integer, not null (1-8)
- `name` text, not null
- `emoji` text (e.g. "🎯", "🍺")
- `scheduled_time` text (e.g. "12:00")
- `format` text (description of how the round works)
- `scoring_guidance` text (what to send in WhatsApp to score this round)
- `max_team_points` integer
- `has_individual_scoring` boolean, default false
- `has_sub_matches` boolean, default false
- `sub_match_count` integer (e.g. 3 for best-of-3 rounds)
- `points_per_win` integer, default 3
- `points_per_loss` integer, default 1
- `status` text, default 'upcoming' (upcoming / live / completed)
- `created_at` timestamptz

### team_scores
- `id` UUID, primary key
- `round_id` UUID, foreign key → rounds.id
- `team_id` UUID, foreign key → teams.id
- `match_number` integer (null for single-result rounds, 1/2/3 for sub-matches)
- `points` integer, not null
- `created_at` timestamptz

### individual_scores
- `id` UUID, primary key
- `round_id` UUID, foreign key → rounds.id
- `player_id` UUID, foreign key → players.id
- `match_number` integer
- `points` integer, not null
- `created_at` timestamptz

### forfeits
- `id` UUID, primary key
- `text` text, not null
- `is_used` boolean, default false
- `created_at` timestamptz

## Realtime Subscriptions

The frontend subscribes to changes on:
- `team_scores` — update team totals and round cards
- `individual_scores` — update individual leaderboard
- `rounds` — update round status (upcoming → live → completed)
- `forfeits` — update the wheel when new forfeits are added

## Deployment

- **Frontend:** Build with Vite, deploy to S3 bucket, serve via CloudFront with a custom domain or CloudFront URL
- **Backend:** Supabase project (hosted) — Edge Functions deployed via Supabase CLI
- **Twilio:** WhatsApp sandbox for development, production WhatsApp sender for the day
- **Environment variables:** Supabase URL, Supabase anon key, Twilio credentials — stored in Supabase Edge Function secrets and frontend .env

## Pre-event Setup Checklist

1. Create Supabase project, run schema migrations
2. Seed rounds table with all 8 rounds and their scoring rules
3. Seed players table with all 17 names
4. Pre-load forfeits
5. Deploy frontend to S3
6. Set up Twilio WhatsApp — configure webhook to Supabase Edge Function
7. Add bot to admin WhatsApp group and main WhatsApp group
8. After Friday night draft: assign players to teams via admin chat or direct DB update
