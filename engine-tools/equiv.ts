// Equivalence gate: the JS port (no options) must reproduce Cornerstone's simulateGame exactly.
import { createRequire } from 'node:module'
import { mulberry32 } from 'file:///D:/NFL%20game%20test/src/core/rng.ts'
import { generateLeague } from 'file:///D:/NFL%20game%20test/src/core/generate.ts'
import { simulateGame } from 'file:///D:/NFL%20game%20test/src/core/gameEngine.ts'
import { TEAMS } from 'file:///D:/NFL%20game%20test/src/data/teams.ts'

const require = createRequire(import.meta.url)
const ENGINE = require(process.argv[2]!)

const GAMES = Number(process.argv[3] ?? 2000)
const league = generateLeague(TEAMS, mulberry32(20260918))
const wrng = mulberry32(99)
let mismatches = 0, games = 0, overtime = 0, fieldsCompared = 0
const firstDiffs: string[] = []

for (let g = 0; g < GAMES; g++) {
  const home = league.teams[g % 32]!, away = league.teams[(g * 7 + 3) % 32]!
  if (home.id === away.id) continue
  const indoor = wrng.chance(0.3)
  const weather = indoor
    ? { tempF: 70, windMph: 0, precip: 'none' as const, indoor: true }
    : { tempF: wrng.int(5, 95), windMph: wrng.int(0, 25), precip: (wrng.chance(0.15) ? 'rain' : wrng.chance(0.1) ? 'snow' : 'none') as 'rain' | 'snow' | 'none', indoor: false }
  const seed = 1000 + g
  const a = simulateGame(home, away, league.players, { id: `g${g}`, week: 1 } as any, weather, mulberry32(seed))
  const rt = ENGINE.simulateGame(home, away, league.players, weather, ENGINE.mulberry32(seed))
  games++
  if (a.overtime) overtime++
  const diffs: string[] = []
  const cmp = (label: string, x: unknown, y: unknown) => { fieldsCompared++; if (x !== y) diffs.push(`${label}: ts=${x} js=${y}`) }
  cmp('homeScore', a.homeScore, rt.context.homeScore)
  cmp('awayScore', a.awayScore, rt.context.awayScore)
  for (const side of ['home', 'away'] as const) {
    const ts = side === 'home' ? a.homeStats : a.awayStats, js = rt.stats[side]
    for (const k of Object.keys(ts)) cmp(`${side}.${k}`, (ts as any)[k], js[k])
  }
  const jsLines = rt.stats.players as Map<number, any>
  cmp('playerLineCount', a.playerStats.length, jsLines.size)
  for (const line of a.playerStats) {
    const j = jsLines.get(line.playerId)
    for (const k of Object.keys(line)) if (k !== 'playerId' && typeof (line as any)[k] === 'number') cmp(`p${line.playerId}.${k}`, (line as any)[k], j ? j[k] : undefined)
  }
  if (diffs.length) { mismatches++; if (firstDiffs.length < 6) firstDiffs.push(`game ${g}: ${diffs.slice(0, 4).join(' | ')}`) }
}
console.log(`games ${games}, overtime ${overtime}, fields compared ${fieldsCompared}, games with any mismatch ${mismatches}`)
for (const d of firstDiffs) console.log('  ' + d)
process.exit(mismatches ? 1 : 0)
