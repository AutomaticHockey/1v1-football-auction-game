// The game's edits to Cornerstone's engine, applied by build.mjs at build time; the snapshot in
// cornerstone/ stays verbatim. Every `find` must occur exactly once in its file, or the build
// stops, so an engine update can never silently skip one. equiv.mts proves the result is still
// Cornerstone's engine, game by game, against its own simulateGame.
//
// Three kinds of edit:
// - driving: let game.ts run the engine a quarter at a time (exports and a pause flag);
// - usage: at the two places the engine picks who gets the ball (the target allocation and the
//   backs' share of designed runs), HOOKS.game may weigh players by their real 2025 volume. Every
//   rating-driven part of the pick stays: route and run fitness from the ratings, the per-game
//   form, and the quarterback's and receivers' own share of runs;
// - grades: a run's yards and breakaway chance, a throw's completion and interception chances and a
//   catch's yards also take the graded players' edges (their 2025 production, grades.mjs), through
//   HOOKS.game.
// With HOOKS.game null the original code runs unchanged.

const HOOKS_IMPORT = "import { HOOKS } from 'game:hooks'\n"

export const PATCHES = {
  'gameEngine.ts': [
    {
      why: 'the game steps a quarter at a time',
      find: '  recorder: PlayRecorder | undefined\n}',
      replace: '  recorder: PlayRecorder | undefined\n  /** Game patch: stop at the end of a quarter instead of rolling into the next. */\n  pauseAtQuarterEnd?: boolean\n}',
    },
    { why: 'game.ts drives these', find: 'function kickoff(runtime: Runtime,', replace: 'export function kickoff(runtime: Runtime,' },
    { why: 'game.ts drives these', find: 'function transitionPeriod(runtime: Runtime)', replace: 'export function transitionPeriod(runtime: Runtime)' },
    { why: 'game.ts drives these', find: 'function runCurrentPeriod(runtime: Runtime)', replace: 'export function runCurrentPeriod(runtime: Runtime)' },
    {
      why: 'the game steps a quarter at a time',
      find: '      if (runtime.overtime || runtime.context.quarter >= TUNING.football.downs) return\n      transitionPeriod(runtime)',
      replace: '      if (runtime.overtime || runtime.context.quarter >= TUNING.football.downs) return\n      if (runtime.pauseAtQuarterEnd) return\n      transitionPeriod(runtime)',
    },
  ],
  'playEngine.ts': [
    { why: 'usage hooks', prepend: HOOKS_IMPORT },
    {
      why: "usage: the backs split their share of designed runs by real carries (their run fitness still leans it)",
      find: `  backs.forEach((player, rank) => candidates.push({
    player, group: 'RB', weight: backShare * (usage.backCarrySlotWeight[rank] as number) / backSlots * carryFitness(player, 'RB', backScore),
  }))
`,
      replace: `  backs.forEach((player, rank) => candidates.push({
    player, group: 'RB', weight: backShare * (usage.backCarrySlotWeight[rank] as number) / backSlots * carryFitness(player, 'RB', backScore),
  }))
  if (HOOKS.game) HOOKS.game.backCarries(candidates, backShare, backScore, (player: Player, score: CarryScore) => carryFitness(player, 'RB', score))
`,
    },
    {
      why: 'usage: targets by real volume (route fitness from the ratings still picks which routes)',
      find: 'function chooseReceiver(offense: DepthChart, kind: RouteKind, rng: RNG): ReceivingOption {\n  const { options, cumulative } = targetPool(offense, kind)',
      replace: `/** Game patch: a receiver's fitness for a route, exactly as targetPool computes it. */
function routeFitness(option: ReceivingOption, kind: RouteKind): number {
  const usage = TUNING.usage
  const reference = usage.targetFitnessReference[option.group][ROUTE_INDEX[kind]] as number
  return clamp(Math.exp(usage.targetFitnessPerPoint * (routeFitnessScore(option.player, kind) - reference)), usage.fitnessMin, usage.fitnessMax)
}

/** Game patch: the allocation with the game's weights (real volume), memoised per chart and route like targetPool. */
const gameTargetPools = new WeakMap<DepthChart, Map<RouteKind, TargetPool>>()

function gameTargetPool(offense: DepthChart, kind: RouteKind): TargetPool {
  let byKind = gameTargetPools.get(offense)
  if (byKind === undefined) {
    byKind = new Map()
    gameTargetPools.set(offense, byKind)
  }
  const cached = byKind.get(kind)
  if (cached !== undefined) return cached
  const options = receivingOptions(offense)
  const weighted = options.map((option) => ({
    player: option.player, group: option.group, weight: HOOKS.game.targetWeight(option, kind, (route: RouteKind) => routeFitness(option, route)),
  }))
  applyForm(offense, weighted, TUNING.usage.formSd.targets)
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
  const { options, cumulative } = HOOKS.game ? gameTargetPool(offense, kind) : targetPool(offense, kind)`,
    },
    // Grades: a real player's 2025 production (blended with his Madden rating, grades.mjs) moves
    // each play he is in, on top of everything the engine already reads. Filler has no grade.
    {
      why: "grades: the carrier's and the defense's yards per carry",
      find: '    + TUNING.usage.carrierYardsOffset[carrier.group]\n',
      replace: '    + TUNING.usage.carrierYardsOffset[carrier.group]\n    + (HOOKS.game ? HOOKS.game.runShift(rusher, defense) : 0)\n',
    },
    {
      why: "grades: a graded back's breakaway runs (more of them for a better back, fewer for a worse one)",
      find: '  if (rng.chance(Math.max(0, rusher.ratings.speed - TUNING.roster.starterMean) / TUNING.rushing.carryingEffectDivisor)) u = 1 - tail * rng.next()\n',
      replace: '  if (rng.chance(Math.max(0, rusher.ratings.speed - TUNING.roster.starterMean) / TUNING.rushing.carryingEffectDivisor)) u = 1 - tail * rng.next()\n  if (HOOKS.game) u = HOOKS.game.runDraw(u, rusher, rng)\n',
    },
    {
      why: "grades: the passer's, the receiver's and the defense's completion rate",
      find: '    - forcedPenalty, 0, 1)',
      replace: '    - forcedPenalty\n    + (HOOKS.game ? HOOKS.game.passCatch(qb, receiver, defense) : 0), 0, 1)',
    },
    {
      why: "grades: the passer's and the defense's interceptions",
      find: '  if (rng.chance(interceptionChance)) {',
      replace: '  if (rng.chance(HOOKS.game ? interceptionChance * HOOKS.game.passInt(qb, defense) : interceptionChance)) {',
    },
    {
      why: "grades: the passer's, the receiver's and the defense's yards per catch",
      find: '  const yards = Math.min(Math.round(quantileAt(TUNING.passing.completionYards[kind], 1 - (1 - rng.next()) ** tilt)), TUNING.football.fieldLength - context.yardLine)',
      replace: `  const drawn = quantileAt(TUNING.passing.completionYards[kind], 1 - (1 - rng.next()) ** tilt)
  const yards = Math.min(Math.round(HOOKS.game ? HOOKS.game.passYards(drawn, qb, receiver, defense) : drawn), TUNING.football.fieldLength - context.yardLine)`,
    },
  ],
}

export function applyPatches(file, source) {
  const list = PATCHES[file]
  if (!list) return source
  let out = source.replace(/\r\n/g, '\n')
  for (const patch of list) {
    if (patch.prepend) { out = patch.prepend + out; continue }
    const count = out.split(patch.find).length - 1
    if (count !== 1) throw new Error(`patch for ${file} (${patch.why}) matched ${count} times; the engine changed here, re-port it by hand:\n${patch.find}`)
    out = out.replace(patch.find, () => patch.replace)
  }
  return out
}
