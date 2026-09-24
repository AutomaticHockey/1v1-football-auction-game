# engine-tools

The game (`../index.html`) runs the **Cornerstone** engine (`D:\NFL game test\src\core`; on GitHub,
`AutomaticHockey/FootballGM-test`) compiled from its own TypeScript, with the real players rated from
**Madden NFL 26** and graded mostly on their **2025 production**. None of these tools are needed to play; they rebuild and check what goes into
the page.

## How the game uses the engine

- **Every play is Cornerstone's engine.** `cornerstone/` is a verbatim snapshot of the engine files
  (`SOURCE.txt` names the commit). `build.mjs` compiles it with esbuild, applying `patches.mjs`, and
  keeps only the `TUNING` sections the engine reads.
- **With the hooks off, the patches don't change how a play or game is simulated.** They export
  three functions so `game.ts` can play a quarter at a time. They add two usage hooks where the
  engine picks who gets the ball, and five grade hooks where a play turns out (see below). `equiv.mts`
  proves the compiled engine, hooks off, matches Cornerstone's own `simulateGame` exactly: every
  score, stat line and play-recorder event. The game always plays with the hooks on.
- **Players are rated.** `ratings.mts` turns Madden 26 (Week 18: the end of the 2025
  regular season, the same season as the player file) into engine ratings by percentile. A player's
  rank at his position in Madden becomes the same rank among Cornerstone's generated players, so the
  league keeps the engine's own rating distribution. A DEF pick is that team's real defense: its best
  4 edge rushers, 4 interior linemen, 4 linebackers, 5 corners and 4 safeties. Everyone else is
  filler: the engine's league-average player at that depth slot.
- **Tight ends are rated from production, for now.** EA's ratings feed was out of reach when they were
  added, so `ratings-production.mts` places each TE at his percentile of 2025 receiving yards a game
  among the league's tight ends (8+ games) on Cornerstone's generated TEs, one level for every rating.
  `ratings.mts` rates them from Madden like everyone else as soon as the Madden file has them (it
  handles TEs already); rerun it, and skip `ratings-production.mts`.
- **Usage: who gets the ball.** Your engine picks targets and back carries by depth slot and ratings,
  and can't know a player's team role. With `opts.usage`, those two picks weigh each player by his
  real 2025 volume (targets a game, carries a game), and the backups beside him give up most of
  theirs to the real players (see fill-ins). His route and run fitness, from his ratings, still
  decide which routes and which runs. Quarterback runs and receiver carries stay the engine's.
  An RB in FLEX next to the RB: the two re-split the carries they have together, half by real
  carries and half by overall.
- **Grades: how well.** The engine's ratings barely separate skill players (a back 15 points better
  gained about 0.45 yards a carry), so a star RB, WR or FLEX hardly changed who won. `grades.mjs`
  grades every real player and defense, 70% on his 2025 production and 30% on his Madden rating
  (read off production's own spread by rank): a back's yards per carry and per catch, a receiver's or
  tight end's catch rate and yards per catch, a quarterback's completion rate, yards and interceptions
  a game (the file has no attempts), a defense's yards allowed and takeaways. Five hooks apply them on
  every play the player is in: a run's yards and its breakaway chance, the completion and
  interception chances of a throw, yards on a catch. The gains in `SIMKIT.K.grade` are fitted
  (`calibrate.js`) so that, at full strength, a player on an otherwise average team plays at his
  grade. Filler has no grade, so an all-filler game is still the engine's own.
- **Backs break long runs.** Most of a back's yards-a-carry edge (`K.grade.runBreakaway`, 80%) comes
  through the engine's own breakaway: a draw from the top 2.9% of the run table, the 20-yard-plus
  runs. A better back gets an extra chance of one on every carry; a worse one loses some of his (and
  past all of them, the rest comes off every carry). The other 20% moves every carry. As played,
  Cook, Gibbs, Achane and Robinson break 20+ on 5.1-5.7% of carries (2.6-3.1% before), Spears and
  Singletary on 0.6-1.3% (2.4-2.6%), around the league's 2.9%.
- **Fill-ins play below every real player, and less.** Everyone but the auctioned players is a
  fill-in: the backups beside them and whoever an empty slot gets. Their ratings are the engine's
  league-average player at that depth, but graded players' production made the weakest real players
  worse than that: a fill-in WR out-gained 33 of the 60 real WRs a target, and an empty QB, RB, WR or
  TE slot did as well as the weakest real pick. Now each fill-in at QB, RB, WR and TE takes, part by
  part, the worst real player's edges at his position (as played), less `K.fill.margin` (25%) of the
  real spread, and ranks behind every real player on the depth chart. The backups also keep only
  `K.fill.touches` (30%) of the touches their depth role would get (17% of a team's targets and backs'
  carries, from 40% and 30%); the real players take the rest by their real volume, so a real player
  runs about 30% above his 2025 volume on an otherwise average team. An empty slot's fill-in gets the
  average real player's volume at his position instead (`DATA.volume`), so any real pick beats him.
  An empty DEF slot already was worse than any real defense (31 points allowed against 19 to 26).
  `opts.fillers: 'engine'` turns all of it off (the baseline check and `ref` use it).
- **Balance: how much the gap counts.** `SIMKIT.K.balance` scales, per slot, both a player's grade
  edges and his ratings' distance from the league-average starter, so his mix of production and
  Madden holds. It is chosen by win rates, with the game's fill-ins: the best player at a slot against
  the worst, everything else equal, wins about QB 78%, DEF 72%, RB, WR and TE 60% (`calibrate.js`).
- **This game's rules** (`game.ts`, `opts.neutral`): no crowd, a mild 5 mph day (the league's average
  weather cost), no pace draw. Also quarter-by-quarter play, up to three overtime periods under the
  engine's own rules, and a drive log read off the engine's play recorder.

| File | What it is |
|---|---|
| `cornerstone/` | Verbatim snapshot of the engine's source (never edited; `SOURCE.txt` has the commit). |
| `patches.mjs` | The game's edits, applied at build time. Each must match exactly once, or the build stops. |
| `hooks.ts`, `stubs/` | The usage hook switch; a stand-in for `generate.ts` (one function the depth chart needs). |
| `game.ts` | The game's driver: quarters, overtime, neutral field, usage and grade hooks, drive log. |
| `simkit.src.js` | SIMKIT: builds each side's roster from the ratings, with real usage, grades, balance and filler. |
| `grades.mjs` | Each real player's and defense's grade (70% 2025 production, 30% Madden). `node grades.mjs` lists them. |
| `madden-fetch.js` | Downloads Madden 26 ratings from EA's public ratings feed into `madden26-week-18.json`. |
| `ratings.mts` | Madden to engine ratings (`ratings.json`). |
| `ratings-production.mts` | Engine ratings from 2025 production for players Madden hasn't rated here (today, the TEs). |
| `players-te.js` | Adds the 24 tight ends to the player file from nflverse's 2025 season stats. |
| `build.mjs` | Builds `engine.js` (ENGINE) and `simkit.js` (SIMKIT, with the ratings and grades). |
| `embed-engine.js`, `embed-players.js` | Put the engine, or the player file, into `index.html`. |
| `equiv.mts` | Gate: the compiled engine equals Cornerstone's `simulateGame`. |
| `check.js`, `favorite.js` | Sim against real 2025 lines; how often the better roster wins. |
| `calibrate.js` | Fits `SIMKIT.K.grade` (each player at his grade) and reports the win rates `K.balance` is set by. |
| `cpu-values.js` | Each player's worth to the CPU opponent (`cpu-values.json`, `SIMKIT.value`): points of margin over an empty slot. |

## Commands

The tools find the Cornerstone repo at `D:/NFL game test`; set `CORNERSTONE` to its folder when it is
elsewhere (with `npm ci` run there). `build.mjs` takes esbuild from it, or from `ESBUILD_FROM`'s
`package.json` (0.25 and 0.28 build the same bytes).

Rebuild after the engine changes (from this folder unless noted):

    cd "D:/NFL game test"
    git show HEAD:src/core/<file>.ts > "<this folder>/cornerstone/<file>.ts"   (for each file in cornerstone/; update SOURCE.txt)
    node build.mjs
    cd "D:/NFL game test" && npx tsx "<this folder>/equiv.mts" "<this folder>/engine.js" 2000   (must print 0 mismatches twice)
    node check.js 200
    node calibrate.js 200      (grade slopes near 1; win rates on target, else refit K.grade / K.balance)
    node embed-engine.js

If a patch no longer matches, the build names it. Port that edit by hand, then run `equiv.mts`.
`calibrate.js` tries values without a rebuild: `GRADE='{"run":0.8}' BALANCE='{"QB":0.6}' node calibrate.js`.

New ratings, or a new player file:

    node madden-fetch.js [iteration, default 19-week-18]
    cd "D:/NFL game test" && npx tsx "<this folder>/ratings.mts"
    cd "D:/NFL game test" && npx tsx "<this folder>/ratings-production.mts" <stats csv>   (only while Madden lacks the TEs)
    node build.mjs && node calibrate.js 200 && node cpu-values.js && node build.mjs && node embed-engine.js
      (the grades come from both files; the CPU's values from how players play, so remeasure them after
      anything that changes that: ratings, grades, balance, fill-ins)
    node embed-players.js   (after changing the player file)

The tight ends (the stats CSV is nflverse's, `stats_player/stats_player_reg_2025.csv` in its
`nflverse-data` releases; the script first checks it rebuilds every WR in the file exactly):

    node players-te.js stats_player_reg_2025.csv && node embed-players.js

## The CPU opponent

*Vs CPU* puts the CPU in Player 2's seat (Classic rules). The page's `CPU OPPONENT` section has the
logic; `cpu-values.js` measures what it knows: each player in his slot (and each back, receiver and
tight end at FLEX) against the same league-average team with that slot empty, 3,000 games each on
every core (about 4 minutes). QBs are worth 6.4 to 16.7 points a game over an empty slot, defenses 2.3
to 11.7, backs 0.5 to 7.4, receivers 1.3 to 4.7, tight ends 1.5 to 4.8; each is good to about ±0.25.

It never sees what comes next (lots are drawn when they come up); it judges each player against the
undrawn players who could still fill the slot. Its price: $1 plus dollars-per-point times his value
over the slot's floor, the budget shared only over the slots the other side can still fight for.
Solo offers: Hard works out when to sign by optimal stopping over the offers left (each decline
redraws and adds $1, the fourth is forced). Easy and Normal misjudge values (by a random factor per
player per game), and Easy overpays.

Measured by playing whole auctions in the page and simming the two rosters (150 auctions each): Hard
beats a card reader (a human stand-in that ranks players by their card's lead stat and spends a fair
share on the good ones) 61.8%, Normal 51.0%, Easy 40.0%; Hard beats Normal 58.6%, Normal beats Easy
59.6%.

## Where it stands (2026-09-24, engine 4ffc55b)

`equiv.mts`, with every hook in the build: 2,000 games, 3.79M stat fields and 788,818 play-recorder
events, 0 mismatches for both Cornerstone's `simulateGame` and the game's driver.

`calibrate.js`, at full strength (balance 1) as the game uses a player (the game's fill-ins beside
him): every graded rate lands on its grade, bias within ±2% and slope 0.83 to 1.15 (points allowed,
which follows from the graded yards, 1.26). The QB and DEF refs carry the fill-ins.

`calibrate.js`, as played: the best player at each slot against the worst (by the card's lead
stat), everything else league average, the game's fill-ins, 10,000 games each.

| Slot | Matchup | Wins (before grades) |
|---|---|---|
| QB | Stafford vs Dart | 77.5% (72.1%) |
| DEF | Seahawks vs Cowboys | 71.9% (69.4%) |
| RB | Cook vs Spears | 61.4% (52.1%) |
| WR | Nacua vs Higgins | 59.7% (53.5%) |
| TE | McBride vs Barner | 58.3% to 59.8% (no TEs) |
| FLEX | Nacua / Gibbs / McBride vs an empty FLEX | 62.4% / 63.2% / 67.9% (51.8% / 52.5% / –) |

Fill-ins against the worst real players (300 games per real player, beside him): fill-in WRs gain
5.4 to 6.0 yards a target (the worst real WR, Ayomanor, 6.25), fill-in backs 3.1 to 3.25 a carry
(Carter 3.4), fill-in TEs 4.5 to 4.9 (Okonkwo 6.7). The weakest real pick beats an empty slot (6,000
games, the rest of the team the same): Ayomanor 56.4%, Higgins 57.5%, Carter 52.5%, Spears 53.5%,
Theo Johnson 55.8%, Ferguson 56.2%, Mariota 71.3%, the Cowboys defense 56.1%.

`check.js` puts each real player on an otherwise league-average team and compares 200 games with his
real 2025 per-game line. Bias is the average miss. Slope is how much of the gap between players
comes through (1 = all of it); by the balance, QB, DEF and receivers' yards a catch sit near half.
Real players run about 30% above their 2025 volume (the backups' touches), so their per-game lines
do too; their rates stay on their lines.

| Stat | Bias | Slope (before grades) | Driven by |
|---|---|---|---|
| WR targets / RB carries / TE targets | +34% / +31% / +30% | 1.14 / 0.91 / 1.09 (0.96 / 1.01 / –) | real usage plus the backups' |
| WR receptions / yards | +29% / +24% | 1.06 / 1.04 (0.80 / 0.68) | usage plus grade |
| TE receptions / yards | +27% / +28% | 1.12 / 1.34 | usage plus grade |
| RB rushing yards / receiving yards | +33% / +37% | 1.07 / 1.24 (0.85 / –) | usage plus grade |
| RB yards per carry, WR / TE yards per catch | +1% / −5% / −1% | 0.74 / 0.32 / 0.31 (0.13 / 0.05 / –) | grade |
| QB passing yards / TDs / completion % | +4% / −22% / −1% | 0.60 / 0.59 / 0.51 (0.33 / 0.45 / 0.27) | grade |
| QB INTs | +6% | 0.66 (0.00) | grade |
| QB rushing yards | +4% | 0.58 (0.66) | ratings (speed: scrambles and designed runs) |
| DEF points / yards allowed | −5% / −2% | 0.50 / 0.43 (0.46 / 0.28) | grade |
| DEF defensive TDs | +99% | 0.09 | the engine's return rates (9% of turnovers) against the file's 4.5% |

An all-average game (the engine's own fill-ins) lands inside Cornerstone's acceptance bands, except
points (21.5 against 22 to 23.5). Random six-slot drafts score 22.0 to 22.6 points a team (19.0 with
the fill-in floor alone, 22.7 before it).

`favorite.js`: the better roster (by the engine's own odds) wins 64% of random six-slot drafts, and
31% of matchups have a 70%+ favorite. What the grades changed is who that is: over 300 random drafts,
a team's edge on the auction cards (its players' lead stats against the file) tracks its sim win
chance at a correlation of 0.79 (0.51 before grades, five slots). In the most lopsided tenth of drafts
on paper the card favorite wins 79% (68%).
