import { receivingOptions, type DepthChart, type ReceivingOption } from './depthChart'
import { cellOf, quantileAt } from './distributions'
import type { RNG } from './rng'
import { TUNING } from './tuning'
import type { GameContext, Player, PlayIntent, PlayResult } from './types'

type RouteKind = keyof typeof TUNING.passing.completionYards
/** Column of each route in the zone tables (routeZoneFactor, routeZoneCompletion). */
const ROUTE_INDEX: Record<RouteKind, number> = { screen: 0, short: 1, medium: 2, deep: 3 }

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function clockUsed(rng: RNG): number {
  return rng.int(TUNING.clock.snapToWhistleMin, TUNING.clock.snapToWhistleMax)
}

function resultBase(rng: RNG): Pick<PlayResult, 'clockUsed' | 'isTurnover' | 'isTouchdown' | 'isFirstDown' | 'outOfBounds' | 'players'> {
  return { clockUsed: clockUsed(rng), isTurnover: false, isTouchdown: false, isFirstDown: false, outOfBounds: false, players: {} }
}

function average(players: readonly Player[], field: keyof Player['ratings']): number {
  return players.reduce((sum, player) => sum + player.ratings[field], 0) / players.length
}

/** The mean of a player's ratings that a score blends equally. */
function meanOf(...values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

/** The offensive line, left tackle to right tackle. */
function offensiveLine(offense: DepthChart): Player[] {
  return [offense.get('LT'), offense.get('LG'), offense.get('C'), offense.get('RG'), offense.get('RT')]
}

function penaltyResult(offense: DepthChart, context: GameContext, rng: RNG, isHomeOffense: boolean): PlayResult | null {
  const rules = TUNING.penalties
  // NFLVERSE S5: the crowd's penalties fall on the AWAY defence, when the home team has the ball.
  const defenseRate = rules.defensePerSnap + (isHomeOffense ? rules.homeCrowdDefenseBonus * context.crowdFactor : 0)
  // Stage 3 (DEPTH W1): an aware line commits fewer, against the league's reference.
  const offenseRate = rules.offensePerSnap * Math.exp(-rules.awarenessPerPoint * (average(offensiveLine(offense), 'awareness') - rules.awarenessReference))
  const roll = rng.next()
  if (roll >= offenseRate + defenseRate) return null
  const onOffense = roll < offenseRate
  let yards: number
  let automaticFirstDown = false
  if (onOffense) {
    yards = rng.chance(rules.offensivePreSnapShare) ? rules.falseStartYards : rules.holdingYards
  } else if (rng.chance(rules.automaticFirstDownShare)) {
    automaticFirstDown = true
    yards = Math.round(clamp(rng.gauss(rules.passInterferenceMean, rules.passInterferenceSd), rules.passInterferenceMin, rules.passInterferenceMax))
  } else {
    yards = rules.defensiveHoldingYards
  }
  const applied = onOffense ? -yards : yards
  return {
    ...resultBase(rng),
    yards: applied,
    type: 'penalty',
    isFirstDown: automaticFirstDown || (!onOffense && applied >= context.toGo),
    penalty: { yards, onOffense, automaticFirstDown },
    desc: `${onOffense ? 'Offensive' : 'Defensive'} penalty, ${yards} yards`,
  }
}

type CreditKind = 'tackle' | 'sack' | 'interception'
type TackleCategory = keyof typeof TUNING.credit.tackleRoleShares

/** A defender's fitness for a credit, in rating points (TUNING.credit.fitnessPerPoint). */
function creditFitness(player: Player, kind: CreditKind): number {
  const ratings = player.ratings
  if (kind === 'tackle') return meanOf(ratings.tackling, ratings.playRecognition)
  if (kind === 'sack') return meanOf(ratings.passRush, ratings.blockShedding)
  return meanOf(meanOf(ratings.manCoverage, ratings.zoneCoverage), ratings.playRecognition)
}

type RolePool = { players: readonly Player[]; weights: readonly number[]; total: number }

/**
 * Each role's creditable players and their within-role weights (slot snap share x fitness), per
 * depth chart and kind of credit. A chart is built per game and ratings do not move inside a game,
 * so this is memoised on the chart object: the draw below is then a walk over at most 21 numbers.
 */
const creditPools = new WeakMap<DepthChart, Map<CreditKind, readonly RolePool[]>>()

function rolePools(defense: DepthChart, kind: CreditKind): readonly RolePool[] {
  let byKind = creditPools.get(defense)
  if (byKind === undefined) {
    byKind = new Map()
    creditPools.set(defense, byKind)
  }
  const cached = byKind.get(kind)
  if (cached !== undefined) return cached
  const credit = TUNING.credit
  const pools = credit.roles.map((role) => {
    const slots = credit.slotShare[role]
    const players = (defense.byPosition.get(role) ?? []).slice(0, slots.length)
    const weights = players.map((player, slot) =>
      (slots[slot] as number) * Math.exp(credit.fitnessPerPoint * (creditFitness(player, kind) - TUNING.roster.starterMean)))
    return { players, weights, total: weights.reduce((sum, weight) => sum + weight, 0) }
  })
  byKind.set(kind, pools)
  return pools
}

/**
 * Stage 3 (DEPTH W1.2): the defender credited with a tackle, a sack or an interception, from one
 * uniform draw `u`. The role carries its real share of the credit (TUNING.credit, DERIVED); within
 * it, each depth slot its real snap share, scaled by the player's fitness for the credit. A role
 * with nobody at it gives its share to the others.
 */
function creditedDefender(
  defense: DepthChart,
  roleShares: readonly number[],
  kind: CreditKind,
  u: number,
  options: { exclude?: Player; covering?: Player } = {},
): Player {
  const pools = rolePools(defense, kind)
  const adjust = (player: Player): number => player === options.exclude ? 0
    : player === options.covering ? TUNING.credit.coverDefenderInterceptionWeight : 1
  const adjusted = options.exclude === undefined && options.covering === undefined
    ? null
    : pools.map((pool) => pool.weights.map((weight, index) => weight * adjust(pool.players[index] as Player)))
  const roleTotal = (index: number): number => adjusted === null
    ? (pools[index] as RolePool).total
    : (adjusted[index] as number[]).reduce((sum, weight) => sum + weight, 0)
  const totals = pools.map((_, index) => roleTotal(index))
  const mass = pools.reduce((sum, _, index) => sum + ((totals[index] as number) > 0 ? roleShares[index] as number : 0), 0)
  if (mass <= 0) return options.covering ?? defense.getGroup('DB', TUNING.roster.depth.starter)
  let roll = u * mass
  let last: Player | null = null
  for (let role = 0; role < pools.length; role += 1) {
    const total = totals[role] as number
    if (total <= 0) continue
    const pool = pools[role] as RolePool
    const weights = adjusted === null ? pool.weights : adjusted[role] as number[]
    for (let index = 0; index < pool.players.length; index += 1) {
      const weight = (roleShares[role] as number) * (weights[index] as number) / total
      if (weight <= 0) continue
      last = pool.players[index] as Player
      roll -= weight
      if (roll <= 0) return last
    }
  }
  return last as Player
}

/** The tackler, and on a shared tackle the assister, for a carrier brought down (DEPTH W1.2). */
function tacklers(defense: DepthChart, category: TackleCategory, rng: RNG): { tackler: Player; assister: Player | null } {
  const shares = TUNING.credit.tackleRoleShares[category]
  const tackler = creditedDefender(defense, shares, 'tackle', rng.next())
  const assister = rng.chance(TUNING.credit.assistedTackleShare[category])
    ? creditedDefender(defense, shares, 'tackle', rng.next(), { exclude: tackler })
    : null
  return { tackler, assister: assister === tackler ? null : assister }
}

/** Credit ids for a carrier brought down: none on a touchdown. */
function tackleCredit(credited: { tackler: Player; assister: Player | null }, touchdown: boolean): PlayResult['players'] {
  if (touchdown) return {}
  return credited.assister === null ? { tackler: credited.tackler.id } : { tackler: credited.tackler.id, assister: credited.assister.id }
}

/**
 * Stage 3 (DEPTH W1 `consistency`): a player's usage this game, exp(sd x z - sd^2 / 2) from his
 * form draw z, mean 1. The sd widens as his consistency falls below a starter's
 * (roster.starterMean + consistencyOffset). Outside a game there are no draws.
 */
function usageForm(chart: DepthChart, player: Player, sd: number): number {
  const z = chart.form.get(player.id)
  if (z === undefined) return 1
  const reference = TUNING.roster.starterMean + TUNING.roster.consistencyOffset
  const spread = sd * Math.exp(TUNING.usage.consistencyPerPoint * (reference - player.ratings.consistency))
  return Math.exp(spread * z - spread * spread / 2)
}

/**
 * Scales each weight by its player's form this game, then each group back to its total: form moves
 * usage between a group's players from game to game, never between groups, so the groups' real
 * shares hold on every play and only who in the group gets them swings.
 */
function applyForm(chart: DepthChart, items: { player: Player; group: string; weight: number }[], sd: number): void {
  const totals = new Map<string, { before: number; after: number }>()
  for (const item of items) {
    const total = totals.get(item.group) ?? { before: 0, after: 0 }
    total.before += item.weight
    item.weight *= usageForm(chart, item.player, sd)
    total.after += item.weight
    totals.set(item.group, total)
  }
  for (const item of items) {
    const total = totals.get(item.group) as { before: number; after: number }
    if (total.after > 0) item.weight *= total.before / total.after
  }
}

type CarryGroup = 'RB' | 'QB' | 'WR'
/** A designed run's cell: 3rd/4th and short, inside the goal-line cut, or its call's direction. */
type CarryCell = 'shortYardage' | 'goalLine' | 'inside' | 'outside'
/** Fitness score columns in usage.carryFitnessReference: inside, outside, draw, power. */
const CARRY_SCORE = { inside: 0, outside: 1, draw: 2, power: 3 } as const
type CarryScore = keyof typeof CARRY_SCORE

function carryCell(intent: PlayIntent, context: GameContext): CarryCell {
  if (context.down >= TUNING.football.downs - 1 && context.toGo <= TUNING.rushing.shortYardageToGo) return 'shortYardage'
  if (context.yardLine >= TUNING.football.fieldLength - TUNING.usage.goalLineYards) return 'goalLine'
  return intent.playType === 'outsideRun' ? 'outside' : 'inside'
}

function isPowerCell(cell: CarryCell): boolean {
  return cell === 'shortYardage' || cell === 'goalLine'
}

/** The carry score a run reads: power at the goal line and in short yardage, else its call's. */
function runScore(intent: PlayIntent, cell: CarryCell): CarryScore {
  if (isPowerCell(cell)) return 'power'
  return intent.playType === 'draw' ? 'draw' : intent.playType === 'outsideRun' ? 'outside' : 'inside'
}

/** Stage 3 (DEPTH W4): a carrier's fitness score for a run, in rating points (DEPTH W4's table). */
function carryScore(player: Player, score: CarryScore): number {
  const ratings = player.ratings
  switch (score) {
    case 'inside': return meanOf(ratings.strength, ratings.breakTackle, ratings.carrying, ratings.vision)
    case 'outside': return meanOf(ratings.speed, ratings.agility, ratings.vision)
    case 'draw': return meanOf(ratings.vision, ratings.agility)
    case 'power': return meanOf(ratings.strength, ratings.breakTackle)
  }
}

function carryFitness(player: Player, group: CarryGroup, score: CarryScore): number {
  const usage = TUNING.usage
  const reference = usage.carryFitnessReference[group][CARRY_SCORE[score]] as number
  return clamp(Math.exp(usage.carryFitnessPerPoint * (carryScore(player, score) - reference)), usage.fitnessMin, usage.fitnessMax)
}

/**
 * Stage 3 (DEPTH W4): who carries a designed run. The quarterback takes his real share of the
 * cell's runs (usage.quarterbackRunShare, DERIVED: the sneak on 3rd and 1), receivers who can
 * carry (carrying and breakTackle at the hybrid threshold) their real share of outside runs, and
 * the backs the rest by depth slot. Everyone's weight is scaled by his fitness for the run, so a
 * mobile quarterback keeps more and a power back gets the goal line, and by his form this game.
 * One draw, as before.
 */
function chooseRusher(chart: DepthChart, intent: PlayIntent, context: GameContext, rng: RNG): { player: Player; group: CarryGroup } {
  const usage = TUNING.usage
  const cell = carryCell(intent, context)
  const power = isPowerCell(cell)
  const backScore = runScore(intent, cell)
  const candidates: { player: Player; group: CarryGroup; weight: number }[] = []
  const quarterback = chart.byPosition.get('QB')?.[TUNING.roster.depth.starter]
  if (quarterback !== undefined) {
    candidates.push({ player: quarterback, group: 'QB', weight: usage.quarterbackRunShare[cell] * carryFitness(quarterback, 'QB', power ? 'power' : 'outside') })
  }
  const receivers = cell === 'outside'
    ? (chart.byPosition.get('WR') ?? []).slice(0, usage.targetSlotWeight.WR.length)
      .filter((player) => player.ratings.carrying >= usage.hybridCarryThreshold && player.ratings.breakTackle >= usage.hybridCarryThreshold)
    : []
  const receiverSlots = receivers.reduce((sum, _, rank) => sum + (usage.targetSlotWeight.WR[rank] as number), 0)
  receivers.forEach((player, rank) => candidates.push({
    player, group: 'WR', weight: usage.receiverOutsideRunShare * (usage.targetSlotWeight.WR[rank] as number) / receiverSlots * carryFitness(player, 'WR', 'outside'),
  }))
  const backs = (chart.byGroup.get('RB') ?? []).slice(0, usage.backCarrySlotWeight.length)
  const backSlots = backs.reduce((sum, _, rank) => sum + (usage.backCarrySlotWeight[rank] as number), 0)
  const backShare = 1 - usage.quarterbackRunShare[cell] - (receivers.length > 0 ? usage.receiverOutsideRunShare : 0)
  backs.forEach((player, rank) => candidates.push({
    player, group: 'RB', weight: backShare * (usage.backCarrySlotWeight[rank] as number) / backSlots * carryFitness(player, 'RB', backScore),
  }))
  applyForm(chart, candidates, usage.formSd.carries)
  const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0)
  if (total <= 0) return { player: chart.getGroup('RB', TUNING.roster.depth.starter), group: 'RB' }
  let roll = rng.next() * total
  for (const candidate of candidates) {
    roll -= candidate.weight
    if (roll <= 0) return { player: candidate.player, group: candidate.group }
  }
  const last = candidates[candidates.length - 1] as { player: Player; group: CarryGroup }
  return { player: last.player, group: last.group }
}

/** Stage 3 (DEPTH W1 `stamina`): the fourth quarter and overtime, when the trenches tire. */
function isLateGame(context: GameContext): boolean {
  return context.quarter >= TUNING.football.downs
}

/** The trenches' stamina edge late in a game, in rating points (0 before the fourth quarter). */
function staminaEdge(context: GameContext, side: readonly Player[], against: readonly Player[]): number {
  return isLateGame(context) ? TUNING.rushing.lateStaminaWeight * (average(side, 'stamina') - average(against, 'stamina')) : 0
}

/** A front defender's run defence: a lineman's shed, a linebacker's read, beside runDefense (DEPTH W1). */
function frontRunDefense(player: Player): number {
  const blend = TUNING.rushing.frontBlend
  const ratings = player.ratings
  return player.position === 'LB'
    ? ratings.runDefense * (1 - blend.playRecognition) + ratings.playRecognition * blend.playRecognition
    : ratings.runDefense * (1 - blend.blockShedding) + ratings.blockShedding * blend.blockShedding
}

function fumbleResult(
  base: PlayResult,
  ballCarrier: Player,
  tackler: Player,
  rng: RNG,
): PlayResult {
  const skillAdjustment = (tackler.ratings.hitPower - ballCarrier.ratings.carrying) / TUNING.rushing.carryingEffectDivisor
  // A fumble is lost when the DEFENCE recovers, so the fumble rate that loses fumbleLostPerPlay is
  // that over the defence's share. (It divided by the offence's share, identical only at 0.5.)
  const fumbleChance = (TUNING.rushing.fumbleLostPerPlay / (1 - TUNING.rushing.fumbleRecoveryOffense)) * TUNING.rushing.fumbleEligibleMultiplier + skillAdjustment
  if (!rng.chance(fumbleChance)) return base
  const lost = !rng.chance(TUNING.rushing.fumbleRecoveryOffense)
  return {
    ...base,
    type: 'fumble',
    isTurnover: lost,
    desc: `${ballCarrier.lastName} fumbles${lost ? ', defense recovers' : ', offense recovers'}`,
  }
}

function resolveRun(offense: DepthChart, defense: DepthChart, intent: PlayIntent, context: GameContext, rng: RNG): PlayResult {
  const carrier = chooseRusher(offense, intent, context, rng)
  const rusher = carrier.player
  const blockers = offensiveLine(offense)
  const front = [defense.get('EDGE', 0), defense.get('EDGE', 1), defense.get('DT', 0), defense.get('LB', 0)]
  const secondLevel = [defense.get('LB', 0), defense.get('LB', 1), defense.get('S', 0), defense.get('S', 1)]
  const redZonePenalty = context.yardLine >= TUNING.scoring.redZoneLine ? TUNING.rushing.redZoneYardsPenalty : 0
  const rules = TUNING.rushing
  // NFLVERSE S5: the front's run defence carries `runDefenseWeight` in the matchup (1 before S5),
  // and the quarterback's accuracy `passThreatWeight`: a passer the defence fears lightens the box.
  const mean = TUNING.roster.starterMean
  const passThreat = offense.get('QB').ratings.throwAccuracy - mean
  const cell = carryCell(intent, context)
  const score = runScore(intent, cell)
  // Stage 3: the carrier's score for this run (DEPTH W4's table: breakTackle and strength inside
  // and at the goal line, speed and agility outside, vision and agility on a draw) reads against
  // the league mean of his group's carries of that kind, plus the group's real yards offset. The
  // front sheds and reads (frontRunDefense), the second level tackles, the line out-muscles the
  // front at the goal line and in short yardage, and late in the game the fresher trench wins.
  const frontDefense = front.reduce((sum, player) => sum + frontRunDefense(player), 0) / front.length
  const powerLine = isPowerCell(cell)
    ? rules.powerLineWeight * (average(blockers, 'strength') - average(front, 'strength') - rules.powerLineCentre)
    : 0
  const matchup = ((average(blockers, 'runBlock') - mean) - rules.runDefenseWeight * (frontDefense - mean)
    + (carryScore(rusher, score) - (TUNING.usage.rusherScoreReference[carrier.group][CARRY_SCORE[score]] as number))
    - rules.tacklingWeight * (average(secondLevel, 'tackling') - rules.tacklingReference)
    + powerLine + staminaEdge(context, blockers, front)
    + rules.passThreatWeight * passThreat) / rules.ratingEffectDivisor - redZonePenalty
    + TUNING.usage.carrierYardsOffset[carrier.group]
  // NFLVERSE S3: the real distribution of a designed run, shifted by the matchup. A fast rusher has
  // an extra chance of a draw from the table's breakaway tail.
  const tail = TUNING.rushing.breakawayTail
  let u = rng.next()
  if (rng.chance(Math.max(0, rusher.ratings.speed - TUNING.roster.starterMean) / TUNING.rushing.carryingEffectDivisor)) u = 1 - tail * rng.next()
  const shortYardage = context.down >= TUNING.football.downs - 1 && context.toGo <= TUNING.rushing.shortYardageToGo
  const table = shortYardage ? TUNING.rushing.shortYardageRunYards : TUNING.rushing.runYards
  const yards = Math.min(Math.round(quantileAt(table, u) + matchup + TUNING.rushing.runShift), TUNING.football.fieldLength - context.yardLine)
  const credited = tacklers(defense, intent.playType === 'outsideRun' ? 'outside' : 'inside', rng)
  const isTouchdown = context.yardLine + yards >= TUNING.football.fieldLength
  const base: PlayResult = {
    ...resultBase(rng),
    yards,
    type: 'run',
    isTouchdown,
    isFirstDown: yards >= context.toGo,
    outOfBounds: rng.chance(TUNING.rushing.outOfBoundsChance),
    players: { rusher: rusher.id, ...tackleCredit(credited, isTouchdown) },
    desc: `${rusher.lastName} runs for ${yards} yards`,
  }
  return fumbleResult(base, rusher, credited.tackler, rng)
}

function routeKind(intent: PlayIntent): RouteKind {
  if (intent.playType === 'screen') return 'screen'
  if (intent.playType === 'shortPass' || intent.playType === 'playAction') return 'short'
  if (intent.playType === 'deepPass') return 'deep'
  return 'medium'
}

/** Stage 3 (DEPTH W4): a receiver's fitness score for a route, in rating points (DEPTH W4's table). */
function routeFitnessScore(player: Player, kind: RouteKind): number {
  const ratings = player.ratings
  switch (kind) {
    case 'screen': return meanOf(ratings.agility, ratings.breakTackle, ratings.catching)
    case 'short': return meanOf(ratings.routeRunning, ratings.catching, ratings.separation)
    case 'medium': return meanOf(ratings.routeRunning, ratings.separation, ratings.catchInTraffic)
    case 'deep': return meanOf(ratings.speed, ratings.separation, ratings.catching)
  }
}

/**
 * Stage 3 (DEPTH W4): who is targeted. One allocation over every receiver on the depth chart:
 * the real share of this depth's targets that go to his group (usage.targetGroupShare), times his
 * depth slot's weight (usage.targetSlotWeight, renormalised over the slots the team fields), times
 * his fitness for the route, exp(k x (score - the group's league mean)), clamped. Over the league
 * the real rank shares come back; a better route runner in the same slot takes more.
 */
type TargetPool = { options: readonly ReceivingOption[]; cumulative: readonly number[] }

/** The allocation's weights depend on the depth chart and the route only: memoised per game's chart. */
const targetPools = new WeakMap<DepthChart, Map<RouteKind, TargetPool>>()

function targetPool(offense: DepthChart, kind: RouteKind): TargetPool {
  let byKind = targetPools.get(offense)
  if (byKind === undefined) {
    byKind = new Map()
    targetPools.set(offense, byKind)
  }
  const cached = byKind.get(kind)
  if (cached !== undefined) return cached
  const usage = TUNING.usage
  const route = ROUTE_INDEX[kind]
  const options = receivingOptions(offense)
  const fielded = { WR: 0, TE: 0, RB: 0 }
  for (const option of options) fielded[option.group] += usage.targetSlotWeight[option.group][option.rank] as number
  const weighted = options.map((option) => {
    const groupShare = usage.targetGroupShare[kind][usage.targetGroups.indexOf(option.group)] as number
    const slotShare = (usage.targetSlotWeight[option.group][option.rank] as number) / fielded[option.group]
    const reference = usage.targetFitnessReference[option.group][route] as number
    const fitness = clamp(Math.exp(usage.targetFitnessPerPoint * (routeFitnessScore(option.player, kind) - reference)), usage.fitnessMin, usage.fitnessMax)
    return { player: option.player, group: option.group, weight: groupShare * slotShare * fitness }
  })
  applyForm(offense, weighted, usage.formSd.targets)
  let running = 0
  const cumulative = weighted.map((item) => {
    running += item.weight
    return running
  })
  const pool = { options, cumulative }
  byKind.set(kind, pool)
  return pool
}

function chooseReceiver(offense: DepthChart, kind: RouteKind, rng: RNG): ReceivingOption {
  const { options, cumulative } = targetPool(offense, kind)
  const roll = rng.next() * (cumulative[cumulative.length - 1] as number)
  for (let index = 0; index < options.length; index += 1) {
    if (roll <= (cumulative[index] as number)) return options[index] as ReceivingOption
  }
  return options[options.length - 1] as ReceivingOption
}

/** The defender who covers a receiver: WRs by rank against CB1-3, the TE a linebacker, a back a safety. */
function coverDefender(defense: DepthChart, option: ReceivingOption): Player {
  const depth = TUNING.roster.depth
  if (option.group === 'WR') return defense.get('CB', Math.min(option.rank, depth.third))
  return defense.get(option.group === 'TE' ? 'LB' : 'S', Math.min(option.rank, depth.second))
}

/** A quarterback rating's factor on a dropback outcome, exp(perPoint x (rating - reference)). */
function ratingFactor(rating: number, reference: number, perPoint: number = TUNING.pressure.ratingPerPoint): number {
  return Math.exp(perPoint * (rating - reference))
}

type DropbackOutcome = 'sack' | 'scramble' | 'throwaway' | 'move' | 'pocket'
const DROPBACK_OUTCOMES: readonly DropbackOutcome[] = ['sack', 'scramble', 'throwaway', 'move', 'pocket']

/**
 * Stage 3 (DEPTH W1.1): what a dropback becomes, from one draw `u`. At a league-average
 * quarterback the shares are the real ones (TUNING.pressure); his ratings move them, and no
 * archetype string is read: pocket sense (processing, poise, awareness) turns sacks into
 * something else, speed into scrambles, reads (processing, awareness) into throwaways, throwOnRun
 * into throws on the move, aggression into throws from a collapsing pocket.
 */
function dropbackOutcome(qb: Player, pressured: boolean, sackShare: number, u: number): DropbackOutcome {
  const rules = TUNING.pressure
  const ratings = qb.ratings
  const speed = Math.min(rules.scrambleFactorMaximum,
    Math.exp((ratings.speed - TUNING.passing.scrambleSpeedReference) / TUNING.passing.scrambleSpeedScale)) / rules.scrambleSpeedMean
  const shares = pressured ? rules.pressuredShares : rules.cleanShares
  const rest = pressured ? 1 - sackShare : 1
  const weights = [
    pressured ? sackShare / ratingFactor(meanOf(ratings.processing, ratings.poise, ratings.awareness), rules.pocketReference, rules.sackRatingPerPoint) : 0,
    rest * (shares[0] as number) * speed,
    rest * (shares[1] as number) * ratingFactor(meanOf(ratings.processing, ratings.awareness), rules.readsReference),
    rest * (shares[2] as number) * ratingFactor(ratings.throwOnRun, rules.throwOnRunReference),
    rest * (shares[3] as number) * (pressured ? ratingFactor(ratings.aggression, rules.aggressionReference) : 1),
  ]
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let roll = u * total
  for (let index = 0; index < weights.length; index += 1) {
    roll -= weights[index] as number
    if (roll <= 0) return DROPBACK_OUTCOMES[index] as DropbackOutcome
  }
  return 'pocket'
}

function resolvePass(
  offense: DepthChart,
  defense: DepthChart,
  intent: PlayIntent,
  context: GameContext,
  isHomeOffense: boolean,
  rng: RNG,
): PlayResult {
  const qb = offense.get('QB')
  const blockers = offensiveLine(offense)
  const rushers = [defense.get('EDGE', 0), defense.get('EDGE', 1), defense.get('DT', 0), defense.get('DT', 1)]
  const protection = average(blockers, 'passBlock')
  // Stage 3 (DEPTH W1): the rush sheds as well as rushes, and late in a game the fresher trench wins.
  const shed = TUNING.passing.rushBlockShedding
  const passRush = average(rushers, 'passRush') * (1 - shed) + average(rushers, 'blockShedding') * shed
  const sackAdjustment = (passRush - protection + staminaEdge(context, rushers, blockers)) / TUNING.passing.ratingEffectDivisor

  const awaySackBonus = isHomeOffense ? 0 : context.crowdFactor * TUNING.homeField.awaySackBonus
  // NFLVERSE final fit: the base rates by down and distance (sacks cluster on 3rd and long).
  const situation = (Math.min(context.down, TUNING.football.downs - 1) - 1) * TUNING.passing.situationToGo.length
    + cellOf(TUNING.passing.situationToGo, context.toGo)
  const baseSackRate = TUNING.passing.sackRatePerDropback * (TUNING.passing.sackSituation[situation] as number)
  // Stage 3 (DEPTH W1.1): sacks come only through pressure. The cell's real pressure rate; a
  // sack's share of a pressure is the fitted sack rate over it; the line matchup (over its league
  // mean, with its fitted weight) and the away crowd move the pressure rate, and through it the
  // sack rate, so a line that holds up cuts sacks by cutting pressure.
  const pressureBase = TUNING.pressure.pressureRate * (TUNING.pressure.pressureSituation[situation] as number)
  const sackShare = clamp(baseSackRate / pressureBase, 0, 1)
  const lineTerm = TUNING.pressure.lineWeight * (sackAdjustment - TUNING.pressure.lineCentre) + awaySackBonus
  const pressured = rng.chance(clamp(pressureBase + lineTerm / sackShare, 0, 1))
  const outcome = dropbackOutcome(qb, pressured, sackShare, rng.next())
  if (outcome === 'sack') {
    const yards = Math.min(0, Math.round(quantileAt(TUNING.passing.sackYards, rng.next())))
    const sacker = creditedDefender(defense, TUNING.credit.sackRoleShares, 'sack', rng.next())
    return {
      ...resultBase(rng),
      yards,
      type: 'sack',
      isFirstDown: false,
      players: { passer: qb.id, sacker: sacker.id },
      pressure: true,
      desc: `${qb.lastName} sacked for ${Math.abs(yards)} yards`,
    }
  }

  if (outcome === 'scramble') {
    const yards = Math.round(quantileAt(TUNING.passing.scrambleYards, rng.next()))
    const cappedYards = Math.min(yards, TUNING.football.fieldLength - context.yardLine)
    const credited = tacklers(defense, 'scramble', rng)
    const isTouchdown = context.yardLine + cappedYards >= TUNING.football.fieldLength
    const base: PlayResult = {
      ...resultBase(rng),
      yards: cappedYards,
      type: 'scramble',
      isTouchdown,
      isFirstDown: cappedYards >= context.toGo,
      outOfBounds: rng.chance(TUNING.rushing.outOfBoundsChance),
      players: { rusher: qb.id, ...tackleCredit(credited, isTouchdown) },
      pressure: pressured,
      desc: `${qb.lastName} scrambles for ${cappedYards} yards`,
    }
    return fumbleResult(base, qb, credited.tackler, rng)
  }

  if (outcome === 'throwaway') {
    return {
      ...resultBase(rng),
      yards: 0,
      type: 'incomplete',
      outOfBounds: true,
      players: { passer: qb.id },
      pressure: pressured,
      throwaway: true,
      desc: `${qb.lastName} throws it away`,
    }
  }
  // A throw: on the move or from the pocket, clean or pressured (TUNING.pressure's four cells).
  const onTheMove = outcome === 'move'
  const throwCell = (pressured ? 2 : 0) + (onTheMove ? 1 : 0)
  const completionFactor = (TUNING.pressure.completionFactor[throwCell] as number)
    * (onTheMove ? 1 + TUNING.pressure.moveAccuracyPerPoint * (qb.ratings.throwOnRun - TUNING.pressure.throwOnRunReference) : 1)
  const interceptionFactor = (TUNING.pressure.interceptionFactor[throwCell] as number)
    * (pressured && !onTheMove ? ratingFactor(qb.ratings.aggression, TUNING.pressure.aggressionReference) : 1)
  const throwFlags = { pressure: pressured, outOfPocket: onTheMove }

  const kind = routeKind(intent)
  const target = chooseReceiver(offense, kind, rng)
  const receiver = target.player
  const defender = coverDefender(defense, target)
  // Stage 3 (DEPTH W1): the defender's read joins his coverage.
  const coverage = (defender.ratings.manCoverage + defender.ratings.zoneCoverage + defender.ratings.playRecognition) / TUNING.passing.coverageTerms
  // Phase 3.6. `separation` joins the receiver blend: it is what protects a quarterback's
  // accuracy (DESIGN.md 1.2). It is drawn on the same scale as the other two, so the blend's
  // mean is unchanged and only its composition is.
  const receiverSkill = (receiver.ratings.catching + receiver.ratings.routeRunning + receiver.ratings.separation) / TUNING.passing.receiverSkillTerms
  // The pass matchup in rating points: quarterback accuracy and receiver skill against coverage,
  // which carries `coverageWeight` (NFLVERSE S5; 1 before, when this was acc + skill - cover - 80).
  // Stage 3: receiver skill reads against his group's league mean, so an average back on a screen
  // completes like an average receiver on one (a back's catching is not in his overall). The
  // league's pass mix by group now moves with the allocation; this keeps it from moving completion.
  const mean = TUNING.roster.starterMean
  // Coverage reads the same way, against the league mean of whoever covers that group: a
  // linebacker's coverage is not in his overall either.
  // Stage 3 (DEPTH W1): arm strength counts on medium and deep throws, and hands in traffic on
  // contested ones (medium routes and the red zone), each against the league's reference.
  const contested = kind === 'medium' || context.yardLine >= TUNING.scoring.redZoneLine
  const passEdge = (qb.ratings.throwAccuracy - mean) + (receiverSkill - TUNING.usage.receiverSkillReference[target.group])
    - TUNING.passing.coverageWeight * (coverage - TUNING.usage.coverageReference[target.group])
    + (TUNING.passing.throwPowerWeight[ROUTE_INDEX[kind]] as number) * (qb.ratings.throwPower - TUNING.passing.throwPowerReference)
    + (contested ? TUNING.passing.catchInTrafficWeight * (receiver.ratings.catchInTraffic - TUNING.passing.catchInTrafficReference[target.group]) : 0)
  const edgeOverLeague = passEdge - TUNING.passing.passEdgeCentre
  const ratingAdjustment = edgeOverLeague / TUNING.passing.ratingEffectDivisor
  const coldPenalty = context.weather.tempF < TUNING.weather.extremeCold
    ? TUNING.passing.extremeColdCompletionPenalty
    : context.weather.tempF < TUNING.weather.snowTemperature
      ? TUNING.passing.coldCompletionPenalty
      : 0
  const weatherPenalty = context.weather.windMph * TUNING.passing.windCompletionPenaltyPerMph
    + (context.weather.precip === 'rain' ? TUNING.passing.rainCompletionPenalty : 0)
    + (context.weather.precip === 'snow' ? TUNING.passing.snowCompletionPenalty : 0)
    + coldPenalty
    - (context.weather.indoor ? TUNING.passing.indoorCompletionBonus : 0)
  const forcedPenalty = intent.forceBall ? TUNING.passing.forcedCompletionPenalty : 0
  // NFLVERSE S5: the matchup also moves interceptions, and (below) how far a completion goes.
  // NFLVERSE S5: home field through its channels, scaled by the crowd (2020, without crowds, had none).
  const crowd = isHomeOffense ? 0 : context.crowdFactor
  const interceptionChance = TUNING.passing.intPerAttempt * Math.exp(-TUNING.passing.intEdgePerPoint * edgeOverLeague) * interceptionFactor
    + crowd * TUNING.homeField.awayIntBonus
    + (intent.forceBall ? TUNING.passing.forcedIntBonus : 0)
  const zoneCompletion = TUNING.passing.routeZoneCompletion[cellOf(TUNING.passing.routeZones, TUNING.football.fieldLength - context.yardLine)] as readonly number[]

  if (rng.chance(interceptionChance)) {
    const interceptor = creditedDefender(defense, TUNING.credit.interceptionRoleShares, 'interception', rng.next(), { covering: defender })
    return {
      ...resultBase(rng),
      yards: 0,
      type: 'int',
      isTurnover: true,
      players: { passer: qb.id, receiver: receiver.id, interceptor: interceptor.id },
      ...throwFlags,
      desc: `${qb.lastName} intercepted by ${interceptor.lastName} targeting ${receiver.lastName}`,
    }
  }

  const completionChance = clamp(TUNING.passing.routeCompletion[kind] * (zoneCompletion[ROUTE_INDEX[kind]] as number)
    * (TUNING.passing.completionSituation[situation] as number) * completionFactor
    + ratingAdjustment
    + (isHomeOffense ? context.crowdFactor * TUNING.passing.homeRatingBoost / TUNING.passing.ratingEffectDivisor : 0)
    - weatherPenalty
    - forcedPenalty, 0, 1)
  if (!rng.chance(completionChance)) {
    return {
      ...resultBase(rng),
      yards: 0,
      type: 'incomplete',
      outOfBounds: true,
      players: { passer: qb.id, receiver: receiver.id },
      ...throwFlags,
      throwaway: false,
      desc: `Incomplete to ${receiver.lastName}`,
    }
  }

  // NFLVERSE S3: the real distribution of yards on a completion at this depth (the long tail
  // included), capped at the goal line.
  // NFLVERSE S5: a better matchup tilts the draw toward the table's long end (u -> 1 - (1 - u)^tilt).
  const tilt = Math.exp(TUNING.passing.yardsTiltPerPoint * (edgeOverLeague - TUNING.passing.yardsTiltOffset))
  const yards = Math.min(Math.round(quantileAt(TUNING.passing.completionYards[kind], 1 - (1 - rng.next()) ** tilt)), TUNING.football.fieldLength - context.yardLine)
  const credited = tacklers(defense, kind, rng)
  const isTouchdown = context.yardLine + yards >= TUNING.football.fieldLength
  const base: PlayResult = {
    ...resultBase(rng),
    yards,
    type: 'pass',
    isTouchdown,
    isFirstDown: yards >= context.toGo,
    outOfBounds: rng.chance(TUNING.passing.outOfBoundsChance),
    players: { passer: qb.id, receiver: receiver.id, ...tackleCredit(credited, isTouchdown) },
    ...throwFlags,
    desc: `${qb.lastName} complete to ${receiver.lastName} for ${yards} yards`,
  }
  return fumbleResult(base, receiver, credited.tackler, rng)
}

export function resolvePlay(
  offense: DepthChart,
  defense: DepthChart,
  intent: PlayIntent,
  context: GameContext,
  isHomeOffense: boolean,
  rng: RNG,
): PlayResult {
  const penalty = penaltyResult(offense, context, rng, isHomeOffense)
  if (penalty !== null) return penalty
  const result = intent.playType === 'insideRun' || intent.playType === 'outsideRun' || intent.playType === 'draw'
    ? resolveRun(offense, defense, intent, context, rng)
    : resolvePass(offense, defense, intent, context, isHomeOffense, rng)
  // NFLVERSE S2: a loss stops at the 1. Safeties are drawn per snap by the game engine, at the real
  // rate from the offence's own 10, not by carrying the ball past the goal line.
  const floor = 1 - context.yardLine
  return result.yards < floor ? { ...result, yards: floor } : result
}
