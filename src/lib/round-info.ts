/** Static reference info for each round, displayed on the admin screen */
export interface RoundInfo {
  format: string
  scoring: string
  kit: string
  drinking: string
  rules?: string[]
  /** Penalty the losing team carries into this round if they skipped their forfeit */
  penalty?: string
}

export const ROUND_INFO: Record<number, RoundInfo> = {
  1: {
    format: 'Quiz — 10 multiple choice questions about Diccon. Everyone answers on their phone. Top 2 scorers become team captains.',
    scoring: '1 pt per correct answer (up to 10). Individual scores carry to drafted teams.',
    kit: 'Phones only — quiz is in the app at /quiz',
    drinking: 'Wrong answers = team drinks (after draft)',
  },
  2: {
    format: 'Best of 3 matches, 3v3 from each team. Everyone watches and heckles.',
    scoring: '3 pts to winning team per match, 1 pt to loser. 9 pts available. Winning players get individual points.',
    kit: 'Petanque set (check if castle has one)',
    drinking: 'Losers of each match take a penalty drink',
    penalty: 'Oven mitts',
    rules: [
      'Flip a coin — winner picks who throws the cochonnet (jack) first.',
      'The cochonnet must land 6-10 metres away. If it\'s too short or out of bounds, the other team throws it.',
      'The team that threw the cochonnet throws the first boule, trying to land it as close as possible.',
      'The OTHER team then throws until they get a boule closer than the best opposing boule (or run out of boules).',
      'Once a team is closest, the other team throws. Keep alternating like this.',
      'When all boules are thrown, the closest team scores: 1 point per boule that is nearer than the opponent\'s best.',
      'First team to 13 points wins the match. (For time, you can also play a fixed number of ends.)',
      'Boules can be thrown to knock opponents\' boules away — this is encouraged.',
      'Feet must stay together inside a small circle (or behind a line) when throwing.',
    ],
  },
  3: {
    format: 'Pairs face each other, step back after each successful catch. Last pair standing scores for their team.',
    scoring: '3 pts to winner, 1 pt to loser.',
    kit: 'Water balloons (bag of 100)',
    drinking: 'None needed — the punishment is getting wet',
    penalty: 'Oven mitts',
  },
  4: {
    format: 'Best of 3 rounds, rotating doubles pairs from each team.',
    scoring: '3 pts to winning team per round, 1 pt to loser. 9 pts available. Winning players get individual points.',
    kit: 'Ping pong balls, plastic cups, table, beer',
    drinking: "It's beer pong — drinking IS the game",
    penalty: 'Left handed',
  },
  5: {
    format: 'Best of 3 doubles matches. Each team picks a pair for each match — rotate players. First to 11 points per match (no deuces).',
    scoring: '3 pts to winning team per match, 1 pt to loser. 9 pts available. Winning players get individual points.',
    kit: 'Rackets and balls (castle should have them — check in advance)',
    drinking: 'Losers of each match take a penalty drink. Spectators heckle from the sideline with beers.',
    penalty: 'Banana costume',
    rules: [
      'Doubles: both players on a team take turns hitting. Alternate who serves each game.',
      'Rally scoring to 11 — every rally wins a point regardless of who served.',
      'No deuces — first to 11 wins outright.',
      'Serve underhand from behind the baseline. Ball must bounce once on each side (serve + return).',
      'After the serve and return, volleys (hitting before a bounce) are allowed.',
      'Ball must land inside the lines (or on the line). Out = point to the other team.',
      'If it hits the net and goes over, play continues. If it hits the net and doesn\'t clear, point to the other team.',
      'Switch sides at 6 points (or halfway if playing a shorter game).',
      'Keep it friendly — the admin\'s call is final on disputed line calls.',
    ],
  },
  6: {
    format: 'Each team has 10 minutes to create the best portrait or sculpture of Diccon using only items found in the castle grounds. Diccon judges both entries.',
    scoring: '5 pts to winner, 2 pts to loser. Diccon picks the winner.',
    kit: "Whatever's around — that's the point",
    drinking: 'Diccon assigns a penalty to his least favourite entry',
    penalty: 'Banana costume',
  },
  7: {
    format: 'Forehead on the bat (or broom handle), 10 spins, sprint to the cone and back. Full team relay.',
    scoring: '3 pts to winner, 1 pt to loser.',
    kit: 'Broom handle or bat, cones (or shoes)',
    drinking: 'Each runner finishes half a beer before spinning',
    penalty: 'Horse head',
  },
  8: {
    format: 'Full team relay. Line up either side of a table, drink, flip, next person goes. Best of 3.',
    scoring: '5 pts to winner, 2 pts to loser.',
    kit: 'Plastic cups, beer, table',
    drinking: "It's flip cup — you're already drinking",
    penalty: 'Horse head',
  },
}
