# engine-tools

The game (`../index.html`) runs the **Cornerstone** engine (`D:\NFL game test\src\core`) compiled from
its own TypeScript, with the real players rated from **Madden NFL 26** and graded mostly on their
**2025 production**. None of these tools are needed to play; they rebuild and check what goes into
the page.

## How the game uses the engine

- **Every play is Cornerstone's engine.** `cornerstone/` is a verbatim snapshot of the engine files
  (`SOURCE.txt` names the commit). `build.mjs` compiles it with esbuild, applying `patches.mjs`, and
  keeps only the `TUNING` sections the engine reads.
- **With the hooks off, the patches don't change how a play or game is simulated.** They export
  three functions so `game.ts` can play a quarter at a time. They add two usage hooks where the
  engine picks who gets the ball, and four grade hooks where a play turns out (see below). `equiv.ts`
  proves the compiled engine, hooks off, matches Cornerstone's own `simulateGame` exactly: every
  score, stat line and play-recorder event. The game always plays with the hooks on.
- **Players are rated.** `ratings.ts` turns Madden 26 (Week 18: the end of the 2025
  regular season, the same season as the player file) into engine ratings by percentile. A player's
  rank at his position in Madden becomes the same rank among Cornerstone's generated players, so the
  league keeps the engine's own rating distribution. A DEF pick is that team's real defense: its best
  4 edge rushers, 4 interior linemen, 4 linebackers, 5 corners and 4 safeties. Everyone else is
  filler: the engine's league-average player at that depth slot.
- **Usage: who gets the ball.** Your engine picks targets and back carries by depth slot and ratings,
  and can't know a player's team role. With `opts.usage`, those two picks weigh each player by his
  real 2025 volume (targets a game, carries a game). His route and run fitness, from his ratings,
  still decide which routes and which runs. Quarterback runs and receiver carries stay the engine's.
  An RB in FLEX next to the RB: the two re-split the carries they have together, half by real
  carries and half by overall.
- **Grades: how well.** The engine's ratings barely separate skill players (a back 15 points better
  gained about 0.45 yards a carry), so a star RB, WR or FLEX hardly changed who won. `grades.mjs`
  grades every real player and defense, 70% on his 2025 production and 30% on his Madden rating
  (read off production's own spread by rank): a back's yards per carry and per catch, a receiver's
  catch rate and yards per catch, a quarterback's completion rate, yards and interceptions a game
  (the file has no attempts), a defense's yards allowed and takeaways. Four hooks apply them on
  every play the player is in: yards on a run, the completion and interception chances of a throw,
  yards on a catch. The gains in `SIMKIT.K.grade` are fitted (`calibrate.js`) so that, at full
  strength, a player on an otherwise average team plays at his grade. Filler has no grade, so an
  all-filler game is still the engine's own.
- **Balance: how much the gap counts.** `SIMKIT.K.balance` scales, per slot, both a player's grade
  edges and his ratings' distance from the league-average starter, so his mix of production and
  Madden holds. It is chosen by win rates: the best player at a slot against the worst, everything
  else equal, wins about QB 78%, DEF 72%, RB 60%, WR 60% (`calibrate.js`).
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
| `ratings.ts` | Madden to engine ratings (`ratings.json`). |
| `build.mjs` | Builds `engine.js` (ENGINE) and `simkit.js` (SIMKIT, with the ratings and grades). |
| `embed-engine.js`, `embed-players.js` | Put the engine, or the player file, into `index.html`. |
| `equiv.ts` | Gate: the compiled engine equals Cornerstone's `simulateGame`. |
| `check.js`, `favorite.js` | Sim against real 2025 lines; how often the better roster wins. |
| `calibrate.js` | Fits `SIMKIT.K.grade` (each player at his grade) and reports the win rates `K.balance` is set by. |

## Commands

`build.mjs` takes esbuild from the Cornerstone repo. Elsewhere, point `ESBUILD_FROM` at any
`package.json` whose folder has esbuild installed (0.25 builds the same bytes).

Rebuild after the engine changes (from this folder unless noted):

    cd "D:/NFL game test"
    git show HEAD:src/core/<file>.ts > "<this folder>/cornerstone/<file>.ts"   (for each file in cornerstone/; update SOURCE.txt)
    node build.mjs
    cd "D:/NFL game test" && npx tsx "<this folder>/equiv.ts" "<this folder>/engine.js" 2000   (must print 0 mismatches twice)
    node check.js 200
    node calibrate.js 200      (grade slopes near 1; win rates on target, else refit K.grade / K.balance)
    node embed-engine.js

If a patch no longer matches, the build names it. Port that edit by hand, then run `equiv.ts`.
`calibrate.js` tries values without a rebuild: `GRADE='{"run":0.8}' BALANCE='{"QB":0.6}' node calibrate.js`.

New ratings, or a new player file:

    node madden-fetch.js [iteration, default 19-week-18]
    cd "D:/NFL game test" && npx tsx "<this folder>/ratings.ts"
    node build.mjs && node calibrate.js 200 && node embed-engine.js   (the grades come from both files)
    node embed-players.js   (after changing the player file)

## Where it stands (2026-09-24, engine 4ffc55b)

`equiv.ts`: 2,000 games, 3.79M stat fields and 788,818 play-recorder events, 0 mismatches (run
before the grade hooks were added). The build with them, hooks off, matches that build exactly on the
same rosters: 600 games through Cornerstone's `simulateGame` and the game's driver, 116,404
play-recorder events, 0 mismatches. Rerun `equiv.ts` on the next engine update.

`calibrate.js`, at full strength (balance 1): every graded rate lands on its grade, bias within
±2% and slope 0.89 to 1.10 (points allowed, which follows from the graded yards, 1.20).

`calibrate.js`, as played: the best player at each slot against the worst (by the card's lead
stat), everything else league average, 10,000 games each.

| Slot | Matchup | Wins (before grades) |
|---|---|---|
| QB | Stafford vs Dart | 77.9% (72.1%) |
| DEF | Seahawks vs Cowboys | 72.0% (69.4%) |
| RB | Cook vs Spears | 60.3% (52.1%) |
| WR | Nacua vs Higgins | 60.5% (53.5%) |
| FLEX | Nacua / Gibbs vs an empty FLEX | 59.6% / 57.2% (51.8% / 52.5%) |

`check.js` puts each real player on an otherwise league-average team and compares 200 games with his
real 2025 per-game line. Bias is the average miss. Slope is how much of the gap between players
comes through (1 = all of it); QB and DEF sit near half by the balance, RB and WR near all.

| Stat | Bias | Slope (before grades) | Driven by |
|---|---|---|---|
| WR targets / RB carries | −0.2% / −0.5% | 0.95 / 1.10 (0.96 / 1.01) | real usage |
| WR receptions / yards | −2% / −3% | 0.91 / 0.91 (0.80 / 0.68) | usage plus grade |
| RB rushing yards / receiving yards | +1% / +2% | 1.18 / 1.08 (0.85 / –) | usage plus grade |
| RB yards per carry, WR yards per catch | −0.4% / −2% | 0.79 / 0.52 (0.13 / 0.05) | grade |
| QB passing yards / TDs / completion % | +3% / −24% / −2% | 0.55 / 0.57 / 0.50 (0.33 / 0.45 / 0.27) | grade (TDs follow) |
| QB INTs | +1% | 0.47 (0.00) | grade |
| QB rushing yards | +2% | 0.55 (0.66) | ratings (speed: scrambles and designed runs) |
| DEF points / yards allowed | −4% / −1% | 0.49 / 0.49 (0.46 / 0.28) | grade |
| DEF defensive TDs | +91% | 0.06 | the engine's return rates (9% of turnovers) against the file's 4.5% |

An all-average game lands inside Cornerstone's acceptance bands, except points (21.5 against 22 to 23.5).

`favorite.js`: the better roster (by the engine's own odds) wins 63% of random drafts, and 28% of
matchups have a 70%+ favorite. What changed is who that is: over 300 random drafts, a team's edge on
the auction cards (its players' lead stats against the file) now tracks its sim win chance at a
correlation of 0.77 (0.51 before). In the most lopsided quarter of drafts on paper the card favorite
wins 72% (65%), and the sim favors the card underdog in 1% of them (13%).
