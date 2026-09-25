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
  carries and half by overall. The engine's per-game form roll on carries is off in this game
  (`carryFormSd` 0 in `game.ts`; the engine's spread of 1 gave a lead back 4 carries one game and 25
  the next, and a teammate out-carried a far better back in a third of games, now 15%). Carries
  still swing with game script: the side protecting a lead runs more.
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
  An empty DEF slot is a league-average unit playing below the worst real defense the same way, part
  by part, past it by `K.fill.defMargin` (50%) of the spread: 32.6 points allowed to an average
  offense, against the worst real defense's 30.4 (backup-level defenders on top of that allowed 39).
  `opts.fillers: 'engine'` turns all of it off (the baseline check and `ref` use it).
- **Balance: how much the gap counts.** `SIMKIT.K.balance` scales, per slot, both a player's grade
  edges and his ratings' distance from the league-average starter, so his mix of production and
  Madden holds. It is 1 at every slot: each player plays his full real gap from the others. Random
  drafts are then as lopsided as real games (below), and the best player at a slot against the worst,
  everything else equal, wins about QB 87%, DEF 84%, WR 73%, TE 67%, RB 62% (`calibrate.js`). Until
  2026-09-25 it was set lower (QB 0.65, WR 0.43, TE 0.57, DEF 0.55) to hit QB 78%, DEF 72% and 60%
  elsewhere, which made games closer than real ones: a stacked roster won by 12 where it now wins by 19.
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
| `calibrate.js` | Fits `SIMKIT.K.grade` (each player at his grade) and reports the win rates at `K.balance`. |
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
    node calibrate.js 200      (grade slopes near 1, else refit K.grade; then the win rates)
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
every core (about 3 minutes on 4). QBs are worth 7.7 to 23.0 points a game over an empty slot,
defenses 3.1 to 18.9, backs 0.5 to 7.4, receivers 2.1 to 9.8, tight ends 1.7 to 7.0; each is good to
about ±0.25.

It never sees what comes next (lots are drawn when they come up); it judges each player against the
undrawn players who could still fill the slot. Its price: $1 plus dollars-per-point times his value
over the slot's floor, the budget shared only over the slots the other side can still fight for.
Solo offers: Hard works out when to sign by optimal stopping over the offers left (each decline
redraws and adds $1, the fourth is forced). Dump auctions: it waits at $0 on a below-average player,
then pays in $1 steps up to twice (`CPU_DUMP_SHARE`) the swing in sending him over, in dollars: his
shortfall against the pool in its own slot plus in yours; if you dump him on it first, it answers.
Twice, because the side left with the slot open usually fills it later as the only one who can still
use that position (choosing among draws, for a dollar or two), and a dollar buys fewer points than its
rate says: forking 160 dump auctions from real auctions and playing both outcomes out 150 times each
put the true worth near three times the shortfalls. Easy and Normal misjudge values (by a random
factor per player per game), and Easy overpays (and never waits, so it rarely sees a dump auction).

Measured by playing whole auctions in the page and simming the two rosters (1,000 auctions of 100
games each; about ±1.5%): Hard beats a card reader (a human stand-in that ranks players by their
card's lead stat and spends a fair share on the good ones) 69.4%, Normal 52.0%, Easy 40.6%; Hard
beats Normal 65.0%, Normal beats Easy 63.2%. The card reader bids on everyone, so it never reaches a
dump auction. A stand-in that plays dumps like a person (passes on its bottom 40% by the card, then
pays up to $5 to dump them) loses to Hard 73.3% and to Normal 57.2% (Hard 62.5% when the CPU paid
half the shortfalls, as it used to); one that runs every dump up to $15 before letting go loses to
Hard 57.9%. Hard at twice beats Hard at half 67.1%; twice and three times play even. (Before full
strength, with the old values: 66.4% and 55.1% against the dumper, 60.0% and 48.8% at half.)

## Where it stands (2026-09-25, engine 4ffc55b)

`equiv.mts`, with every hook in the build: 2,000 games, 3.79M stat fields and 788,818 play-recorder
events, 0 mismatches for both Cornerstone's `simulateGame` and the game's driver.

`calibrate.js`, at full strength (balance 1) as the game uses a player (the game's fill-ins beside
him): every graded rate lands on its grade, bias within ±2% and slope 0.83 to 1.15 (points allowed,
which follows from the graded yards, 1.26). The QB and DEF refs carry the fill-ins.

`calibrate.js`, as played: the best player at each slot against the worst (by the card's lead
stat), everything else league average, the game's fill-ins, 2,000 games each.

| Slot | Matchup | Wins (at the old balance) |
|---|---|---|
| QB | Stafford vs Dart | 87.5% (77.5%) |
| DEF | Seahawks vs Cowboys | 84.0% (71.9%) |
| RB | Cook vs Spears | 61.7% (61.4%) |
| WR | Nacua vs Jayden Higgins | 73.0% (59.7%) |
| TE | McBride vs Barner | 67.2% (58.3% to 59.8%) |
| FLEX | Nacua / Gibbs / McBride vs an empty FLEX | 76.2% / 63.2% / 77.5% (62.4% / 63.2% / 67.9%) |

Fill-ins against the worst real players (300 games per real player, beside him): fill-in WRs gain
3.4 to 3.8 yards a target (the worst real WR, Ayomanor, 5.35), fill-in backs 3.05 to 3.17 a carry
(Carter 3.51), fill-in TEs 3.6 to 3.9 (Ferguson 6.16). The weakest real pick beats an empty slot
(6,000 games, the rest of the team the same): Ayomanor 57.7%, Jayden Higgins 61.5%, Carter 52.7%,
Spears 56.6%, Theo Johnson 57.9%, Ferguson 57.5%, Mariota 74.6%, the Cowboys defense 56.9%.

`check.js` puts each real player on an otherwise league-average team and compares 200 games with his
real 2025 per-game line. Bias is the average miss. Slope is how much of the gap between players
comes through (1 = all of it); at full strength most of it does (QB passing yards 0.86 and points
allowed 0.91, from 0.62 and 0.52 at the old balance). Real players run about 30% above their 2025
volume (backs' carries 44%: the backups' touches), so their per-game lines do too; their rates stay
on their lines.

| Stat | Bias | Slope | Driven by |
|---|---|---|---|
| WR targets / RB carries / TE targets | +34% / +44% / +30% | 1.14 / 0.80 / 1.15 | real usage plus the backups' |
| WR receptions / yards | +33% / +35% | 1.25 / 1.45 | usage plus grade |
| TE receptions / yards | +32% / +34% | 1.32 / 1.82 | usage plus grade |
| RB rushing yards / receiving yards | +45% / +38% | 1.00 / 1.23 | usage plus grade |
| RB yards per carry, WR / TE yards per catch | +1% / 0% / 0% | 0.71 / 0.72 / 0.61 | grade |
| QB passing yards / TDs / completion % | +1% / −26% / +1% | 0.86 / 0.80 / 0.77 | grade |
| QB INTs | 0% | 0.83 | grade |
| QB rushing yards | −1% | 0.68 | ratings (speed: scrambles and designed runs) |
| DEF points / yards allowed | −1% / +1% | 0.91 / 0.87 | grade |
| DEF defensive TDs | +97% | 0.14 | the engine's return rates (9% of turnovers) against the file's 4.5% |

An all-average game (the engine's own fill-ins) lands inside Cornerstone's acceptance bands, except
points (21.5 against 22 to 23.5). Random six-slot drafts against every 2025 regular-season game
(nflverse's team stats), 6,000 games:

| | NFL 2025 | Sim |
|---|---|---|
| Points a team | 23.0 (sd 9.9) | 23.6 (sd 10.8) |
| Yards a team / turnovers | 357 / 1.16 | 349 / 1.06 |
| Average winning margin | 11.2 | 12.0 |
| Within one score (8) / by 17+ / by 24+ | 53% / 28% / 14% | 46% / 28% / 13% |
| Points of margin per 100 yards of margin / per turnover | 6.0 / −4.5 | 8.1 / −3.7 |

`favorite.js`: the better roster (by the engine's own odds) wins 71% of random six-slot drafts (64% at
the old balance), and 53% of matchups have a 70%+ favorite (31%), 28% an 80%+ one. Over 300 random
drafts, a team's edge on the auction cards (its players' lead stats against the file) tracks its sim
win chance at a correlation of 0.77; in the most lopsided tenth of drafts on paper the card favorite
wins 87% (79% at the old balance).
