import { TUNING } from './tuning'
import type {
  GameContext,
  GameResult,
  Player,
  PlayerGameStats,
  PlayerSituation,
  PlayResult,
  Position,
  SeasonStatLine,
  Team,
  TeamGameStats,
} from './types'

export type GameStatBook = {
  home: TeamGameStats
  away: TeamGameStats
  players: Map<number, PlayerGameStats>
  rosterOwners: ReadonlyMap<number, number>
}

export function createTeamGameStats(teamId: number): TeamGameStats {
  return {
    teamId,
    points: 0,
    totalPlays: 0,
    totalYards: 0,
    netPassingYards: 0,
    grossPassingYards: 0,
    passAttempts: 0,
    completions: 0,
    passingTouchdowns: 0,
    interceptions: 0,
    rushAttempts: 0,
    rushingYards: 0,
    rushingTouchdowns: 0,
    defensiveTouchdowns: 0,
    sacksAllowed: 0,
    sackYardsLost: 0,
    firstDowns: 0,
    passingFirstDowns: 0,
    rushingFirstDowns: 0,
    penaltyFirstDowns: 0,
    thirdDownAttempts: 0,
    thirdDownConversions: 0,
    fourthDownAttempts: 0,
    fourthDownConversions: 0,
    redZoneTrips: 0,
    redZoneTouchdowns: 0,
    penalties: 0,
    penaltyYards: 0,
    turnovers: 0,
    fumblesLost: 0,
    punts: 0,
    puntYards: 0,
    fieldGoalsAttempted: 0,
    fieldGoalsMade: 0,
    possessionSeconds: 0,
  }
}

export function createGameStatBook(home: Team, away: Team, players: readonly Player[]): GameStatBook {
  const byId = new Map(players.map((player) => [player.id, player]))
  const rosterOwners = new Map<number, number>()
  for (const team of [home, away]) for (const id of team.roster) {
    const player = byId.get(id)
    if (player === undefined || player.teamId !== team.id || player.retiredYear !== null || rosterOwners.has(id)) {
      throw new Error(`invalid game roster: player ${id}, team ${team.id}`)
    }
    rosterOwners.set(id, team.id)
  }
  return { home: createTeamGameStats(home.id), away: createTeamGameStats(away.id), players: new Map(), rosterOwners }
}

function playerLine(book: GameStatBook, playerId: number): PlayerGameStats {
  let line = book.players.get(playerId)
  if (line === undefined) {
    line = {
      playerId,
      passAttempts: 0,
      completions: 0,
      passingYards: 0,
      passingTouchdowns: 0,
      interceptions: 0,
      rushAttempts: 0,
      rushingYards: 0,
      rushingTouchdowns: 0,
      targets: 0,
      receptions: 0,
      receivingYards: 0,
      receivingTouchdowns: 0,
      tackles: 0,
      sacks: 0,
      fumblesLost: 0,
    }
    book.players.set(playerId, line)
  }
  return line
}

function addFirstDown(stats: TeamGameStats, result: PlayResult): void {
  if (!result.isFirstDown) return
  stats.firstDowns += 1
  if (result.type === 'penalty') stats.penaltyFirstDowns += 1
  else if (result.type === 'pass') stats.passingFirstDowns += 1
  else stats.rushingFirstDowns += 1
}

export function recordScrimmagePlay(
  book: GameStatBook,
  offense: TeamGameStats,
  defense: TeamGameStats,
  before: GameContext,
  result: PlayResult,
): void {
  for (const [role, id] of Object.entries(result.players)) {
    const teamId = role === 'tackler' || role === 'assister' || role === 'sacker' || role === 'interceptor' ? defense.teamId : offense.teamId
    if (id === TUNING.roster.replacementPlayerId || book.rosterOwners.get(id) !== teamId) {
      throw new Error(`invalid ${role} stat attribution: player ${id}, team ${teamId}`)
    }
  }
  if (result.type === 'penalty') {
    const penalty = result.penalty
    if (penalty !== undefined) {
      const committingTeam = penalty.onOffense ? offense : defense
      committingTeam.penalties += 1
      committingTeam.penaltyYards += Math.abs(penalty.yards)
      addFirstDown(offense, result)
    }
    return
  }

  offense.totalPlays += 1
  if (before.down === TUNING.coach.lateQuarter) offense.thirdDownAttempts += 1
  if (before.down === TUNING.football.downs) offense.fourthDownAttempts += 1
  if (result.isFirstDown && before.down === TUNING.coach.lateQuarter) offense.thirdDownConversions += 1
  if (result.isFirstDown && before.down === TUNING.football.downs) offense.fourthDownConversions += 1
  addFirstDown(offense, result)

  const passer = result.players.passer === undefined ? undefined : playerLine(book, result.players.passer)
  const rusher = result.players.rusher === undefined ? undefined : playerLine(book, result.players.rusher)
  const receiver = result.players.receiver === undefined ? undefined : playerLine(book, result.players.receiver)
  const sacker = result.players.sacker === undefined ? undefined : playerLine(book, result.players.sacker)
  const tackler = result.players.tackler === undefined ? undefined : playerLine(book, result.players.tackler)
  if (tackler !== undefined) tackler.tackles += 1
  // Stage 3 (DEPTH W1.2): a shared tackle counts for both, as NFL.com's combined column does.
  const assister = result.players.assister === undefined ? undefined : playerLine(book, result.players.assister)
  if (assister !== undefined) assister.tackles += 1

  if (result.type === 'pass' || result.type === 'incomplete' || result.type === 'int') {
    offense.passAttempts += 1
    if (passer !== undefined) passer.passAttempts += 1
    if (receiver !== undefined) receiver.targets += 1
    if (result.type === 'pass') {
      offense.completions += 1
      offense.grossPassingYards += result.yards
      offense.netPassingYards += result.yards
      if (passer !== undefined) {
        passer.completions += 1
        passer.passingYards += result.yards
      }
      if (receiver !== undefined) {
        receiver.receptions += 1
        receiver.receivingYards += result.yards
      }
    }
    if (result.type === 'int') {
      offense.interceptions += 1
      offense.turnovers += 1
      if (passer !== undefined) passer.interceptions += 1
    }
  } else if (result.type === 'spike') {
    // NFLVERSE S3: a spike is an incomplete pass in the box score, as in the NFL's.
    offense.passAttempts += 1
    if (passer !== undefined) passer.passAttempts += 1
  } else if (result.type === 'sack') {
    offense.sacksAllowed += 1
    offense.sackYardsLost += Math.abs(result.yards)
    offense.netPassingYards += result.yards
    if (sacker !== undefined) sacker.sacks += 1
  } else if (result.type === 'fumble' && passer !== undefined && receiver !== undefined) {
    offense.passAttempts += 1
    offense.completions += 1
    offense.grossPassingYards += result.yards
    offense.netPassingYards += result.yards
    passer.passAttempts += 1
    passer.completions += 1
    passer.passingYards += result.yards
    receiver.targets += 1
    receiver.receptions += 1
    receiver.receivingYards += result.yards
    if (result.isTurnover) {
      offense.fumblesLost += 1
      offense.turnovers += 1
      receiver.fumblesLost += 1
    }
  } else if (result.type === 'run' || result.type === 'scramble' || result.type === 'fumble' || result.type === 'kneel') {
    offense.rushAttempts += 1
    offense.rushingYards += result.yards
    if (rusher !== undefined) {
      rusher.rushAttempts += 1
      rusher.rushingYards += result.yards
    }
    if (result.type === 'fumble' && result.isTurnover) {
      offense.fumblesLost += 1
      offense.turnovers += 1
      if (rusher !== undefined) rusher.fumblesLost += 1
      if (receiver !== undefined) receiver.fumblesLost += 1
    }
  }

  if (result.isTouchdown) {
    if (result.type === 'pass' || (result.type === 'fumble' && passer !== undefined)) {
      offense.passingTouchdowns += 1
      if (passer !== undefined) passer.passingTouchdowns += 1
      if (receiver !== undefined) receiver.receivingTouchdowns += 1
    } else {
      offense.rushingTouchdowns += 1
      if (rusher !== undefined) rusher.rushingTouchdowns += 1
    }
  }
  offense.totalYards = offense.netPassingYards + offense.rushingYards
}

export function recordPunt(stats: TeamGameStats, yards: number): void {
  stats.punts += 1
  stats.puntYards += yards
}

export function recordFieldGoal(stats: TeamGameStats, made: boolean): void {
  stats.fieldGoalsAttempted += 1
  if (made) stats.fieldGoalsMade += 1
}

export function addPossessionTime(stats: TeamGameStats, seconds: number): void {
  stats.possessionSeconds += seconds
}

export function addPoints(stats: TeamGameStats, points: number): void {
  stats.points += points
}

export function playerStatLines(book: GameStatBook): PlayerGameStats[] {
  return [...book.players.values()].sort((left, right) => left.playerId - right.playerId)
}

function addPlayerGameStats(target: PlayerGameStats, source: PlayerGameStats): void {
  target.passAttempts += source.passAttempts
  target.completions += source.completions
  target.passingYards += source.passingYards
  target.passingTouchdowns += source.passingTouchdowns
  target.interceptions += source.interceptions
  target.rushAttempts += source.rushAttempts
  target.rushingYards += source.rushingYards
  target.rushingTouchdowns += source.rushingTouchdowns
  target.targets += source.targets
  target.receptions += source.receptions
  target.receivingYards += source.receivingYards
  target.receivingTouchdowns += source.receivingTouchdowns
  target.tackles += source.tackles
  target.sacks += source.sacks
  target.fumblesLost += source.fumblesLost
}

function emptyPlayerGameStats(playerId: number): PlayerGameStats {
  return {
    playerId,
    passAttempts: 0,
    completions: 0,
    passingYards: 0,
    passingTouchdowns: 0,
    interceptions: 0,
    rushAttempts: 0,
    rushingYards: 0,
    rushingTouchdowns: 0,
    targets: 0,
    receptions: 0,
    receivingYards: 0,
    receivingTouchdowns: 0,
    tackles: 0,
    sacks: 0,
    fumblesLost: 0,
  }
}

function usage(stats: PlayerGameStats): number {
  return stats.passAttempts + stats.rushAttempts + stats.targets
}

function positionKey(teamId: number, position: Position): string {
  return `${teamId}:${position}`
}

/**
 * Aggregate the completed schedule into career lines and derive prior-year snap share. Actual
 * attempts/carries/targets and games are blended with depth rank, so positions whose individual
 * participation is not yet emitted by the play engine still receive a defensible workload seam.
 */
export function recordSeasonStatLines(
  teams: readonly Team[],
  players: Player[],
  games: readonly GameResult[],
  season: number,
  situations: readonly PlayerSituation[] = [],
): void {
  const situationById = new Map(situations.map((situation) => [situation.playerId, situation]))
  const byId = new Map(players.map((player) => [player.id, player]))
  const totals = new Map<number, PlayerGameStats>()
  const appearances = new Map<number, number>()
  const teamGames = new Map<number, number>()

  for (const game of games) {
    teamGames.set(game.homeTeamId, (teamGames.get(game.homeTeamId) ?? 0) + 1)
    teamGames.set(game.awayTeamId, (teamGames.get(game.awayTeamId) ?? 0) + 1)
    for (const line of game.playerStats) {
      let total = totals.get(line.playerId)
      if (total === undefined) {
        total = emptyPlayerGameStats(line.playerId)
        totals.set(line.playerId, total)
      }
      addPlayerGameStats(total, line)
      appearances.set(line.playerId, (appearances.get(line.playerId) ?? 0) + 1)
    }
  }

  const positionUsage = new Map<string, number>()
  for (const [playerId, stats] of totals) {
    const player = byId.get(playerId)
    if (player?.teamId === null || player === undefined) continue
    const key = positionKey(player.teamId, player.position)
    positionUsage.set(key, (positionUsage.get(key) ?? 0) + usage(stats))
  }

  const depthShareById = new Map<number, number>()
  const depth = TUNING.progression.snapShare
  for (const team of teams) {
    const roster = team.roster
      .map((playerId) => byId.get(playerId))
      .filter((player): player is Player => player !== undefined && player.retiredYear === null)
    const positions = new Set(roster.map((player) => player.position))
    for (const position of positions) {
      const ordered = roster
        .filter((player) => player.position === position)
        .sort((left, right) => right.overall - left.overall || left.id - right.id)
      const slots = (depth.slotShares as Partial<Record<Position, readonly number[]>>)[position] ?? depth.depthShares
      for (let index = 0; index < ordered.length; index += 1) {
        const player = ordered[index] as Player
        depthShareById.set(
          player.id,
          slots[index] ?? depth.reserveDepthShare,
        )
      }
    }
  }

  for (const team of teams) {
    const gamesPlayedByTeam = teamGames.get(team.id) ?? 0
    for (const playerId of team.roster) {
      const player = byId.get(playerId)
      if (player === undefined || player.retiredYear !== null) continue
      const total = totals.get(playerId) ?? emptyPlayerGameStats(playerId)
      const playerAppearances = appearances.get(playerId) ?? 0
      const depthShare = depthShareById.get(playerId) ?? depth.reserveDepthShare
      const teamPositionUsage = positionUsage.get(positionKey(team.id, player.position)) ?? 0
      // Stage 3 (NFLVERSE S6): his share of the position's production, as snaps: times the
      // position's real on-field total (a WR with a quarter of the WRs' targets plays about 60%).
      const slots = (depth.slotShares as Partial<Record<Position, readonly number[]>>)[player.position] ?? depth.depthShares
      const onField = slots.reduce((sum, share) => sum + share, 0)
      const usageShare = teamPositionUsage === 0 ? depthShare : usage(total) / teamPositionUsage * onField
      const gamesShare = gamesPlayedByTeam === 0 ? 0 : playerAppearances / gamesPlayedByTeam
      // Stage 3: a position that records no touches (the line, the defence) has no usage or
      // appearances to blend, so its snap share is its slot's real share (it read 0.9 of it).
      const snapShare = teamPositionUsage === 0 ? depthShare : Math.max(0, Math.min(1,
        depth.depthWeight * depthShare
        + depth.usageWeight * usageShare
        + depth.gamesWeight * gamesShare,
      ))
      const situation = situationById.get(playerId)
      const line: SeasonStatLine = {
        season,
        games: playerAppearances,
        snapShare,
        // Phase 3.6. The situation the player actually played the season in, recorded so that a
        // later production swing can be DECOMPOSED into true-rating movement versus situation
        // movement instead of inferred from either.
        age: player.age,
        teamId: team.id,
        schemeKey: situation?.schemeKey ?? '',
        trueOverall: situation?.trueOverall ?? player.overall,
        effectiveOverall: situation?.effectiveOverall ?? player.overall,
        passAttempts: total.passAttempts,
        completions: total.completions,
        passingYards: total.passingYards,
        passingTouchdowns: total.passingTouchdowns,
        interceptions: total.interceptions,
        rushAttempts: total.rushAttempts,
        rushingYards: total.rushingYards,
        rushingTouchdowns: total.rushingTouchdowns,
        targets: total.targets,
        receptions: total.receptions,
        receivingYards: total.receivingYards,
        receivingTouchdowns: total.receivingTouchdowns,
        tackles: total.tackles,
        sacks: total.sacks,
      }
      player.careerStats.push(line)
    }
  }
}
