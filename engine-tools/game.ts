/* =====================================================================
   PLAY-BY-PLAY ENGINE: Cornerstone (D:\NFL game test, src/core), compiled
   from its own TypeScript by engine-tools/build.mjs, plus this game's driver.

   Every play is Cornerstone's own engine. The players are rated: SIMKIT
   gives the real players their Madden ratings on the engine's scale. Without
   options this reproduces Cornerstone's simulateGame draw for draw
   (engine-tools/equiv.ts checks it). This game adds:
   - opts.usage: who gets the ball follows each player's real 2025 volume
     (targets, backs' carries); ratings still decide which routes and runs;
     and each real player's grade (mostly his 2025 production) moves the
     plays he is in: yards a carry, completions, interceptions, yards a catch;
   - opts.neutral: a neutral field (no crowd, fixed mild weather, no pace draw);
   - quarter-by-quarter play, and up to three overtime periods under the
     engine's own overtime rules (both teams get the ball, then sudden death);
   - a drive log, read off the engine's play recorder.
   ===================================================================== */
import { HOOKS } from 'game:hooks'
import { buildDepthChart } from './cornerstone/depthChart'
import { kickoff, runCurrentPeriod, simulateGame as cornerstoneSimulateGame, transitionPeriod } from './cornerstone/gameEngine'
import { mulberry32 } from './cornerstone/rng'
import { createGameStatBook, playerStatLines } from './cornerstone/stats'
import { TUNING } from './cornerstone/tuning'

type Side = 'home' | 'away'
type Any = any

/* ---------- usage: who gets the ball ---------- */
// A skill player's `usage` (SIMKIT): { targets, carries } a game, his real 2025 volume (filler
// splits what a real team has left, by the engine's own depth-rank shares).
// Targets: a receiver's weight on a route is his volume, times his group's lean to that route
// (TUNING.usage.targetGroupShare over the league's route mix), times his fitness for the route
// (the engine's own, from his ratings) over his average fitness. So the ratings pick the routes and
// the volume holds. Backs' carries: the backs' share of a run (the engine's, after the quarterback's
// and the receivers') splits by carries, times run fitness over average run fitness. Two real backs
// (an RB in FLEX) then re-split what they have together: half by real carries, half by overall.
// Grades (SIMKIT's `edge` on a real player, `unit` on a real defense's players): edges add to a
// run's yards and a throw's completion chance, and multiply a catch's yards and the interception
// chance. Filler and a replacement defense have none, so an all-filler game is the engine's own.
// CONFIG: the league's mixes, measured in an all-average game (engine-tools/check.js prints them).
const ROUTES = ['screen', 'short', 'medium', 'deep'] as const
const RUNS = ['inside', 'outside', 'draw', 'power'] as const
const CONFIG: Any = {
  routeMix: { screen: 0.199, short: 0.454, medium: 0.215, deep: 0.131 },
  runMix: { inside: 0.354, outside: 0.441, draw: 0.121, power: 0.084 },
  // Two real backs: the share of their carries split by overall, and its weight a point of overall
  // (0.05: 6 points apart is 57/43, 20 apart 73/27).
  backOverallShare: 0.5,
  backOverallPerPoint: 0.05,
}
let lean: Record<string, Record<string, number>> = {}
let routeWeight: Record<string, Record<string, number>> = {}
function configure(settings: Any = {}): void {
  Object.assign(CONFIG, settings)
  lean = {}
  routeWeight = {}
  TUNING.usage.targetGroups.forEach((group: string, index: number) => {
    const share = (kind: string) => (TUNING.usage.targetGroupShare as Any)[kind][index] as number
    const overall = ROUTES.reduce((sum, kind) => sum + CONFIG.routeMix[kind] * share(kind), 0)
    lean[group] = Object.fromEntries(ROUTES.map((kind) => [kind, share(kind) / overall]))
    routeWeight[group] = Object.fromEntries(ROUTES.map((kind) => [kind, CONFIG.routeMix[kind] * lean[group]![kind]!]))
  })
}
configure()

const USAGE = {
  targetWeight(option: Any, kind: string, fitness: (route: string) => number): number {
    const volume = option.player.usage ? option.player.usage.targets : 0
    if (!(volume > 0)) return 0
    const w = routeWeight[option.group]!
    const average = ROUTES.reduce((sum, route) => sum + w[route]! * fitness(route), 0)
    return volume * lean[option.group]![kind]! * fitness(kind) / average
  },
  backCarries(candidates: Any[], backShare: number, score: string, fitness: (player: Any, score: string) => number): void {
    const backs = candidates.filter((c) => c.group === 'RB')
    const weights = backs.map((c) => {
      const volume = c.player.usage ? c.player.usage.carries : 0
      if (!(volume > 0)) return 0
      const average = RUNS.reduce((sum, run) => sum + CONFIG.runMix[run] * fitness(c.player, run), 0)
      return volume * fitness(c.player, score) / average
    })
    const own = backs.map((c, i) => i).filter((i) => backs[i].player.usage && backs[i].player.usage.own && weights[i]! > 0)
    if (own.length > 1) {
      const together = own.reduce((sum, i) => sum + weights[i]!, 0)
      const top = Math.max(...own.map((i) => backs[i].player.overall))
      const byOverall = own.map((i) => Math.exp(CONFIG.backOverallPerPoint * (backs[i].player.overall - top)))
      const overallSum = byOverall.reduce((a, b) => a + b, 0)
      const split = CONFIG.backOverallShare
      own.forEach((i, k) => { weights[i] = together * ((1 - split) * weights[i]! / together + split * byOverall[k]! / overallSum) })
    }
    const total = weights.reduce((a, b) => a + b, 0)
    backs.forEach((c, i) => { c.weight = total > 0 ? backShare * weights[i]! / total : 0 })
  },
  runShift(rusher: Any, defense: Any): number {
    return edgeOf(rusher).run + unitOf(defense).run
  },
  passCatch(qb: Any, receiver: Any, defense: Any): number {
    return edgeOf(qb).catch + edgeOf(receiver).catch + unitOf(defense).catch
  },
  passInt(qb: Any, defense: Any): number {
    return edgeOf(qb).int * unitOf(defense).int
  },
  passYards(drawn: number, qb: Any, receiver: Any, defense: Any): number {
    return drawn > 0 ? drawn * edgeOf(qb).yards * edgeOf(receiver).yards * unitOf(defense).yards : drawn
  },
}
const NO_EDGE = { run: 0, catch: 0, yards: 1, int: 1 }
const edgeOf = (player: Any) => player.edge || NO_EDGE
// A real defense's edges ride on each of its players; any of its backs will do.
const unitOf = (defense: Any) => defense.getGroup('DB').unit || NO_EDGE

function withUsage<T>(on: boolean, fn: () => T): T {
  const saved = HOOKS.game
  HOOKS.game = on ? USAGE : null
  try { return fn() } finally { HOOKS.game = saved }
}

/* ---------- drive log (read off the engine's play recorder) ---------- */
// Each finished drive: { side, result, detail, plays, yards, secs, score: [home, away], play, onside }.
// result: TD FG MISSED_FG PUNT INT FUMBLE INT_TD FUM_TD PR_TD KR_TD DOWNS SAFETY HALF END.
// detail: the kick's distance on a field goal or punt, the try's outcome after a touchdown.
function driveLog(rt: Any) {
  let open: Any = null
  let lastKick: Any = null
  let onside: string | null = null
  const Q = TUNING.football.quarterSeconds
  const now = () => ({ q: rt.context.quarter, c: rt.context.clock })
  const elapsed = (a: Any, b: Any) => (a.q === b.q ? a.c - b.c : (b.q - a.q - 1) * Q + a.c + (Q - b.c))
  const start = (side: Side, result: string | null = null) => ({ side, result, detail: null as Any, plays: 0, yards: 0, at: now(), play: null as Any, last: null as Any, onside })
  const byCause: Record<string, string> = { downs: 'DOWNS', halftime: 'HALF', overtime: 'END', punt: 'PUNT', missedFieldGoal: 'MISSED_FG', fieldGoal: 'FG', touchdown: 'TD', safety: 'SAFETY' }
  function close(fallback: string): void {
    if (!open) return
    const d = open
    open = null
    const result = d.result || fallback
    // A "drive" that never snapped and ended with the clock (a score as the half ran out) is not shown.
    if (d.plays === 0 && (result === 'HALF' || result === 'END')) return
    rt.log.push({
      side: d.side, result, detail: d.detail, plays: d.plays, yards: d.yards, secs: Math.max(0, elapsed(d.at, now())),
      score: [rt.context.homeScore, rt.context.awayScore], play: d.play || d.last, onside: d.onside,
    })
  }
  return {
    record(e: Any): void {
      switch (e.kind) {
        case 'series':
          if (open) close(e.cause === 'turnover' ? (open.last && open.last.type === 'int' ? 'INT' : 'FUMBLE') : byCause[e.cause] || 'END')
          open = start(e.side)
          onside = null
          break
        case 'snap':
          if (!open) open = start(e.offense)
          if (e.result.type !== 'penalty') open.plays += 1
          open.yards += e.result.yards
          open.last = e.result
          if (e.result.isTurnover) open.play = e.result
          break
        case 'touchdown':
          if (e.specialTeams && !(lastKick && lastKick.kind === 'punt' && open)) {
            close('END')
            open = start(e.side, 'KR_TD')
          } else if (open) {
            open.result = e.specialTeams ? 'PR_TD' : e.defensive ? (open.last && open.last.type === 'int' ? 'INT_TD' : 'FUM_TD') : 'TD'
            if (!e.specialTeams) open.play = open.last
          }
          break
        case 'conversion':
          if (open) open.detail = e.twoPoint ? (e.made ? '2PT' : '2PT_FAIL') : e.made ? null : 'XP_MISS'
          break
        case 'fieldGoal':
          if (open) { open.result = e.made ? 'FG' : 'MISSED_FG'; open.detail = e.distance }
          break
        case 'punt':
          lastKick = e
          if (open) { open.result = 'PUNT'; open.detail = e.gross }
          break
        case 'kickoff':
          // A kickoff follows a finished score (or opens a period): the drive before it is done.
          lastKick = e
          close('END')
          if (e.onside) onside = e.recovered ? 'recovered' : 'failed'
          break
        case 'safety':
          if (open) open.result = 'SAFETY'
          break
      }
    },
    closeOpen(result: string): void { close(result) },
  }
}

/* ---------- the game ---------- */
// The neutral field's weather: a mild day with 5 mph of wind. Over Cornerstone's stadiums (a third
// indoors, mean wind 4.8 mph) weather costs 0.96 points of completion and 0.86 of field-goal make
// rate on average; 5 mph costs 0.65 and 0.90.
const NEUTRAL_WEATHER = { tempF: 60, windMph: 5, precip: 'none', indoor: false }

/**
 * A game ready for its first snap (the opening kickoff is done). Without opts.neutral: the same
 * draws, in the same order, as Cornerstone's simulateGame.
 * opts: { neutral, usage, tempo, weather, log, recorder, scheduleGame }
 */
function createGame(home: Any, away: Any, players: Any[], rng: Any, opts: Any = {}): Any {
  return withUsage(!!opts.usage, () => startGame(home, away, players, rng, opts))
}
function startGame(home: Any, away: Any, players: Any[], rng: Any, opts: Any): Any {
  const neutral = !!opts.neutral
  const firstHalfReceiver: Side = rng.chance(TUNING.coach.neutral) ? 'home' : 'away'
  const weather = neutral ? Object.assign({}, NEUTRAL_WEATHER, opts.weather || {}) : opts.weather
  const context = {
    homeScore: 0,
    awayScore: 0,
    quarter: 1,
    clock: TUNING.football.quarterSeconds,
    down: 1,
    toGo: TUNING.football.firstDownYards,
    yardLine: TUNING.football.kickoffTouchbackSpot,
    possession: firstHalfReceiver,
    weather,
    tempoEnvironment: neutral ? opts.tempo || 0 : rng.fork('scoring-environment').gauss(0, TUNING.scoring.gameScriptTempoSd),
    crowdFactor: neutral ? 0 : TUNING.homeField.crowdFactor,
    isTwoMinute: false,
    timeoutsHome: TUNING.football.startingTimeouts,
    timeoutsAway: TUNING.football.startingTimeouts,
  }
  const rt: Any = {
    context,
    home,
    away,
    homeChart: buildDepthChart(home, players, rng.fork('form:home')),
    awayChart: buildDepthChart(away, players, rng.fork('form:away')),
    stats: createGameStatBook(home, away, players),
    rng,
    firstHalfReceiver,
    driveReachedRedZone: false,
    overtimePossessions: new Set(),
    overtime: false,
    finished: false,
    snaps: 0,
    clockRunning: false,
    recorder: undefined,
    pauseAtQuarterEnd: true,
    usage: !!opts.usage,
    log: [],
    logger: null,
    otPeriods: 0,
  }
  if (opts.log) rt.logger = driveLog(rt)
  const sinks = [rt.logger, opts.recorder].filter(Boolean)
  if (sinks.length) rt.recorder = { record: (e: Any) => { for (const s of sinks) s.record(e) } }
  if (opts.scheduleGame) {
    rt.recorder?.record({
      kind: 'gameStart', gameId: opts.scheduleGame.id, week: opts.scheduleGame.week, homeTeamId: home.id, awayTeamId: away.id,
      weather: { ...weather }, receiving: firstHalfReceiver, yardLine: context.yardLine,
    })
  }
  kickoff(rt, firstHalfReceiver, 'opening')
  return rt
}

/** Plays the next quarter of regulation. False once regulation is over. */
function playQuarter(rt: Any): boolean {
  return withUsage(rt.usage, () => stepQuarter(rt))
}
function stepQuarter(rt: Any): boolean {
  const c = rt.context
  if (rt.overtime || rt.finished || (c.quarter >= TUNING.football.downs && c.clock === 0)) return false
  if (c.clock === 0) transitionPeriod(rt)
  rt.pauseAtQuarterEnd = true
  runCurrentPeriod(rt)
  // The drive on the field at the half, or at the end of regulation, is over.
  if (rt.logger && c.clock === 0 && (c.quarter === TUNING.football.firstHalfFinalQuarter || c.quarter === TUNING.football.downs)) {
    rt.logger.closeOpen(c.quarter === TUNING.football.downs ? 'END' : 'HALF')
  }
  return true
}

/**
 * One overtime period under the engine's rules: a coin-toss kickoff, ten minutes, both teams get
 * the ball, then sudden death. The first period is exactly Cornerstone's overtime; each later one
 * starts afresh the same way.
 */
function playOvertimePeriod(rt: Any): void {
  withUsage(rt.usage, () => stepOvertime(rt))
}
function stepOvertime(rt: Any): void {
  const c = rt.context
  rt.overtime = true
  rt.otPeriods += 1
  c.quarter = TUNING.football.downs + 1
  c.clock = TUNING.football.overtimeSeconds
  c.isTwoMinute = false
  c.timeoutsHome = TUNING.football.startingTimeouts
  c.timeoutsAway = TUNING.football.startingTimeouts
  if (rt.otPeriods > 1) {
    rt.overtimePossessions = new Set()
    rt.finished = false
  }
  kickoff(rt, rt.rng.chance(TUNING.coach.neutral) ? 'home' : 'away', 'overtime')
  runCurrentPeriod(rt)
  if (rt.logger) rt.logger.closeOpen('END')
}

/** A whole game the way this game plays it: four quarters, then up to `maxOvertimes` periods while tied. */
function simulateGame(home: Any, away: Any, players: Any[], rng: Any, opts: Any = {}): Any {
  const rt = createGame(home, away, players, rng, opts)
  while (playQuarter(rt)) { /* next quarter */ }
  const periods = opts.maxOvertimes ?? 3
  for (let n = 0; n < periods && rt.context.homeScore === rt.context.awayScore; n += 1) playOvertimePeriod(rt)
  return rt
}

export {
  TUNING, mulberry32, createGame, playQuarter, playOvertimePeriod, simulateGame, playerStatLines, configure,
  cornerstoneSimulateGame, NEUTRAL_WEATHER,
}
