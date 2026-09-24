// Each auctioned player's per-play quality as target stats, for the game's grade hooks (game.ts):
// 70% his real 2025 production (the player file), 30% what his Madden rating implies.
//
// "What Madden implies": his rank by engine overall (Madden 26 on the engine's scale, ratings.json)
// among the file's players at his position, read off the same rank of their 2025 production. So the
// Madden part has production's spread and units, and a player's grade leans to his own 2025 line.
// A defense is ranked by its 21 defenders' mean overall.
//
// Stats are rates, not volume (volume is the usage hooks'): a back's yards per carry and per catch,
// a receiver's catch rate and yards per catch, a quarterback's completion rate, yards, and
// interceptions a game (the file has no pass attempts), a defense's yards and points allowed and
// takeaways a game. SIMKIT turns them into each play's edges (simkit.src.js, K.grade).
//   build.mjs writes them into simkit.js; `node grades.mjs` prints them.

export const PRODUCTION_SHARE = 0.7
// A back's catches are few: his yards per catch regresses to the backs' mean by this many catches.
const RB_CATCH_PRIOR = 20

const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length

/** The value at `who`'s rank by `rank` among `list`, read off `value`'s distribution (ties share a rank). */
function impliedByRank(list, who, rank, value) {
  const values = list.map(value).sort((a, b) => a - b)
  const r = rank(who)
  const below = list.filter((p) => rank(p) < r).length
  const equal = list.filter((p) => rank(p) === r).length
  const position = (below + (equal - 1) / 2) / Math.max(1, list.length - 1)
  const at = position * (values.length - 1)
  const lo = Math.floor(at), hi = Math.ceil(at)
  return values[lo] + (values[hi] - values[lo]) * (at - lo)
}

/**
 * playerFile: nfl_auction_players.json; ratings: ratings.json.
 * Returns { players: { id: {...targets} }, defenses: { team: {...targets} }, share }.
 */
export function computeGrades(playerFile, ratings) {
  const byPos = {}
  for (const p of playerFile.players) (byPos[p.pos] ??= []).push(p)
  const overall = (p) => (ratings.players[p.id] ? ratings.players[p.id].overall : null)
  const unitOverall = (p) => {
    const unit = ratings.defenses[p.team]
    return unit ? mean(unit.map((d) => d.overall)) : null
  }
  const blend = (pool, p, rank, value) => {
    const own = value(p)
    const rated = pool.filter((q) => rank(q) !== null)
    if (rank(p) === null || rated.length < 2) return own
    return PRODUCTION_SHARE * own + (1 - PRODUCTION_SHARE) * impliedByRank(rated, p, rank, value)
  }
  const r3 = (x) => Math.round(x * 1000) / 1000
  const out = { share: PRODUCTION_SHARE, players: {}, defenses: {} }

  const rbs = byPos.RB ?? []
  const rbCatchMean = mean(rbs.map((p) => p.stats.totals.rec_yds)) / Math.max(1, mean(rbs.map((p) => p.stats.totals.rec)))
  const rbYpr = (p) => (p.stats.totals.rec_yds + RB_CATCH_PRIOR * rbCatchMean) / (p.stats.totals.rec + RB_CATCH_PRIOR)
  for (const p of rbs) {
    out.players[p.id] = { ypc: r3(blend(rbs, p, overall, (q) => q.stats.ypc)), ypr: r3(blend(rbs, p, overall, rbYpr)) }
  }
  const wrs = byPos.WR ?? []
  const catchRate = (p) => p.stats.totals.rec / Math.max(1, p.stats.totals.tgt)
  const wrYpr = (p) => p.stats.totals.rec_yds / Math.max(1, p.stats.totals.rec)
  for (const p of wrs) {
    out.players[p.id] = { catch: r3(blend(wrs, p, overall, catchRate)), ypr: r3(blend(wrs, p, overall, wrYpr)) }
  }
  const qbs = byPos.QB ?? []
  for (const p of qbs) {
    out.players[p.id] = {
      cmp: r3(blend(qbs, p, overall, (q) => q.stats.cmp_pct / 100)),
      yds: r3(blend(qbs, p, overall, (q) => q.stats.pass_yds_g)),
      int: r3(blend(qbs, p, overall, (q) => q.stats.int_g)),
    }
  }
  const defs = byPos.DEF ?? []
  for (const p of defs) {
    out.defenses[p.team] = {
      yds: r3(blend(defs, p, unitOverall, (q) => q.stats.yds_allowed_g)),
      pts: r3(blend(defs, p, unitOverall, (q) => q.stats.pts_allowed_g)),
      take: r3(blend(defs, p, unitOverall, (q) => q.stats.takeaways_g)),
    }
  }
  return out
}

// `node grades.mjs`: print every grade beside the player's own 2025 line.
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('grades.mjs')) {
  const { readFileSync } = await import('node:fs')
  const path = await import('node:path')
  const here = path.dirname(new URL(import.meta.url).pathname)
  const file = JSON.parse(readFileSync(path.join(here, '..', 'nfl_auction_players.json'), 'utf8'))
  const ratings = JSON.parse(readFileSync(path.join(here, 'ratings.json'), 'utf8'))
  const g = computeGrades(file, ratings)
  for (const p of file.players) {
    const grade = p.pos === 'DEF' ? g.defenses[p.team] : g.players[p.id]
    console.log(`${p.pos.padEnd(3)} ${p.name.padEnd(26)} ${JSON.stringify(grade)}`)
  }
}
