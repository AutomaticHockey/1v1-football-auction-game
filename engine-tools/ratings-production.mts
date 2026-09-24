// Engine ratings from 2025 production, for the player file's players that ratings.json has no Madden
// rating for. Today that is the tight ends: EA's ratings feed was out of reach when they were added.
// `ratings.mts` rates them from Madden like everyone else once the Madden file is there (it rewrites
// ratings.json from scratch, so this file's work is then simply gone).
//
// The same idea as ratings.mts, with production in place of Madden: a player's percentile among
// the league's players at his position becomes the same percentile among Cornerstone's generated
// players there. The league's players: every player at the position with at least the file's
// min_games in nflverse's 2025 season stats, ranked by receiving yards a game. One level for every
// rating, as the generator ties a player's ratings to his level; so no attribute texture (a blocking
// tight end and a receiving one of equal output rate alike).
// Run after ratings.mts, from the Cornerstone repo (or with CORNERSTONE set):
//   cd "D:/NFL game test" && npx tsx "<this folder>/ratings-production.mts" <stats_player_reg_2025.csv>
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
// The Cornerstone repo: $CORNERSTONE, else D:/NFL game test.
const core = (file: string) => import(pathToFileURL(path.join(process.env.CORNERSTONE ?? 'D:/NFL game test', 'src', file)).href)
const { mulberry32 } = await core('core/rng.ts')
const { generateLeague, deriveOverall } = await core('core/generate.ts')
const { buildDepthChart } = await core('core/depthChart.ts')
const { TEAMS } = await core('data/teams.ts')
type Any = any

const here = path.dirname(fileURLToPath(import.meta.url))
const CSV = process.argv[2]
if (!CSV) throw new Error('usage: ratings-production.mts <stats_player_reg_2025.csv>')
const RATINGS_FILE = path.join(here, 'ratings.json')
const R: Any = JSON.parse(readFileSync(RATINGS_FILE, 'utf8'))
const file: Any = JSON.parse(readFileSync(path.join(here, '..', 'nfl_auction_players.json'), 'utf8'))
const POSITIONS = ['TE']   // the positions this rates; production says little about a quarterback's or back's ratings that Madden doesn't

// Cornerstone's generated players at each position: the same leagues ratings.mts reads.
const SEEDS = [1111, 2222, 3333, 4444, 5555, 6666, 7777, 8888, 1212, 2323, 3434, 4545, 5656, 6767, 7878, 8989]
const csPop: Record<string, Record<string, number[]>> = {}
for (const seed of SEEDS) {
  const league = generateLeague(TEAMS, mulberry32(seed).fork('league'))
  for (const team of league.teams) {
    const chart = buildDepthChart(team, league.players)
    for (const pos of POSITIONS) {
      for (const player of chart.byPosition.get(pos) ?? []) for (const k of R.keys) ((csPop[pos] ??= {})[k] ??= []).push(player.ratings[k])
    }
  }
}
for (const pos of POSITIONS) for (const k of R.keys) csPop[pos]![k]!.sort((a: number, b: number) => a - b)
const quantile = (sorted: number[], u: number): number => {
  const x = Math.min(Math.max(u, 0), 1) * (sorted.length - 1), i = Math.floor(x), t = x - i
  return i + 1 < sorted.length ? sorted[i]! + t * (sorted[i + 1]! - sorted[i]!) : sorted[i]!
}
const percentile = (values: number[], v: number): number => {
  let below = 0, equal = 0
  for (const x of values) { if (x < v) below++; else if (x === v) equal++ }
  return (below + 0.5 * equal) / values.length
}

// nflverse's season stats (the headshot URLs hold quoted commas).
const splitCsv = (line: string): string[] => {
  const cells: string[] = []
  let cell = '', quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!
    if (quoted) { if (c === '"' && line[i + 1] === '"') { cell += '"'; i++ } else if (c === '"') quoted = false; else cell += c }
    else if (c === '"') quoted = true
    else if (c === ',') { cells.push(cell); cell = '' }
    else cell += c
  }
  cells.push(cell)
  return cells
}
const [head, ...lines] = readFileSync(CSV, 'utf8').split(/\r?\n/).filter(Boolean)
const cols = splitCsv(head!)
const rows = lines.map((l) => Object.fromEntries(splitCsv(l).map((v, i) => [cols[i], v]))).filter((r: Any) => r.season === String(file.season) && r.season_type === 'REG')
const perGame = (r: Any) => Number(r.receiving_yards) / Number(r.games)

// Anything this rated before (no Madden overall) is rated again.
for (const [id, p] of Object.entries(R.players) as [string, Any][]) if (p.madden === null) delete R.players[id]
R.production = []
for (const pos of POSITIONS) {
  const league = rows.filter((r: Any) => r.position === pos && Number(r.games) >= file.min_games).map(perGame)
  for (const f of file.players.filter((p: Any) => p.pos === pos && !R.players[p.id])) {
    const row = rows.find((r: Any) => r.player_id === f.id)
    if (!row) throw new Error(`${f.name} is not in ${CSV}`)
    const u = percentile(league, perGame(row))
    const ratings: Record<string, number> = {}
    for (const k of R.keys) ratings[k] = Math.round(quantile(csPop[pos]![k]!, u))
    R.players[f.id] = { pos, madden: null, overall: deriveOverall(pos, ratings), ratings: R.keys.map((k: string) => ratings[k]) }
    R.production.push(`${pos} ${f.name} (${f.team}): percentile ${Math.round(100 * u)} of ${league.length}, overall ${R.players[f.id].overall}`)
  }
}
writeFileSync(RATINGS_FILE, JSON.stringify(R))
console.log(`rated from production:\n  ${R.production.join('\n  ')}`)
