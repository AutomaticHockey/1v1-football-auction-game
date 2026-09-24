// Engine ratings for the game, from Madden NFL 26 (Week 18: the end of the 2025 regular season,
// the season of the player file) placed on Cornerstone's own scale.
//
// How a Madden attribute becomes a Cornerstone rating, with nothing hand-tuned: take the player's
// rank (percentile) among the NFL's rostered players at his position in Madden, and give him the
// rating at that same percentile among Cornerstone's generated players at that position. So the
// engine's league keeps exactly its own distribution of ratings (and so its own league-average
// play), while who is better at what comes from Madden. Ratings Madden has no attribute for
// (consistency, aggression) use his Madden overall's percentile, as Cornerstone's generator ties
// them to a player's level.
//
// Writes ratings.json: every auctioned player's ratings (keyed by the player file's id), every
// team's 21 defenders, and the filler (the league-average player at each depth slot).
// Run from the Cornerstone repo so its imports resolve:
//   cd "D:/NFL game test" && npx tsx "<this folder>/ratings.ts"
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mulberry32 } from 'file:///D:/NFL%20game%20test/src/core/rng.ts'
import { generateLeague, deriveOverall } from 'file:///D:/NFL%20game%20test/src/core/generate.ts'
import { buildDepthChart } from 'file:///D:/NFL%20game%20test/src/core/depthChart.ts'
import { TUNING } from 'file:///D:/NFL%20game%20test/src/core/tuning.ts'
import { TEAMS } from 'file:///D:/NFL%20game%20test/src/data/teams.ts'

const here = path.dirname(fileURLToPath(import.meta.url))
const MADDEN_FILE = process.argv[2] ?? path.join(here, 'madden26-week-18.json')
const PLAYER_FILE = process.argv[3] ?? path.join(here, '..', 'nfl_auction_players.json')
type Any = any

/* ---------- Cornerstone's generated leagues ---------- */
const SEEDS = [1111, 2222, 3333, 4444, 5555, 6666, 7777, 8888, 1212, 2323, 3434, 4545, 5656, 6767, 7878, 8989]
const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'LT', 'LG', 'C', 'RG', 'RT', 'EDGE', 'DT', 'LB', 'CB', 'S', 'K', 'P'] as const
type Pos = (typeof POSITIONS)[number]
const FILL_SLOTS: Record<string, number> = { QB: 2, RB: 4, WR: 5, TE: 3, LT: 1, LG: 1, C: 1, RG: 1, RT: 1, EDGE: 4, DT: 4, LB: 4, CB: 5, S: 4, K: 1, P: 1 }
const RATING_KEYS = [
  'speed', 'agility', 'strength', 'stamina', 'throwPower', 'throwAccuracy', 'throwOnRun', 'carrying', 'breakTackle', 'vision',
  'catching', 'routeRunning', 'catchInTraffic', 'runBlock', 'passBlock', 'passRush', 'runDefense', 'blockShedding',
  'manCoverage', 'zoneCoverage', 'tackling', 'hitPower', 'kickPower', 'kickAccuracy', 'awareness', 'playRecognition', 'poise',
  'consistency', 'aggression', 'injuryProne', 'processing', 'separation', 'durability',
] as const

const csPop: Record<string, Record<string, number[]>> = {}      // position -> rating -> every generated player's value
const csOverall: Record<string, number[]> = {}
const slotSums = new Map<string, { n: number; overall: number; ratings: Record<string, number> }>()
for (const seed of SEEDS) {
  const league = generateLeague(TEAMS, mulberry32(seed).fork('league'))
  for (const team of league.teams) {
    const chart = buildDepthChart(team, league.players)
    for (const pos of POSITIONS) {
      const list = chart.byPosition.get(pos as never) ?? []
      list.forEach((player, slot) => {
        const byRating = (csPop[pos] ??= {})
        for (const k of RATING_KEYS) (byRating[k] ??= []).push(player.ratings[k])
        ;(csOverall[pos] ??= []).push(player.overall)
        if (slot < FILL_SLOTS[pos]!) {
          const key = `${pos}${slot}`
          const acc = slotSums.get(key) ?? { n: 0, overall: 0, ratings: {} }
          acc.n += 1
          acc.overall += player.overall
          for (const k of RATING_KEYS) acc.ratings[k] = (acc.ratings[k] ?? 0) + player.ratings[k]
          slotSums.set(key, acc)
        }
      })
    }
  }
}
for (const pos of Object.keys(csPop)) {
  for (const k of RATING_KEYS) csPop[pos]![k]!.sort((a, b) => a - b)
  csOverall[pos]!.sort((a, b) => a - b)
}
const quantile = (sorted: number[], u: number): number => {
  const x = Math.min(Math.max(u, 0), 1) * (sorted.length - 1), i = Math.floor(x), t = x - i
  return i + 1 < sorted.length ? sorted[i]! + t * (sorted[i + 1]! - sorted[i]!) : sorted[i]!
}

/* ---------- Madden ---------- */
const madden: Any[] = JSON.parse(readFileSync(MADDEN_FILE, 'utf8')).players
const file: Any = JSON.parse(readFileSync(PLAYER_FILE, 'utf8'))
const GROUP: Record<string, Pos> = {
  QB: 'QB', HB: 'RB', FB: 'RB', WR: 'WR', TE: 'TE', LT: 'LT', LG: 'LG', C: 'C', RG: 'RG', RT: 'RT',
  LEDG: 'EDGE', REDG: 'EDGE', DT: 'DT', SAM: 'LB', MIKE: 'LB', WILL: 'LB', CB: 'CB', FS: 'S', SS: 'S', K: 'K', P: 'P',
}
const mean = (...v: number[]) => v.reduce((a, b) => a + b, 0) / v.length
// Each Cornerstone rating's Madden source. null: from the player's Madden overall (see the header).
const SOURCE: Record<string, ((s: Any) => number) | null> = {
  speed: (s) => s.speed, agility: (s) => s.agility, strength: (s) => s.strength, stamina: (s) => s.stamina,
  throwPower: (s) => s.throwPower, throwAccuracy: (s) => mean(s.throwAccuracyShort, s.throwAccuracyMid, s.throwAccuracyDeep),
  throwOnRun: (s) => s.throwOnTheRun, carrying: (s) => s.carrying, breakTackle: (s) => s.breakTackle, vision: (s) => s.bCVision,
  catching: (s) => s.catching, routeRunning: (s) => mean(s.shortRouteRunning, s.mediumRouteRunning, s.deepRouteRunning),
  catchInTraffic: (s) => s.catchInTraffic, runBlock: (s) => s.runBlock, passBlock: (s) => s.passBlock,
  passRush: (s) => Math.max(s.powerMoves, s.finesseMoves), runDefense: (s) => mean(s.blockShedding, s.pursuit, s.tackle),
  blockShedding: (s) => s.blockShedding, manCoverage: (s) => s.manCoverage, zoneCoverage: (s) => s.zoneCoverage,
  tackling: (s) => s.tackle, hitPower: (s) => s.hitPower, kickPower: (s) => s.kickPower, kickAccuracy: (s) => s.kickAccuracy,
  awareness: (s) => s.awareness, playRecognition: (s) => s.playRecognition, poise: (s) => s.throwUnderPressure,
  consistency: null, aggression: null, injuryProne: (s) => 100 - s.injury, processing: (s) => s.awareness,
  separation: (s) => mean(s.release, s.changeOfDirection), durability: (s) => s.toughness,
}

// Madden's rostered players at each position: each team's best N by overall, N = Cornerstone's roster.
const composition = TUNING.roster.composition as Record<string, number>
const byTeamPos = new Map<string, Any[]>()
for (const m of madden) {
  const pos = GROUP[m.pos]
  if (!pos) continue
  const key = `${m.team}:${pos}`
  if (!byTeamPos.has(key)) byTeamPos.set(key, [])
  byTeamPos.get(key)!.push(m)
}
for (const list of byTeamPos.values()) list.sort((a, b) => b.ovr - a.ovr || a.id - b.id)
const mPop: Record<string, Record<string, number[]>> = {}
const mOverall: Record<string, number[]> = {}
for (const [key, list] of byTeamPos) {
  const pos = key.split(':')[1]!
  for (const m of list.slice(0, composition[pos] ?? 0)) {
    for (const k of RATING_KEYS) { const f = SOURCE[k]; if (f) ((mPop[pos] ??= {})[k] ??= []).push(f(m.stats)) }
    ;(mOverall[pos] ??= []).push(m.ovr)
  }
}
const percentile = (values: number[], v: number): number => {
  let below = 0, equal = 0
  for (const x of values) { if (x < v) below++; else if (x === v) equal++ }
  return (below + 0.5 * equal) / values.length
}
const clampRating = (v: number) => Math.round(Math.min(TUNING.roster.maximumRating, Math.max(TUNING.roster.minimumRating, v)))

function engineRatings(m: Any, pos: Pos): { ratings: Record<string, number>; overall: number } {
  const ratings: Record<string, number> = {}
  const level = percentile(mOverall[pos]!, m.ovr)
  for (const k of RATING_KEYS) {
    const f = SOURCE[k]
    const u = f ? percentile(mPop[pos]![k]!, f(m.stats)) : level
    ratings[k] = clampRating(quantile(csPop[pos]![k]!, u))
  }
  return { ratings, overall: deriveOverall(pos as never, ratings as never) }
}

/* ---------- teams and players ---------- */
const norm = (s: string) => s.toLowerCase().replace(/\b(jr|sr|ii|iii|iv|v)\b\.?/g, '').replace(/[^a-z]/g, '')
const FILE_GROUP: Record<string, Pos> = { QB: 'QB', RB: 'RB', WR: 'WR', TE: 'TE' }
const byName = new Map<string, Any[]>()
for (const m of madden) { const k = norm(`${m.first} ${m.last}`); if (!byName.has(k)) byName.set(k, []); byName.get(k)!.push(m) }
// EA team id -> abbreviation: the team most of the file's players on it play for.
const votes: Record<string, Record<string, number>> = {}
for (const f of file.players) {
  if (!FILE_GROUP[f.pos]) continue
  const c = (byName.get(norm(f.name)) ?? []).filter((m) => GROUP[m.pos] === FILE_GROUP[f.pos])
  if (c.length === 1) { const v = (votes[c[0].team] ??= {}); v[f.team] = (v[f.team] ?? 0) + 1 }
}
const teamAbbr: Record<string, string> = {}
for (const [id, v] of Object.entries(votes)) teamAbbr[id] = Object.entries(v).sort((a, b) => b[1] - a[1])[0]![0]
const abbrs = Object.values(teamAbbr)
if (abbrs.length !== 32 || new Set(abbrs).size !== 32) throw new Error(`team map incomplete: ${JSON.stringify(teamAbbr)}`)
const teamId: Record<string, number> = Object.fromEntries(Object.entries(teamAbbr).map(([id, a]) => [a, Number(id)]))

function findMadden(f: Any): Any | null {
  const pos = FILE_GROUP[f.pos]
  const exact = (byName.get(norm(f.name)) ?? []).filter((m) => GROUP[m.pos] === pos)
  if (exact.length === 1) return exact[0]
  // A different first name ("Kenny" for "Kenneth"): the same last name at the position on his team.
  const last = norm(f.name.split(' ').filter((w: string) => !/^(jr|sr|ii|iii|iv|v)\.?$/i.test(w)).slice(-1)[0] ?? '')
  const pool = exact.length ? exact : madden
  const alt = pool.filter((m) => norm(m.last) === last && GROUP[m.pos] === pos && m.team === teamId[f.team])
  return alt.length === 1 ? alt[0] : null
}

const round2 = (x: number) => Math.round(x * 100) / 100
const out: Any = {
  source: `Madden NFL 26 ${JSON.parse(readFileSync(MADDEN_FILE, 'utf8')).iteration} ratings on Cornerstone's scale (percentile match against generateLeague, seeds ${SEEDS.join(',')})`,
  keys: RATING_KEYS,
  filler: {},
  players: {},
  defenses: {},
  unmatched: [],
}
for (const [key, acc] of slotSums) {
  out.filler[key] = { overall: round2(acc.overall / acc.n), ratings: RATING_KEYS.map((k) => round2(acc.ratings[k]! / acc.n)) }
}
for (const f of file.players) {
  const pos = FILE_GROUP[f.pos]
  if (!pos) continue
  const m = findMadden(f)
  if (!m) { out.unmatched.push(`${f.pos} ${f.name} (${f.team})`); continue }
  const r = engineRatings(m, pos)
  out.players[f.id] = { pos, madden: m.ovr, overall: r.overall, ratings: RATING_KEYS.map((k) => r.ratings[k]) }
}
// Each team's defense: its best 4 edge rushers, 4 interior linemen, 4 linebackers, 5 corners, 4 safeties.
// A team short at a spot fills it with its best unused player from the neighbouring group (a safety
// in the nickel, a linebacker on the edge), rated as the spot he plays.
const DEFENSE: [Pos, number][] = [['EDGE', 4], ['DT', 4], ['LB', 4], ['CB', 5], ['S', 4]]
const NEIGHBOURS: Record<string, Pos[]> = { EDGE: ['LB', 'DT'], DT: ['EDGE'], LB: ['EDGE', 'S'], CB: ['S'], S: ['CB', 'LB'] }
out.borrowed = []
for (const [abbr, id] of Object.entries(teamId)) {
  const unit: Any[] = []
  const used = new Set<number>()
  const starters = new Set<number>()
  for (const [pos, count] of DEFENSE) for (const m of (byTeamPos.get(`${id}:${pos}`) ?? []).slice(0, count)) starters.add(m.id)
  for (const [pos, count] of DEFENSE) {
    const list = (byTeamPos.get(`${id}:${pos}`) ?? []).filter((m) => !used.has(m.id)).slice(0, count)
    for (const other of NEIGHBOURS[pos]!) {
      if (list.length >= count) break
      const spare = (byTeamPos.get(`${id}:${other}`) ?? []).filter((m) => !used.has(m.id) && !starters.has(m.id) && !list.includes(m))
      while (list.length < count && spare.length) { const m = spare.shift(); list.push(m); out.borrowed.push(`${abbr} ${other} ${m.last} as ${pos}`) }
    }
    if (list.length < count) throw new Error(`${abbr} has ${list.length} ${pos}`)
    for (const m of list) {
      used.add(m.id)
      const r = engineRatings(m, pos)
      unit.push({ pos, name: m.last, madden: m.ovr, overall: r.overall, ratings: RATING_KEYS.map((k) => r.ratings[k]) })
    }
  }
  out.defenses[abbr] = unit
}
writeFileSync(path.join(here, 'ratings.json'), JSON.stringify(out))
const n = Object.keys(out.players).length
console.log(`${n} players rated, ${Object.keys(out.defenses).length} defenses, ${slotSums.size} filler slots; unmatched: ${out.unmatched.join('; ') || 'none'}; borrowed: ${out.borrowed.join('; ') || 'none'}`)
