# engine-tools

The game (`../index.html`) contains a JavaScript port of the Cornerstone engine
(`D:\NFL game test\src\core`) plus SIMKIT, which turns our real player stats into engine inputs.
These scripts keep that port honest and re-tune it. None of them are needed to play.

| File | What it is |
|---|---|
| `engine.src.js` | Engine port source. `/*@@TUNING@@*/` is replaced by `tuning.json` to make `engine.js`. |
| `adapter.js` | SIMKIT. The `K` block holds the calibrated values. |
| `extractTuning.ts` | Copies the engine's constants verbatim from Cornerstone's `tuning.ts`. |
| `equiv.ts` | Gate: the port with no options must match Cornerstone's `simulateGame` exactly. |
| `calib.js` + `show.js` | Each real player on a league-average team; sim vs real per-game lines. |
| `fairness.js`, `favorite.js` | How often the better roster wins. |
| `embed-players.js` | Copies the player file into `index.html` so the page runs opened straight from disk. Rerun after changing the player file: `node engine-tools/embed-players.js` (from the game folder). |

## Commands (run from this folder unless noted)

Re-sync constants and rebuild after Cornerstone's engine changes:

    cd "D:/NFL game test" && npx tsx "<this folder>/extractTuning.ts" "<this folder>/tuning.json"
    node -e "const f=require('fs');f.writeFileSync('engine.js',f.readFileSync('engine.src.js','utf8').replace('/*@@TUNING@@*/null',f.readFileSync('tuning.json','utf8')))"
    cd "D:/NFL game test" && npx tsx "<this folder>/equiv.ts" "<this folder>/engine.js" 2000

The last line must print `games with any mismatch 0`. If the engine's code (not just constants)
changed, port the change into `engine.src.js` first.

Calibrate against the player file (about 10 seconds):

    node calib.js 200 > r.json && node show.js r.json

Then paste `engine.js` and `adapter.js` into `index.html`, replacing the ENGINE and SIMKIT
blocks, without their last `module.exports` line.

## Calibration at hand-off (2026-09-18, 2025 data, 200 games per player)

Bias = simulated average vs real per-game average, for each player on an otherwise average team.
QB pass yds +7%, pass TD -4%, INT +2%, cmp% +1.5%, rush yds +7%.
RB rush yds +0.5%, ypc +4%, TD +3%, rec -4%. WR targets -0.1%, rec +1.5%, yds -0.2%, ypr -2%,
TD +4%. DEF pts allowed -4.5%, yds allowed -3%, sacks -3%, takeaways +2%.
Team: 21.8 pts, 61 plays, 33.6 pass att per team-game (Cornerstone targets 22.8 / 62.7 / 33.8).
