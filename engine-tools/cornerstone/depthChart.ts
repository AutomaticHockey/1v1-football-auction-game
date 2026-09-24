import { createReplacementPlayer } from './generate'
import type { RNG } from './rng'
import { TUNING } from './tuning'
import type { Player, Position, PositionGroup, Team } from './types'

const GROUP_POSITIONS: Record<PositionGroup, readonly Position[]> = {
  QB: ['QB'],
  RB: ['RB', 'FB'],
  WR: ['WR'],
  TE: ['TE'],
  OL: ['LT', 'LG', 'C', 'RG', 'RT'],
  DL: ['EDGE', 'DT'],
  LB: ['LB'],
  DB: ['CB', 'S'],
  ST: ['K', 'P', 'LS'],
}

export type DepthChart = {
  byPosition: ReadonlyMap<Position, readonly Player[]>
  byGroup: ReadonlyMap<PositionGroup, readonly Player[]>
  get(position: Position, depth?: number): Player
  getGroup(group: PositionGroup, depth?: number): Player
  /** Stage 3 (DEPTH W1 `consistency`): each rostered player's form for this game, a N(0, 1) draw. Empty outside a game. */
  form: ReadonlyMap<number, number>
}

function availableSorted(players: readonly Player[]): Player[] {
  return players.filter((player) => player.weeksInjured === 0).sort((left, right) => right.overall - left.overall || left.id - right.id)
}

export function buildDepthChart(team: Team, players: readonly Player[], formRng?: RNG): DepthChart {
  const rosterIds = new Set(team.roster)
  const roster = players.filter((player) => rosterIds.has(player.id))
  const form = new Map<number, number>()
  if (formRng !== undefined) for (const player of roster) form.set(player.id, formRng.gauss(0, 1))
  const positions = new Map<Position, readonly Player[]>()
  const groups = new Map<PositionGroup, readonly Player[]>()

  for (const player of roster) {
    if (!positions.has(player.position)) positions.set(player.position, availableSorted(roster.filter((candidate) => candidate.position === player.position)))
  }
  for (const [group, groupPositions] of Object.entries(GROUP_POSITIONS) as [PositionGroup, readonly Position[]][]) {
    groups.set(group, availableSorted(roster.filter((player) => groupPositions.includes(player.position))))
  }
  const available = availableSorted(roster)
  const fallback = (position: Position, depth: number): Player => {
    const group = (Object.keys(GROUP_POSITIONS) as PositionGroup[])
      .find((key) => GROUP_POSITIONS[key].includes(position))
    const related = group === undefined ? [] : groups.get(group) ?? []
    // Prefer another back/lineman/etc., then an existing player at the requested position.
    // An exhausted depth index is not permission to invent an athlete.
    return related[depth] ?? positions.get(position)?.[0] ?? related[0]
      ?? available[0] ?? createReplacementPlayer(position)
  }

  return {
    byPosition: positions,
    byGroup: groups,
    form,
    get(position, depth = 0) {
      return positions.get(position)?.[depth] ?? fallback(position, depth)
    },
    getGroup(group, depth = 0) {
      const fallbackPosition = GROUP_POSITIONS[group][0] as Position
      return groups.get(group)?.[depth] ?? fallback(fallbackPosition, depth)
    },
  }
}

/** A receiver who can be targeted: his group (WR, TE, or RB with FB) and his depth rank in it. */
export type ReceivingOption = { player: Player; group: 'WR' | 'TE' | 'RB'; rank: number }

/**
 * Stage 3 (DEPTH W4): every receiver the pass allocation weighs, as many ranks per group as
 * TUNING.usage.targetRankShare measures (WR 5, TE 3, RB 3). Available players only, in depth
 * order; a team short at a group fields fewer and the allocation renormalises.
 */
export function receivingOptions(chart: DepthChart): readonly ReceivingOption[] {
  const ranks = TUNING.usage.targetRankShare
  const options: ReceivingOption[] = []
  const add = (group: ReceivingOption['group'], players: readonly Player[]): void => {
    players.slice(0, ranks[group].length).forEach((player, rank) => options.push({ player, group, rank }))
  }
  add('WR', chart.byPosition.get('WR') ?? [])
  add('TE', chart.byPosition.get('TE') ?? [])
  add('RB', chart.byGroup.get('RB') ?? [])
  return options
}
