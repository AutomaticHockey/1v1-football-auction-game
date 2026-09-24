# engine-tools

The game (`../index.html`) runs the **Cornerstone** engine (`D:\NFL game test\src\core`) compiled from
its own TypeScript, with the real players rated from **Madden NFL 26**. None of these tools are
needed to play; they rebuild and check what goes into the page.

## How the game uses the engine

- **Every play is Cornerstone's engine.** `cornerstone/` is a verbatim snapshot of the engine files
  (`SOURCE.txt` names the commit). `build.mjs` compiles it with esbuild, applying `patches.mjs`, and
  keeps only the `TUNING` sections the engine reads.
- **The patches don't change how a play or game is simulated.** They export three functions so
  `game.ts` can play a quarter at a time. They also add two usage hooks at the points where the
  engine picks who gets the ball (see below). `equiv.ts` proves the compiled engine, hooks off,
  matches Cornerstone's own `simulateGame` exactly: every score, stat line and play-recorder event.
- **Players are rated, not adjusted.** `ratings.ts` turns Madden 26 (Week 18: the end of the 2025
  regular season, the same season as the player file) into engine ratings by percentile. A player's
  rank at his position in Madden becomes the same rank among Cornerstone's generated players, so the
  league keeps the engine's own rating distribution. A DEF pick is that team's real defense: its best
  4 edge rushers, 4 interior linemen, 4 linebackers, 5 corners and 4 safeties. Everyone else is
  filler: the engine's league-average player at that depth slot.
- **Usage: who gets the ball.** Your engine picks targets and back carries by depth slot and ratings,
  and can't know a player's team role. With `opts.usage`, those two picks weigh each player by his
  real 2025 volume (targets a game, carries a game). His route and run fitness, from his ratings,
  still decide which routes and which runs. Quarterback runs, receiver carries and everything about
  how a play turns out stay the engine's.
- **This game's rules** (`game.ts`, `opts.neutral`): no crowd, a mild 5 mph day (the league's average
  weather cost), no pace draw. Also quarter-by-quarter play, up to three overtime periods under the
  engine's own rules, and a drive log read off the engine's play recorder.

| File | What it is |
|---|---|
| `cornerstone/` | Verbatim snapshot of the engine's source (never edited; `SOURCE.txt` has the commit). |
| `patches.mjs` | The game's edits, applied at build time. Each must match exactly once, or the build stops. |
| `hooks.ts`, `stubs/` | The usage hook switch; a stand-in for `generate.ts` (one function the depth chart needs). |
| `game.ts` | The game's driver: quarters, overtime, neutral field, usage hooks, drive log. |
| `simkit.src.js` | SIMKIT: builds each side's roster from the ratings, with real usage and filler. |
| `madden-fetch.js` | Downloads Madden 26 ratings from EA's public ratings feed into `madden26-week-18.json`. |
| `ratings.ts` | Madden to engine ratings (`ratings.json`). |
| `build.mjs` | Builds `engine.js` (ENGINE) and `simkit.js` (SIMKIT). |
| `embed-engine.js`, `embed-players.js` | Put the engine, or the player file, into `index.html`. |
| `equiv.ts` | Gate: the compiled engine equals Cornerstone's `simulateGame`. |
| `check.js`, `favorite.js` | Sim against real 2025 lines; how often the better roster wins. |

## Commands

Rebuild after the engine changes (from this folder unless noted):

    cd "D:/NFL game test"
    git show HEAD:src/core/<file>.ts > "<this folder>/cornerstone/<file>.ts"   (for each file in cornerstone/; update SOURCE.txt)
    node build.mjs
    cd "D:/NFL game test" && npx tsx "<this folder>/equiv.ts" "<this folder>/engine.js" 2000   (must print 0 mismatches twice)
    node check.js 200
    node embed-engine.js

If a patch no longer matches, the build names it. Port that edit by hand, then run `equiv.ts`.

New ratings, or a new player file:

    node madden-fetch.js [iteration, default 19-week-18]
    cd "D:/NFL game test" && npx tsx "<this folder>/ratings.ts"
    node build.mjs && node embed-engine.js
    node embed-players.js   (after changing the player file)

## Where it stands (2026-09-24, engine 4ffc55b)

`equiv.ts`: 2,000 games, 3.79M stat fields and 788,818 play-recorder events, 0 mismatches.

`check.js` puts each real player on an otherwise league-average team and compares 200 games with his
real 2025 per-game line. Bias is the average miss. Slope is how much of the gap between players
comes through (1 = all of it).

| Stat | Bias | Slope | Driven by |
|---|---|---|---|
| WR targets / RB carries | −0.1% / −0.8% | 0.96 / 1.01 | real usage |
| WR receptions / yards | −2% / −6% | 0.80 / 0.68 | usage plus ratings |
| RB rushing yards / receptions | −2% / −3% | 0.85 / 0.89 | usage plus ratings |
| RB yards per carry, WR yards per catch | −1% / −5% | 0.13 / 0.05 | ratings |
| QB passing yards / TDs / completion % | +9% / −15% / −4% | 0.33 / 0.45 / 0.27 | ratings |
| QB INTs | +23% | 0.00 | ratings (Madden has no INT tendency) |
| QB rushing yards | +1% | 0.66 | ratings (speed: scrambles and designed runs) |
| DEF points / yards allowed | −9% / −4% | 0.46 / 0.28 | ratings of the team's 21 defenders |
| DEF defensive TDs | +132% | 0 | the engine's return rates (9% of turnovers) against the file's 4.5% |

An all-average game lands inside Cornerstone's acceptance bands, except points (21.5 against 22 to 23.5).

`favorite.js`: the better roster (by the engine's own odds) wins 64% of random drafts, and 27% of
matchups have a 70%+ favorite.
