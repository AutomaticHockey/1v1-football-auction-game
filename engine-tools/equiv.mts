// Equivalence gate. With no options, engine.js must be Cornerstone's engine exactly:
//  A. its compiled simulateGame (patched, hooks off) against the repo's own simulateGame;
//  B. this game's driver (createGame + playQuarter + playOvertimePeriod) against the same.
// Compares scores, both teams' stats, every player's line, and every play-recorder event.
// Run from the Cornerstone repo so its imports resolve:
//   cd "D:/NFL game test" && npx tsx "<this folder>/equiv.mts" "<this folder>/engine.js" 2000
// (Cornerstone elsewhere: set CORNERSTONE to its folder.)
import { createRequire } from 'node:module'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
// The Cornerstone repo: $CORNERSTONE, else D:/NFL game test.
const core = (file: string) => import(pathToFileURL(path.join(process.env.CORNERSTONE ?? 'D:/NFL game test', 'src', file)).href)
const { mulberry32 } = await core('core/rng.ts')
const { generateLeague } = await core('core/generate.ts')
const { simulateGame } = await core('core/gameEngine.ts')
const { TEAMS } = await core('data/teams.ts')

const require = createRequire(import.meta.url)
const ENGINE = require(process.argv[2]!)
const GAMES = Number(process.argv[3] ?? 2000)

const leagues = [generateLeague(TEAMS, mulberry32(20260924).fork('league')), generateLeague(TEAMS, mulberry32(1111).fork('league'))]
const wrng = mulberry32(99)
const tally = { A: { games: 0, bad: 0 }, B: { games: 0, bad: 0 } }
let overtime = 0, events = 0, fields = 0
const firstDiffs: string[] = []

type Rec = { list: string[]; record(e: unknown): void }
const recorder = (): Rec => { const list: string[] = []; return { list, record: (e) => { list.push(JSON.stringify(e)) } } }

function compare(label: 'A' | 'B', g: number, ts: any, js: { home: number; away: number; homeStats: any; awayStats: any; players: Map<number, any> }, tsEvents: string[], jsEvents: string[]) {
  const diffs: string[] = []
  const cmp = (what: string, x: unknown, y: unknown) => { fields++; if (x !== y) diffs.push(`${what}: ts=${x} js=${y}`) }
  cmp('homeScore', ts.homeScore, js.home)
  cmp('awayScore', ts.awayScore, js.away)
  for (const side of ['home', 'away'] as const) {
    const a = side === 'home' ? ts.homeStats : ts.awayStats, b = side === 'home' ? js.homeStats : js.awayStats
    for (const k of Object.keys(a)) cmp(`${side}.${k}`, a[k], b[k])
  }
  cmp('playerLines', ts.playerStats.length, js.players.size)
  for (const line of ts.playerStats) {
    const j = js.players.get(line.playerId)
    for (const k of Object.keys(line)) cmp(`p${line.playerId}.${k}`, line[k], j ? j[k] : undefined)
  }
  cmp('events', tsEvents.length, jsEvents.length)
  for (let i = 0; i < Math.min(tsEvents.length, jsEvents.length); i++) { events++; if (tsEvents[i] !== jsEvents[i]) { diffs.push(`event ${i}: ${tsEvents[i]!.slice(0, 160)} | ${jsEvents[i]!.slice(0, 160)}`); break } }
  tally[label].games++
  if (diffs.length) { tally[label].bad++; if (firstDiffs.length < 8) firstDiffs.push(`${label} game ${g}: ${diffs.slice(0, 3).join(' | ')}`) }
}

for (let g = 0; g < GAMES; g++) {
  const league = leagues[g % 2]!
  const home = league.teams[g % 32]!, away = league.teams[(g * 7 + 3) % 32]!
  if (home.id === away.id) continue
  const indoor = wrng.chance(0.3)
  const weather = indoor
    ? { tempF: 70, windMph: 0, precip: 'none' as const, indoor: true }
    : { tempF: wrng.int(5, 95), windMph: wrng.int(0, 25), precip: (wrng.chance(0.15) ? 'rain' : wrng.chance(0.1) ? 'snow' : 'none') as 'rain' | 'snow' | 'none', indoor: false }
  const seed = 1000 + g
  const schedule = { id: `g${g}`, week: 1 } as any

  const tsRec = recorder()
  const ts = simulateGame(home, away, league.players, schedule, weather, mulberry32(seed), tsRec)
  if (ts.overtime) overtime++

  // A. the compiled simulateGame
  const aRec = recorder()
  const a = ENGINE.cornerstoneSimulateGame(home, away, league.players, schedule, weather, ENGINE.mulberry32(seed), aRec)
  compare('A', g, ts, { home: a.homeScore, away: a.awayScore, homeStats: a.homeStats, awayStats: a.awayStats, players: new Map(a.playerStats.map((l: any) => [l.playerId, l])) }, tsRec.list, aRec.list)

  // B. this game's driver: quarters, then one overtime period if tied (Cornerstone plays one)
  const bRec = recorder()
  const rt = ENGINE.createGame(home, away, league.players, ENGINE.mulberry32(seed), { weather, recorder: bRec, scheduleGame: schedule })
  while (ENGINE.playQuarter(rt)) { /* next */ }
  if (rt.context.homeScore === rt.context.awayScore) ENGINE.playOvertimePeriod(rt)
  bRec.record({ kind: 'gameEnd', homeScore: rt.context.homeScore, awayScore: rt.context.awayScore, overtime: rt.overtime })
  compare('B', g, ts, { home: rt.context.homeScore, away: rt.context.awayScore, homeStats: rt.stats.home, awayStats: rt.stats.away, players: rt.stats.players }, tsRec.list, bRec.list)
}
console.log(`games ${tally.A.games}, overtime ${overtime}, fields ${fields}, events ${events}`)
console.log(`A compiled simulateGame: games with any mismatch ${tally.A.bad}`)
console.log(`B game driver:           games with any mismatch ${tally.B.bad}`)
for (const d of firstDiffs) console.log('  ' + d)
process.exit(tally.A.bad || tally.B.bad ? 1 : 0)
