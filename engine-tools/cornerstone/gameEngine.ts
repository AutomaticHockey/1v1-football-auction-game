import { selectPlay } from './coachAI'
import { buildDepthChart, type DepthChart } from './depthChart'
import { cellOf, quantileAt } from './distributions'
import { resolvePlay } from './playEngine'
import type { RNG } from './rng'
import {
  addPoints,
  addPossessionTime,
  createGameStatBook,
  playerStatLines,
  recordFieldGoal,
  recordPunt,
  recordScrimmagePlay,
  type GameStatBook,
} from './stats'
import { TUNING } from './tuning'
import type {
  GameContext, GameResult, Player, PlayIntent, PlayLogSituation, PlayRecorder, PlayResult, ScheduleGame, SeriesCause, Stadium, Team,
  TeamGameStats, Weather,
} from './types'

type Side = GameContext['possession']

type Runtime = {
  context: GameContext
  home: Team
  away: Team
  homeChart: DepthChart
  awayChart: DepthChart
  stats: GameStatBook
  rng: RNG
  firstHalfReceiver: Side
  driveReachedRedZone: boolean
  overtimePossessions: Set<Side>
  overtime: boolean
  finished: boolean
  snaps: number
  /** NFLVERSE S3: whether the clock is running at the next snap (false after a stoppage or a new series). */
  clockRunning: boolean
  /** NFLVERSE.md N4. Opt-in, off by default, a pure sink: see `PlayRecorder` in types.ts. */
  recorder: PlayRecorder | undefined
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function sideTeam(runtime: Runtime, side: Side): Team {
  return side === 'home' ? runtime.home : runtime.away
}

function sideChart(runtime: Runtime, side: Side): DepthChart {
  return side === 'home' ? runtime.homeChart : runtime.awayChart
}

function sideStats(runtime: Runtime, side: Side): TeamGameStats {
  return side === 'home' ? runtime.stats.home : runtime.stats.away
}

function otherSide(side: Side): Side {
  return side === 'home' ? 'away' : 'home'
}

function setScore(runtime: Runtime, side: Side, points: number): void {
  if (side === 'home') runtime.context.homeScore += points
  else runtime.context.awayScore += points
  addPoints(sideStats(runtime, side), points)
}

function scoreDifference(runtime: Runtime, side: Side): number {
  return side === 'home'
    ? runtime.context.homeScore - runtime.context.awayScore
    : runtime.context.awayScore - runtime.context.homeScore
}

/** A copy of the situation, for the play recorder. Reads only. */
function situation(context: GameContext): PlayLogSituation {
  return {
    quarter: context.quarter,
    clock: context.clock,
    down: context.down,
    toGo: context.toGo,
    yardLine: context.yardLine,
    homeScore: context.homeScore,
    awayScore: context.awayScore,
    timeoutsHome: context.timeoutsHome,
    timeoutsAway: context.timeoutsAway,
  }
}

/**
 * Phase 3.7 — the shared game-script factor is applied HERE, at every drive start.
 *
 * It was previously added to rushing and receiving yardage. That is additive on YARDS, and yards
 * convert to points non-linearly and team-dependently: a good offense turns a shared yardage
 * boost into more points than a bad one, so on the scoreboard it behaved multiplicatively and
 * widened the margin distribution — the exact failure that killed three earlier attempts.
 *
 * Drive-starting field position is the right layer. Both teams take the same shift, both teams
 * get within one drive of the same number of possessions in a fixed-length game, and expected
 * points move close to linearly with starting yard line (~0.045 points per yard). So the total
 * moves and the margin does not.
 */
function resetSeries(runtime: Runtime, side: Side, yardLine: number, cause: SeriesCause): void {
  runtime.context.possession = side
  runtime.context.yardLine = yardLine
  runtime.context.down = 1
  runtime.context.toGo = Math.min(TUNING.football.firstDownYards, TUNING.football.fieldLength - yardLine)
  runtime.clockRunning = false
  runtime.driveReachedRedZone = yardLine >= TUNING.scoring.redZoneLine
  if (runtime.driveReachedRedZone) sideStats(runtime, side).redZoneTrips += 1
  runtime.recorder?.record({ kind: 'series', side, yardLine, quarter: runtime.context.quarter, clock: runtime.context.clock, cause })
}

function overtimePossessionEnded(runtime: Runtime, side: Side): void {
  if (!runtime.overtime) return
  runtime.overtimePossessions.add(side)
  if (runtime.overtimePossessions.size >= TUNING.football.overtimePossessionsRequired && runtime.context.homeScore !== runtime.context.awayScore) {
    runtime.finished = true
  }
}

function changePossession(runtime: Runtime, yardLine: number, cause: SeriesCause): void {
  const prior = runtime.context.possession
  overtimePossessionEnded(runtime, prior)
  if (runtime.finished) return
  resetSeries(runtime, otherSide(prior), clamp(yardLine, 0, TUNING.football.fieldLength), cause)
}

/**
 * NFLVERSE S2 — a kickoff under the 2025 rule, drawn from 2025 play-by-play: an onside kick when
 * the kicking team trails late (or, rarely, as a surprise), otherwise a touchback to the 35, a return,
 * or the odd kick out of bounds. `cause` is why the previous series ended; whichever side ends up
 * with the ball starts its series with it, so the play log closes the previous drive correctly.
 */
function kickoff(runtime: Runtime, receivingSide: Side, cause: SeriesCause): void {
  // A score as a half's clock runs out is followed by the try and no kickoff. The series still
  // changes hands, so the play log closes the scoring drive.
  const halfOver = runtime.context.clock === 0 && !runtime.overtime
    && (runtime.context.quarter === TUNING.football.firstHalfFinalQuarter || runtime.context.quarter === TUNING.football.downs)
  if (halfOver) {
    resetSeries(runtime, receivingSide, TUNING.football.kickoffTouchbackSpot, cause)
    return
  }
  const rules = TUNING.kicking.kickoff
  const kicking = otherSide(receivingSide)
  const at = runtime.recorder === undefined ? null : situation(runtime.context)
  const deficit = -scoreDifference(runtime, kicking)
  const late = runtime.context.quarter === TUNING.football.downs && runtime.context.clock <= TUNING.clock.lateGameSeconds && deficit > 0
  const onsideShare = late ? rules.onsideLateShare[cellOf(rules.onsideDeficits, deficit)] as number : rules.onsideOtherShare
  const log = (event: { onside: boolean; recovered: boolean; touchback: boolean; returned: boolean; returnYards: number; returnTouchdown: boolean; yardLine: number | null }): void => {
    if (at !== null) runtime.recorder?.record({ kind: 'kickoff', kicking, at, ...event })
  }
  if (runtime.rng.chance(onsideShare)) {
    const recovered = runtime.rng.chance(rules.onsideRecovery)
    const yardLine = recovered ? rules.onsideKickingSpot : rules.onsideReceivingSpot
    log({ onside: true, recovered, touchback: false, returned: false, returnYards: 0, returnTouchdown: false, yardLine })
    resetSeries(runtime, recovered ? kicking : receivingSide, yardLine, cause)
    return
  }
  const roll = runtime.rng.next()
  if (roll < rules.touchbackRate) {
    log({ onside: false, recovered: false, touchback: true, returned: false, returnYards: 0, returnTouchdown: false, yardLine: TUNING.football.kickoffTouchbackSpot })
    resetSeries(runtime, receivingSide, TUNING.football.kickoffTouchbackSpot, cause)
    return
  }
  if (roll >= rules.touchbackRate + rules.returnRate) {
    log({ onside: false, recovered: false, touchback: false, returned: false, returnYards: 0, returnTouchdown: false, yardLine: rules.otherSpot })
    resetSeries(runtime, receivingSide, rules.otherSpot, cause)
    return
  }
  if (runtime.rng.chance(rules.returnTouchdownRate)) {
    const returnYards = Math.round(TUNING.football.fieldLength - rules.catchSpot)
    log({ onside: false, recovered: false, touchback: false, returned: true, returnYards, returnTouchdown: true, yardLine: null })
    specialTeamsTouchdown(runtime, receivingSide, cause)
    return
  }
  const yardLine = clamp(Math.round(quantileAt(rules.returnStart, runtime.rng.next())), 1, TUNING.football.fieldLength - 1)
  log({ onside: false, recovered: false, touchback: false, returned: true, returnYards: Math.max(0, Math.round(yardLine - rules.catchSpot)), returnTouchdown: false, yardLine })
  resetSeries(runtime, receivingSide, yardLine, cause)
}

function transitionPeriod(runtime: Runtime): void {
  if (runtime.context.quarter >= TUNING.football.downs) return
  runtime.context.quarter += 1
  runtime.context.clock = TUNING.football.quarterSeconds
  runtime.context.isTwoMinute = false
  if (runtime.context.quarter === TUNING.coach.lateQuarter) {
    runtime.context.timeoutsHome = TUNING.football.startingTimeouts
    runtime.context.timeoutsAway = TUNING.football.startingTimeouts
    kickoff(runtime, otherSide(runtime.firstHalfReceiver), 'halftime')
  }
}

function consumeClock(runtime: Runtime, requested: number, offense: Side): void {
  let used = Math.min(runtime.context.clock, Math.max(0, Math.round(requested)))
  // The two-minute warning stops the clock at 2:00 of the second and fourth quarters.
  const warning = TUNING.football.twoMinuteSeconds
  const warningQuarter = runtime.context.quarter === TUNING.football.firstHalfFinalQuarter
    || runtime.context.quarter === TUNING.football.downs
  if (warningQuarter && runtime.context.clock > warning && runtime.context.clock - used < warning) {
    used = runtime.context.clock - warning
    runtime.clockRunning = false
  }
  runtime.context.clock -= used
  addPossessionTime(sideStats(runtime, offense), used)
  runtime.context.isTwoMinute = warningQuarter && runtime.context.clock <= TUNING.football.twoMinuteSeconds
}

/** NFLVERSE S3: the windows in which going out of bounds stops the clock (NFL rule 4-3). */
function lateInHalf(quarter: number, clock: number): boolean {
  return (quarter === TUNING.football.firstHalfFinalQuarter && clock <= TUNING.football.twoMinuteSeconds)
    || (quarter >= TUNING.football.downs && clock <= TUNING.clock.lateGameSeconds)
}

/** Whether `side` calls a timeout now; spends it if so. */
function useTimeout(runtime: Runtime, side: Side): boolean {
  const key = side === 'home' ? 'timeoutsHome' : 'timeoutsAway'
  if (runtime.context[key] <= 0) return false
  runtime.context[key] -= 1
  return true
}

/**
 * Seconds that run off after a play before the next snap. Zero when the play stopped the clock: an
 * incompletion, a penalty, a spike, or going out of bounds late in a half (NFLVERSE S3: earlier in a
 * half the clock restarts on the ready signal, which real pace shows: 37.7 seconds to the next snap
 * after a run in neutral time, whether or not it went out). Also zero when a timeout stops it.
 */
function runoffFor(runtime: Runtime, result: PlayResult, intent: PlayIntent, offense: Side, before: GameContext): number {
  // A score or a change of possession stops the clock (the next snap is after a kick, or a new
  // series): touchdowns, turnovers, and a fourth down that fails.
  const endsSeries = result.isTouchdown || result.isTurnover
    || (result.type !== 'penalty' && before.down === TUNING.football.downs && !result.isFirstDown && before.yardLine + result.yards < TUNING.football.fieldLength)
  if (endsSeries || result.type === 'incomplete' || result.type === 'spike'
    || (result.outOfBounds && lateInHalf(before.quarter, before.clock))) return 0
  // After a penalty the clock restarts on the ready signal, except late in a half.
  if (result.type === 'penalty') return lateInHalf(before.quarter, before.clock) ? 0 : TUNING.clock.penaltyRunoff
  let runoff = intent.drainClock
    ? TUNING.clock.drainClockRunoff
    : intent.tempo >= TUNING.coach.turboTempo
      ? TUNING.clock.hurryUpRunoff
      : intent.noHuddle
        ? TUNING.clock.noHuddleRunoff
        : intent.tempo > TUNING.coach.riskScale * TUNING.coach.neutral
          ? TUNING.clock.mediumRunoff
          : TUNING.clock.normalRunoff
  if (runtime.overtime && runtime.context.homeScore === runtime.context.awayScore) {
    runoff = TUNING.clock.hurryUpRunoff
  }
  // NFLVERSE S3 — timeouts, at most one per stoppage.
  const defense = otherSide(offense)
  const quarter = runtime.context.quarter
  const endOfHalf = quarter === TUNING.football.firstHalfFinalQuarter && runtime.context.clock <= TUNING.football.twoMinuteSeconds
  const lateGame = quarter >= TUNING.football.downs && runtime.context.clock <= TUNING.clock.lateGameSeconds
  const lastTwo = quarter >= TUNING.football.downs && runtime.context.clock <= TUNING.football.twoMinuteSeconds
  const stopped = (lateGame && scoreDifference(runtime, defense) < 0
      && (lastTwo || runtime.rng.chance(TUNING.clock.lateDefenseTimeoutChance)) && useTimeout(runtime, defense))
    || (endOfHalf && runtime.rng.chance(TUNING.clock.halfDefenseTimeoutChance) && useTimeout(runtime, defense))
    || (endOfHalf && runtime.rng.chance(TUNING.clock.halfOffenseTimeoutChance) && useTimeout(runtime, offense))
    || (quarter >= TUNING.football.downs && runtime.context.clock <= TUNING.football.twoMinuteSeconds && scoreDifference(runtime, offense) <= 0
      && runtime.rng.chance(TUNING.clock.hurryOffenseTimeoutChance) && useTimeout(runtime, offense))
    || (!endOfHalf && !lateGame && runtime.rng.chance(TUNING.clock.ordinaryTimeoutRate)
      && useTimeout(runtime, runtime.rng.chance(TUNING.clock.offenseTimeoutShare) ? offense : defense))
  if (stopped) return 0
  // Phase 3.7 — the shared game-script factor. One draw per game, applied identically to both
  // teams, as a proportional shift to between-play clock runoff. A slower game gives BOTH teams
  // fewer possessions and a faster one gives both more, which is a shared movement in expected
  // points per team with no dependence on which offense is better.
  return Math.max(0, runoff * (1 + runtime.context.tempoEnvironment))
}

function updateRedZone(runtime: Runtime, side: Side, beforeYardLine: number): void {
  if (!runtime.driveReachedRedZone
    && beforeYardLine < TUNING.scoring.redZoneLine
    && runtime.context.yardLine >= TUNING.scoring.redZoneLine
    && runtime.context.yardLine < TUNING.football.fieldLength) {
    runtime.driveReachedRedZone = true
    sideStats(runtime, side).redZoneTrips += 1
  }
}

/**
 * NFLVERSE S2 — go for two? DERIVED: a flat rate in Q1-Q3, and in Q4 (and overtime) the real chart
 * on the scoring team's lead after the touchdown, which is signed: down 2 goes for two, up 2 kicks.
 */
function shouldTryTwo(runtime: Runtime, side: Side): boolean {
  if (runtime.context.quarter < TUNING.football.downs) return runtime.rng.chance(TUNING.kicking.twoPointTryEarly)
  const reach = TUNING.kicking.twoPointLeads
  const lead = clamp(scoreDifference(runtime, side), -reach, reach)
  return runtime.rng.chance(TUNING.kicking.twoPointTryFourthQuarter[lead + reach] as number)
}

/** The try after any touchdown: two points or the kick. */
function conversionTry(runtime: Runtime, side: Side): void {
  const pointsBeforeTry = sideStats(runtime, side).points
  const beforeTry = runtime.recorder === undefined ? null : situation(runtime.context)
  const twoPoint = shouldTryTwo(runtime, side)
  if (twoPoint) {
    if (runtime.rng.chance(TUNING.kicking.twoPointRate)) setScore(runtime, side, TUNING.football.twoPointPoints)
  } else if (runtime.rng.chance(TUNING.kicking.extraPointRate)) {
    setScore(runtime, side, TUNING.football.extraPointPoints)
  }
  if (beforeTry !== null) {
    runtime.recorder?.record({ kind: 'conversion', side, twoPoint, made: sideStats(runtime, side).points > pointsBeforeTry, at: beforeTry })
  }
}

/**
 * NFL rule 11-3: a touchdown that ends the game in overtime has no try (real 6-point finals: a
 * walk-off overtime touchdown is 1.69% of all games, 2015-2025). `endsNow` says whether this score
 * ends it: a defensive or special-teams score always does once it puts the side ahead, an
 * offensive one once both sides have had the ball.
 */
function tryUnlessWalkOff(runtime: Runtime, side: Side, endsNow: boolean): void {
  if (runtime.overtime && endsNow && scoreDifference(runtime, side) > 0) return
  conversionTry(runtime, side)
}

function touchdown(runtime: Runtime, side: Side): void {
  setScore(runtime, side, TUNING.football.touchdownPoints)
  runtime.recorder?.record({ kind: 'touchdown', side, defensive: false })
  if (runtime.driveReachedRedZone) sideStats(runtime, side).redZoneTouchdowns += 1
  tryUnlessWalkOff(runtime, side, new Set([...runtime.overtimePossessions, side]).size >= TUNING.football.overtimePossessionsRequired)
  overtimePossessionEnded(runtime, side)
  if (!runtime.finished) kickoff(runtime, otherSide(side), 'touchdown')
}

function returnTouchdown(runtime: Runtime, scoringSide: Side): void {
  const scoredOn = otherSide(scoringSide)
  setScore(runtime, scoringSide, TUNING.football.touchdownPoints)
  sideStats(runtime, scoringSide).defensiveTouchdowns += 1
  runtime.recorder?.record({ kind: 'touchdown', side: scoringSide, defensive: true })
  tryUnlessWalkOff(runtime, scoringSide, true)
  // A defensive score in overtime ends the game outright, whatever the possession count.
  if (runtime.overtime && runtime.context.homeScore !== runtime.context.awayScore) {
    runtime.finished = true
    return
  }
  overtimePossessionEnded(runtime, scoredOn)
  if (!runtime.finished) kickoff(runtime, scoredOn, 'returnTouchdown')
}

/**
 * NFLVERSE S2 — a kick or punt returned for a touchdown. The returning side scores and tries; it
 * then kicks off, and that kick starts its series with `cause`, the reason the ball changed hands.
 */
function specialTeamsTouchdown(runtime: Runtime, side: Side, cause: SeriesCause): void {
  setScore(runtime, side, TUNING.football.touchdownPoints)
  runtime.recorder?.record({ kind: 'touchdown', side, defensive: false, specialTeams: true })
  tryUnlessWalkOff(runtime, side, true)
  if (runtime.overtime && runtime.context.homeScore !== runtime.context.awayScore) {
    runtime.finished = true
    return
  }
  kickoff(runtime, otherSide(side), cause)
}

function safety(runtime: Runtime, offense: Side): void {
  const defense = otherSide(offense)
  setScore(runtime, defense, TUNING.football.safetyPoints)
  runtime.recorder?.record({ kind: 'safety', side: defense })
  overtimePossessionEnded(runtime, offense)
  if (!runtime.finished) kickoff(runtime, defense, 'safety')
}

function applyScrimmage(runtime: Runtime, result: PlayResult, intent: PlayIntent): void {
  const side = runtime.context.possession
  const defense = otherSide(side)
  const offenseStats = sideStats(runtime, side)
  const before = { ...runtime.context, weather: { ...runtime.context.weather } }
  recordScrimmagePlay(runtime.stats, offenseStats, sideStats(runtime, defense), before, result)
  runtime.snaps += 1

  const runoff = runoffFor(runtime, result, intent, side, before)
  runtime.clockRunning = runoff > 0
  runtime.recorder?.record({
    kind: 'snap',
    offense: side,
    at: situation(before),
    playType: intent.playType,
    tempo: intent.tempo,
    drainClock: intent.drainClock,
    forceBall: intent.forceBall,
    noHuddle: intent.noHuddle,
    result: {
      ...result,
      players: { ...result.players },
      ...(result.penalty === undefined ? {} : { penalty: { ...result.penalty } }),
    },
    runoff,
    timeoutsHomeAfter: runtime.context.timeoutsHome,
    timeoutsAwayAfter: runtime.context.timeoutsAway,
  })
  consumeClock(runtime, result.clockUsed + runoff, side)

  // NFLVERSE S2: safeties by the real rate per snap from the offence's own 10 (see TUNING.scoring).
  const backedUp = TUNING.scoring.safetyYardLines.findIndex((limit) => before.yardLine <= limit)
  if (backedUp >= 0 && runtime.rng.chance(TUNING.scoring.safetyRate[backedUp] as number)) {
    safety(runtime, side)
    return
  }

  if (result.type === 'penalty') {
    runtime.context.yardLine = clamp(runtime.context.yardLine + result.yards, 1, TUNING.football.fieldLength)
    runtime.context.toGo = Math.max(1, runtime.context.toGo - result.yards)
    if (result.isFirstDown) {
      runtime.context.down = 1
      runtime.context.toGo = Math.min(TUNING.football.firstDownYards, TUNING.football.fieldLength - runtime.context.yardLine)
    }
    updateRedZone(runtime, side, before.yardLine)
    return
  }

  runtime.context.yardLine = clamp(runtime.context.yardLine + result.yards, 0, TUNING.football.fieldLength)
  runtime.context.toGo -= result.yards
  updateRedZone(runtime, side, before.yardLine)

  if (result.isTouchdown || runtime.context.yardLine >= TUNING.football.fieldLength) {
    touchdown(runtime, side)
    return
  }
  if (result.isTurnover) {
    const returnChance = result.type === 'int'
      ? TUNING.scoring.interceptionReturnTouchdown
      : TUNING.scoring.fumbleReturnTouchdown
    if (runtime.rng.chance(returnChance)) {
      returnTouchdown(runtime, defense)
      return
    }
    changePossession(runtime, TUNING.football.fieldLength - runtime.context.yardLine, 'turnover')
    return
  }
  if (result.isFirstDown || runtime.context.toGo <= 0) {
    runtime.context.down = 1
    runtime.context.toGo = Math.min(TUNING.football.firstDownYards, TUNING.football.fieldLength - runtime.context.yardLine)
    return
  }
  runtime.context.down += 1
  if (runtime.context.down > TUNING.football.downs) {
    changePossession(runtime, TUNING.football.fieldLength - runtime.context.yardLine, 'downs')
  }
}

function fieldGoalRate(distance: number, kicker: Player, weather: Weather): number {
  const bucketIndex = TUNING.kicking.distanceBuckets.findIndex((limit) => distance < limit)
  const rateIndex = bucketIndex < 0 ? TUNING.kicking.distanceRates.length - 1 : bucketIndex
  const base = TUNING.kicking.distanceRates[rateIndex] as number
  const rating = (kicker.ratings.kickAccuracy - TUNING.roster.starterMean) / TUNING.kicking.ratingEffectDivisor
  const weatherPenalty = weather.indoor ? 0 : weather.windMph * TUNING.kicking.windPenaltyPerMph
  return clamp(base + rating - weatherPenalty, TUNING.kicking.minAttemptRate, TUNING.kicking.maxAttemptRate)
}

function maxFieldGoalDistance(kicker: Player): number {
  return TUNING.kicking.baseMaxDistance + Math.round((kicker.ratings.kickPower - TUNING.kicking.powerBaseline) / TUNING.kicking.powerDistanceDivisor)
}

function attemptFieldGoal(runtime: Runtime, side: Side, late: boolean): void {
  const chart = sideChart(runtime, side)
  const kicker = chart.get('K')
  const distance = TUNING.football.fieldLength - runtime.context.yardLine + TUNING.football.endZoneAndHoldYards
  const made = runtime.rng.chance(fieldGoalRate(distance, kicker, runtime.context.weather))
  runtime.recorder?.record({ kind: 'fieldGoal', offense: side, at: situation(runtime.context), distance, made, late })
  recordFieldGoal(sideStats(runtime, side), made)
  consumeClock(runtime, TUNING.clock.fieldGoalSeconds, side)
  if (made) {
    setScore(runtime, side, TUNING.football.fieldGoalPoints)
    overtimePossessionEnded(runtime, side)
    if (!runtime.finished) kickoff(runtime, otherSide(side), 'fieldGoal')
  } else {
    changePossession(runtime, TUNING.football.fieldLength - runtime.context.yardLine, 'missedFieldGoal')
  }
}

/** The landing spot's mean distance from the goal line for a punt snapped `yardsToGoal` away. */
function puntLandingMean(yardsToGoal: number): number {
  const { snapMean, landingMean } = TUNING.kicking.punt
  if (yardsToGoal <= (snapMean[0] as number)) return landingMean[0] as number
  for (let index = 1; index < snapMean.length; index += 1) {
    const high = snapMean[index] as number
    if (yardsToGoal <= high) {
      const low = snapMean[index - 1] as number
      const from = landingMean[index - 1] as number
      return from + ((yardsToGoal - low) / (high - low)) * ((landingMean[index] as number) - from)
    }
  }
  return landingMean[landingMean.length - 1] as number
}

/**
 * NFLVERSE S2 — a punt, DERIVED by yards to the goal line at the snap: the share of touchbacks,
 * fair catches and returns (downed and out-of-bounds punts are returns of 0 yards), how far out
 * the rest come down, and the return.
 */
function punt(runtime: Runtime, side: Side): void {
  // Captured before the clock runs, because at the end of the first half consuming it kicks off
  // the second half and changes the situation underneath this punt.
  const before = runtime.recorder === undefined ? null : situation(runtime.context)
  const table = TUNING.kicking.punt
  const yardsToGoal = TUNING.football.fieldLength - runtime.context.yardLine
  const cell = cellOf(table.yardsToGoal, yardsToGoal)
  const punter = sideChart(runtime, side).get('P')
  const ratingBonus = (punter.ratings.kickPower - TUNING.roster.starterMean) / TUNING.football.overtimePossessionsRequired
  const roll = runtime.rng.next()
  const touchbackRate = table.touchbackRate[cell] as number
  if (roll < touchbackRate) {
    const drawn = Math.round(clamp(runtime.rng.gauss((table.grossMean[cell] as number) + ratingBonus, table.grossSd[cell] as number), TUNING.kicking.puntMin, TUNING.kicking.puntMax))
    const gross = Math.max(drawn, yardsToGoal)
    recordPunt(sideStats(runtime, side), gross)
    consumeClock(runtime, TUNING.clock.puntSeconds, side)
    if (before !== null) runtime.recorder?.record({ kind: 'punt', offense: side, at: before, gross, touchback: true, fairCatch: false, returnYards: 0, returnTouchdown: false })
    changePossession(runtime, TUNING.football.puntTouchbackSpot, 'punt')
    return
  }
  // Not a touchback: the ball comes down in the field of play, a better punter's further out.
  const landingToGoal = clamp(Math.round(runtime.rng.gauss(puntLandingMean(yardsToGoal) - ratingBonus, table.landingSd[cell] as number)), 1, yardsToGoal - 1)
  const gross = yardsToGoal - landingToGoal
  recordPunt(sideStats(runtime, side), gross)
  consumeClock(runtime, TUNING.clock.puntSeconds, side)
  const fairCatch = roll < touchbackRate + (table.fairCatchRate[cell] as number)
  if (!fairCatch && runtime.rng.chance(table.returnTouchdownRate)) {
    if (before !== null) runtime.recorder?.record({ kind: 'punt', offense: side, at: before, gross, touchback: false, fairCatch: false, returnYards: TUNING.football.fieldLength - landingToGoal, returnTouchdown: true })
    overtimePossessionEnded(runtime, side)
    if (!runtime.finished) specialTeamsTouchdown(runtime, otherSide(side), 'returnTouchdown')
    return
  }
  const returnYards = fairCatch ? 0 : Math.round(quantileAt(table.returnYards, runtime.rng.next()))
  const start = clamp(landingToGoal + returnYards, 1, TUNING.football.fieldLength - 1)
  if (before !== null) runtime.recorder?.record({ kind: 'punt', offense: side, at: before, gross, touchback: false, fairCatch, returnYards: start - landingToGoal, returnTouchdown: false })
  changePossession(runtime, start, 'punt')
}

/**
 * NFLVERSE S2 — the fourth-down call, DERIVED from 2023-2025 play-by-play: P(go) by distance to go
 * and yards to the goal line (or, in the last five minutes, by the deficit and whether a kick is in
 * range), then P(field goal | not going), otherwise a punt. A kick beyond the kicker's range is a
 * punt. The club's `aggressiveness` moves its go rate around the league's, in logits.
 */
function fourthDownCall(runtime: Runtime, side: Side): 'go' | 'fieldGoal' | 'punt' {
  const table = TUNING.kicking.fourthDown
  const team = sideTeam(runtime, side)
  const yardsToGoal = TUNING.football.fieldLength - runtime.context.yardLine
  const late = runtime.context.quarter === TUNING.football.downs && runtime.context.clock <= TUNING.clock.lateGameSeconds
  const deficit = -scoreDifference(runtime, side)
  let go: number
  let fieldGoal: number
  if (late) {
    const zone = cellOf(table.lateYardsToGoal, yardsToGoal)
    if (deficit > 0) {
      const row = cellOf(table.lateDeficits, deficit)
      go = table.lateGoRate[row]?.[zone] as number
      fieldGoal = table.lateFieldGoalShare[row]?.[zone] as number
    } else {
      go = table.lateLevelGoRate[zone] as number
      fieldGoal = table.lateLevelFieldGoalShare[zone] as number
    }
  } else {
    const row = cellOf(table.toGo, runtime.context.toGo)
    const zone = cellOf(table.yardsToGoal, yardsToGoal)
    go = table.goRate[row]?.[zone] as number
    fieldGoal = table.fieldGoalShare[row]?.[zone] as number
  }
  const bound = TUNING.kicking.goRateBound
  const logit = Math.log(clamp(go, bound, 1 - bound) / (1 - clamp(go, bound, 1 - bound)))
    + TUNING.kicking.goAggressionLogit * (team.scheme.aggressiveness - TUNING.coach.neutral) / TUNING.coach.profileSd
  if (runtime.rng.chance(1 / (1 + Math.exp(-logit)))) return 'go'
  const kicker = sideChart(runtime, side).get('K')
  const inRange = yardsToGoal + TUNING.football.endZoneAndHoldYards <= maxFieldGoalDistance(kicker)
  return inRange && runtime.rng.chance(fieldGoal) ? 'fieldGoal' : 'punt'
}

function handleFourthDown(runtime: Runtime): void {
  const side = runtime.context.possession
  const team = sideTeam(runtime, side)
  const chart = sideChart(runtime, side)
  const call = fourthDownCall(runtime, side)
  if (call === 'go') {
    const intent = selectPlay(team.scheme, runtime.context, side === 'home', runtime.rng)
    const result = resolvePlay(chart, sideChart(runtime, otherSide(side)), intent, runtime.context, side === 'home', runtime.rng)
    applyScrimmage(runtime, result, intent)
  } else if (call === 'fieldGoal') {
    attemptFieldGoal(runtime, side, false)
  } else {
    punt(runtime, side)
  }
}

function shouldAttemptLateFieldGoal(runtime: Runtime, side: Side): boolean {
  const difference = scoreDifference(runtime, side)
  if (runtime.overtime) {
    if (runtime.overtimePossessions.size < TUNING.football.overtimePossessionsRequired
      || difference !== 0
      || runtime.context.clock > TUNING.kicking.overtimeLateKickClock) return false
  } else {
    // NFLVERSE final fit: the last play of regulation (TUNING.kicking.lastPlayKickClock), or a
    // running clock that one play clock takes down to it: the offence lets it run and kicks.
    const lastPlay = runtime.context.clock <= TUNING.kicking.lastPlayKickClock
      || (runtime.clockRunning && runtime.context.clock <= TUNING.kicking.lastPlayKickClock + TUNING.clock.playClockNormal)
    if (runtime.context.quarter !== TUNING.football.downs || !lastPlay) return false
  }
  if (difference > 0 || difference < -TUNING.football.fieldGoalPoints) return false
  const kicker = sideChart(runtime, side).get('K')
  const distance = TUNING.football.fieldLength - runtime.context.yardLine + TUNING.football.endZoneAndHoldYards
  return distance <= maxFieldGoalDistance(kicker)
}

function attemptLateFieldGoal(runtime: Runtime, side: Side): void {
  const drain = Math.max(0, runtime.context.clock - TUNING.kicking.lateKickRemainingClock)
  if (drain > 0) consumeClock(runtime, drain, side)
  attemptFieldGoal(runtime, side, true)
}

function kneelResult(runtime: Runtime): PlayResult {
  const quarterback = sideChart(runtime, runtime.context.possession).get('QB')
  return {
    yards: -1,
    clockUsed: TUNING.clock.snapToWhistleMin,
    type: 'kneel',
    isTurnover: false,
    isTouchdown: false,
    isFirstDown: false,
    outOfBounds: false,
    players: { rusher: quarterback.id },
    desc: `${quarterback.lastName} kneels`,
  }
}

/**
 * NFLVERSE S3 — kneel it out. In the fourth quarter a leading offence kneels once the snaps it has
 * left, less the opponent's timeouts, would each burn `kneelSeconds`; at the end of the first half an
 * offence in its own half kneels inside `halfKneelClock`.
 */
function canKneel(runtime: Runtime, side: Side): boolean {
  const { quarter, clock, down, yardLine } = runtime.context
  if (quarter === TUNING.football.firstHalfFinalQuarter) {
    return clock <= TUNING.clock.halfKneelClock && yardLine < TUNING.clock.halfKneelYardLine && down < TUNING.football.downs
  }
  if (quarter !== TUNING.football.downs || scoreDifference(runtime, side) <= 0) return false
  const opponentTimeouts = side === 'home' ? runtime.context.timeoutsAway : runtime.context.timeoutsHome
  const kneelsLeft = TUNING.football.downs - down
  return clock <= Math.max(0, kneelsLeft - opponentTimeouts) * TUNING.clock.kneelSeconds
}

function spikeResult(runtime: Runtime): PlayResult {
  const quarterback = sideChart(runtime, runtime.context.possession).get('QB')
  return {
    yards: 0,
    clockUsed: TUNING.clock.spikeSeconds,
    type: 'spike',
    isTurnover: false,
    isTouchdown: false,
    isFirstDown: false,
    outOfBounds: false,
    players: { passer: quarterback.id },
    desc: `${quarterback.lastName} spikes the ball`,
  }
}

/** NFLVERSE S3 — a hurrying offence with no timeouts spikes to stop a running clock. */
function shouldSpike(runtime: Runtime, side: Side): boolean {
  const { quarter, clock, down } = runtime.context
  const timeouts = side === 'home' ? runtime.context.timeoutsHome : runtime.context.timeoutsAway
  const hurrying = quarter === TUNING.football.firstHalfFinalQuarter
    || (quarter === TUNING.football.downs && scoreDifference(runtime, side) <= 0)
  return hurrying && runtime.clockRunning && timeouts === 0 && clock <= TUNING.clock.spikeClock
    && down < TUNING.football.downs - 1 && runtime.rng.chance(TUNING.clock.spikeChance)
}

function runCurrentPeriod(runtime: Runtime): void {
  while (!runtime.finished && runtime.snaps < TUNING.season.maximumGameSnaps) {
    // A period ends once the play that ran its clock out is resolved, so the half's last play counts
    // in the first half and the second half opens with its own kickoff on first down. (Before, the
    // period turned inside the clock runoff, ahead of the play's yards, downs and turnovers.)
    if (runtime.context.clock === 0) {
      if (runtime.overtime || runtime.context.quarter >= TUNING.football.downs) return
      transitionPeriod(runtime)
    }
    const side = runtime.context.possession
    if (shouldAttemptLateFieldGoal(runtime, side)) {
      attemptLateFieldGoal(runtime, side)
    } else if (canKneel(runtime, side)) {
      const intent: PlayIntent = {
        playType: 'insideRun', riskTolerance: 0, tempo: 0, forceBall: false,
        drainClock: true, noHuddle: false, maxReads: 1,
      }
      applyScrimmage(runtime, kneelResult(runtime), intent)
    } else if (shouldSpike(runtime, side)) {
      const intent: PlayIntent = {
        playType: 'shortPass', riskTolerance: 0, tempo: TUNING.coach.turboTempo, forceBall: false,
        drainClock: false, noHuddle: false, maxReads: 1,
      }
      applyScrimmage(runtime, spikeResult(runtime), intent)
    } else if (runtime.context.down === TUNING.football.downs) {
      handleFourthDown(runtime)
    } else {
      const team = sideTeam(runtime, side)
      const intent = selectPlay(team.scheme, runtime.context, side === 'home', runtime.rng)
      const result = resolvePlay(sideChart(runtime, side), sideChart(runtime, otherSide(side)), intent, runtime.context, side === 'home', runtime.rng)
      applyScrimmage(runtime, result, intent)
    }
  }
}

export function generateWeather(stadium: Stadium, rng: RNG): Weather {
  if (stadium.roof === 'dome' || stadium.roof === 'closed') {
    return { tempF: TUNING.weather.indoorTemp, windMph: TUNING.weather.indoorWind, precip: 'none', indoor: true }
  }
  const mean = stadium.climate === 'cold' ? TUNING.weather.coldMean
    : stadium.climate === 'cool' ? TUNING.weather.coolMean
      : stadium.climate === 'warm' ? TUNING.weather.warmMean
        : stadium.climate === 'hot' ? TUNING.weather.hotMean
          : TUNING.weather.mildMean
  const tempF = Math.round(rng.gauss(mean, TUNING.weather.tempSd))
  const windMph = Math.round(clamp(rng.gauss(TUNING.weather.windMean, TUNING.weather.windSd), TUNING.weather.windMin, TUNING.weather.windMax))
  const precip = tempF <= TUNING.weather.snowTemperature && rng.chance(TUNING.weather.snowChanceCold)
    ? 'snow'
    : rng.chance(TUNING.weather.rainChance) ? 'rain' : 'none'
  return { tempF, windMph, precip, indoor: false }
}

export function simulateGame(
  home: Team,
  away: Team,
  players: readonly Player[],
  scheduleGame: ScheduleGame,
  weather: Weather,
  rng: RNG,
  recorder?: PlayRecorder,
): GameResult {
  const firstHalfReceiver: Side = rng.chance(TUNING.coach.neutral) ? 'home' : 'away'
  const context: GameContext = {
    homeScore: 0,
    awayScore: 0,
    quarter: 1,
    clock: TUNING.football.quarterSeconds,
    down: 1,
    toGo: TUNING.football.firstDownYards,
    yardLine: TUNING.football.kickoffTouchbackSpot,
    possession: firstHalfReceiver,
    weather,
    // A labeled fork keeps the pre-existing play stream stable. One draw per game, shared by
    // both teams, in yards of drive-starting field position. Distinct from weather, which is
    // already modeled.
    tempoEnvironment: rng.fork('scoring-environment').gauss(
      0,
      TUNING.scoring.gameScriptTempoSd,
    ),
    crowdFactor: TUNING.homeField.crowdFactor,
    isTwoMinute: false,
    timeoutsHome: TUNING.football.startingTimeouts,
    timeoutsAway: TUNING.football.startingTimeouts,
  }
  const runtime: Runtime = {
    context,
    home,
    away,
    // Stage 3 (DEPTH W1): each side's form draws on labelled forks, so the play stream is untouched.
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
    recorder,
  }
  recorder?.record({
    kind: 'gameStart', gameId: scheduleGame.id, week: scheduleGame.week, homeTeamId: home.id, awayTeamId: away.id,
    weather: { ...weather }, receiving: firstHalfReceiver, yardLine: context.yardLine,
  })
  kickoff(runtime, firstHalfReceiver, 'opening')

  while (runtime.context.quarter <= TUNING.football.downs && runtime.context.clock > 0 && !runtime.finished) runCurrentPeriod(runtime)

  if (runtime.context.homeScore === runtime.context.awayScore) {
    runtime.overtime = true
    runtime.context.quarter = TUNING.football.downs + 1
    runtime.context.clock = TUNING.football.overtimeSeconds
    runtime.context.isTwoMinute = false
    runtime.context.timeoutsHome = TUNING.football.startingTimeouts
    runtime.context.timeoutsAway = TUNING.football.startingTimeouts
    kickoff(runtime, rng.chance(TUNING.coach.neutral) ? 'home' : 'away', 'overtime')
    runCurrentPeriod(runtime)
  }
  recorder?.record({ kind: 'gameEnd', homeScore: runtime.context.homeScore, awayScore: runtime.context.awayScore, overtime: runtime.overtime })

  return {
    id: scheduleGame.id,
    week: scheduleGame.week,
    homeTeamId: home.id,
    awayTeamId: away.id,
    homeScore: runtime.context.homeScore,
    awayScore: runtime.context.awayScore,
    overtime: runtime.overtime,
    tie: runtime.context.homeScore === runtime.context.awayScore,
    homeStats: runtime.stats.home,
    awayStats: runtime.stats.away,
    playerStats: playerStatLines(runtime.stats),
  }
}
