import { cellOf } from './distributions'
import type { RNG } from './rng'
import { TUNING } from './tuning'
import type { CoachProfile, GameContext, PlayIntent, PlayType } from './types'

function scoreDiff(context: GameContext, isHome: boolean): number {
  return isHome ? context.homeScore - context.awayScore : context.awayScore - context.homeScore
}

function urgency(context: GameContext, isHome: boolean): number {
  const difference = scoreDiff(context, isHome)
  // Overtime inverts the regulation rule. In regulation a tie-or-lead means "protect what you
  // have", so urgency is low. In overtime the clock running out on a tie is NOT a win — it is a
  // tie — so a level score is near-maximum urgency. Treating it as comfortable made both teams
  // play out ten minutes at walking pace and drove the tie rate to ~3x the real NFL figure.
  if (context.quarter > TUNING.football.downs) {
    if (difference < 0) return TUNING.coach.urgencyFourthQuarter
    if (difference === 0) return TUNING.coach.urgencyOvertimeTied
    return TUNING.coach.urgencyBase
  }
  if (difference >= 0) return TUNING.coach.urgencyBase
  const timeFactor = context.quarter === TUNING.football.downs
    ? TUNING.coach.urgencyFourthQuarter
    : context.quarter === TUNING.coach.lateQuarter
      ? TUNING.coach.urgencyThirdQuarter
      : 0
  if (difference >= -TUNING.coach.urgencyCloseDeficit && timeFactor === TUNING.coach.urgencyFourthQuarter) return TUNING.coach.urgencyFourthQuarter
  return TUNING.coach.urgencyMid * timeFactor
}

function selectPassType(coach: CoachProfile, context: GameContext, need: number, rng: RNG): PlayType {
  const zoneFactor = TUNING.passing.routeZoneFactor[cellOf(TUNING.passing.routeZones, TUNING.football.fieldLength - context.yardLine)] as readonly number[]
  let screen = TUNING.passing.routeWeights.screen * TUNING.coach.weightScale
  let short = TUNING.passing.routeWeights.short * TUNING.coach.weightScale
  let medium = TUNING.passing.routeWeights.medium * TUNING.coach.weightScale
  let deep = TUNING.passing.routeWeights.deep * TUNING.coach.weightScale

  deep += coach.aggressiveness * TUNING.coach.aggressionDeepScale
  if (coach.riskTolerance < TUNING.coach.conservativeThreshold) {
    screen += TUNING.coach.conservativeSafeBonus
    short += TUNING.coach.conservativeSafeBonus
    deep -= TUNING.coach.conservativeDeepPenalty
  }
  if (coach.trustInQB < TUNING.coach.lowTrustThreshold) {
    deep = 0
    medium -= TUNING.coach.lowTrustMediumPenalty
    screen += TUNING.coach.lowTrustScreenBonus
  }
  if (need > TUNING.coach.urgencyDeepThreshold) {
    short -= TUNING.coach.urgencyShortPenalty
    deep += TUNING.coach.urgencyDeepBonus
  }
  // NFLVERSE final fit: depth by down and distance (passing.routeSituationFactor), as by field zone.
  const cell = (Math.min(context.down, TUNING.football.downs - 1) - 1) * TUNING.passing.situationToGo.length
    + cellOf(TUNING.passing.situationToGo, context.toGo)
  const situation = TUNING.passing.routeSituationFactor[cell] as readonly number[]
  const choices: readonly [PlayType, number][] = [
    ['screen', screen * (zoneFactor[0] as number) * (situation[0] as number)],
    ['shortPass', short * (zoneFactor[1] as number) * (situation[1] as number)],
    ['mediumPass', medium * (zoneFactor[2] as number) * (situation[2] as number)],
    ['deepPass', deep * (zoneFactor[3] as number) * (situation[3] as number)],
  ]
  const total = choices.reduce((sum, choice) => sum + Math.max(0, choice[1]), 0)
  let roll = rng.next() * total
  for (const choice of choices) {
    roll -= Math.max(0, choice[1])
    if (roll <= 0) return choice[0]
  }
  return 'shortPass'
}

/**
 * Stage 3: a draw is the long-yardage call on a later down (its distance bonus fired on every 1st
 * and 10 too, so most first-down runs were draws and 13% of designed runs went outside against a
 * real 49%). Otherwise the run goes outside at the real share for the field zone, tilted by an
 * aggressive coach.
 */
function selectRunType(coach: CoachProfile, context: GameContext, rng: RNG): PlayType {
  const rules = TUNING.coach
  if (context.down > 1 && context.toGo > rules.drawDistance) return 'draw'
  const share = context.yardLine >= TUNING.scoring.redZoneLine ? rules.outsideRunShare.redZone : rules.outsideRunShare.open
  const logit = Math.log(share / (1 - share)) - rules.outsideRunLogitOffset
    + (coach.aggressiveness > rules.aggressiveThreshold ? rules.outsideAggressiveLogit : 0)
  return rng.chance(1 / (1 + Math.exp(-logit))) ? 'outsideRun' : 'insideRun'
}

/**
 * NFLVERSE S3 — the real call model: the log-odds of a dropback, from down and distance, the time
 * and score, and the field zone (TUNING.coach.call, FITTED to every real call). Pure.
 */
export function dropbackLogit(context: GameContext, isHome: boolean): number {
  const call = TUNING.coach.call
  const down = Math.min(TUNING.football.downs, Math.max(1, context.down)) - 1
  // The time window by name, so the order of `call.times` in tuning.ts is the only one.
  const window = context.quarter === TUNING.football.firstHalfFinalQuarter && context.clock <= TUNING.football.twoMinuteSeconds
    ? 'halfEnd'
    : context.quarter >= TUNING.football.downs ? (context.clock <= TUNING.clock.lateGameSeconds ? 'q4Late' : 'q4') : 'early'
  const time = call.times.indexOf(window)
  return (call.base[down]?.[cellOf(call.toGo, context.toGo)] as number)
    + (call.state[time]?.[cellOf(call.leads, scoreDiff(context, isHome))] as number)
    + (call.zone[cellOf(call.zones, context.yardLine)] as number)
}

export function selectPlay(coach: CoachProfile, context: GameContext, isHome: boolean, rng: RNG): PlayIntent {
  const need = urgency(context, isHome)
  // A coach's pass bias is his deviation from the league: pass rate over expected, in logits.
  const share = TUNING.coach.passPlayShare
  const passLogit = dropbackLogit(context, isHome) + (coach.passBias - share) / (share * (1 - share))
  const passProbability = 1 / (1 + Math.exp(-passLogit))
  const difference = scoreDiff(context, isHome)
  const playType = rng.chance(passProbability) ? selectPassType(coach, context, need, rng) : selectRunType(coach, context, rng)
  // A lead of more than drainLead drains the clock all through the fourth quarter, and any lead does
  // in its last five minutes (NFLVERSE final fit: real leading offences there take 35.4-37.1 s from
  // a run to the next snap, tied ones 31.5 and trailing ones 28.7-29.8).
  const drainClock = context.quarter === TUNING.football.downs
    && (difference > TUNING.coach.drainLead || (difference > 0 && context.clock <= TUNING.clock.lateGameSeconds))
  let riskTolerance = Math.round(coach.riskTolerance * TUNING.coach.riskScale)
  if (context.down === TUNING.coach.lateQuarter && context.toGo > TUNING.coach.desperateDistance) riskTolerance += TUNING.coach.desperateRiskBonus
  if (context.yardLine >= TUNING.scoring.redZoneLine) riskTolerance -= TUNING.coach.redZoneRiskPenalty
  let tempo = Math.round(coach.tempo * TUNING.coach.riskScale)
  if (difference < -TUNING.coach.lateDeficit && context.quarter === TUNING.football.downs && context.clock < TUNING.coach.twoScoreHurryClock) tempo = TUNING.coach.turboTempo
  if (drainClock) tempo = TUNING.coach.drainTempo
  // Overtime at a level score is a ten-minute two-minute drill. The turbo rule above is gated on
  // quarter === 4 and so never fires in overtime, which left both teams walking through the
  // period at normal pace and running the clock out tied.
  if (context.quarter > TUNING.football.downs && difference === 0) tempo = TUNING.coach.turboTempo
  // Same blind spot in regulation: the turbo rule needs a deficit of more than 8, so a team TIED
  // inside two minutes of the fourth quarter played at walking pace and let the clock expire
  // rather than driving for the win. Real teams play for the win and treat overtime as a coin
  // flip. (NFLVERSE final fit: real tied offences there take 12.6 s between snaps, trailing ones
  // 11.4-11.8 and leading ones 21.6-22.4; between 2:00 and 5:00 a tied one takes 25.7, no hurry.)
  if (context.quarter === TUNING.football.downs
    && difference === 0
    && context.clock < TUNING.football.twoMinuteSeconds) tempo = TUNING.coach.turboTempo
  // NFLVERSE S3: every offence hurries in the last two minutes of the first half, and a trailing
  // one in the last two minutes of the game (real seconds between snaps 11.8 there, 31.3 neutral).
  if (context.quarter === TUNING.football.firstHalfFinalQuarter && context.clock <= TUNING.football.twoMinuteSeconds) tempo = TUNING.coach.turboTempo
  if (context.quarter === TUNING.football.downs && difference < 0 && context.clock <= TUNING.football.twoMinuteSeconds) tempo = TUNING.coach.turboTempo
  // In range with a kick that ties or wins, it plays at its own pace for the last kick.
  if (context.quarter === TUNING.football.downs && context.clock <= TUNING.football.twoMinuteSeconds
    && difference <= 0 && difference >= -TUNING.football.fieldGoalPoints && context.yardLine >= TUNING.coach.kickRangeYardLine) {
    tempo = Math.round(coach.tempo * TUNING.coach.riskScale)
  }
  if (drainClock) tempo = TUNING.coach.drainTempo
  // NFLVERSE S3: the no-huddle. A hurrying offence goes without a huddle on a share of its snaps;
  // otherwise at the league rate, moved by the coach's tempo in logits.
  const noHuddleOdds = TUNING.coach.noHuddleRate / (1 - TUNING.coach.noHuddleRate)
    * Math.exp(TUNING.coach.noHuddleTempoLogit * (coach.tempo - TUNING.coach.neutral) / TUNING.coach.profileSd)
  const noHuddle = rng.chance(tempo === TUNING.coach.turboTempo ? TUNING.coach.hurryNoHuddleShare : noHuddleOdds / (1 + noHuddleOdds))
  return {
    playType,
    riskTolerance,
    tempo,
    forceBall: need > TUNING.coach.urgencyHigh
      && context.clock <= TUNING.coach.forceBallClock
      && difference < -TUNING.coach.forceBallDeficit,
    drainClock,
    noHuddle,
    maxReads: coach.trustInQB > TUNING.coach.trustReads ? TUNING.coach.maxReadsTrusted : TUNING.coach.maxReadsSimple,
  }
}
