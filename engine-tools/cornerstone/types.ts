export type Position =
  | 'QB' | 'RB' | 'FB' | 'WR' | 'TE'
  | 'LT' | 'LG' | 'C' | 'RG' | 'RT'
  | 'EDGE' | 'DT' | 'LB' | 'CB' | 'S'
  | 'K' | 'P' | 'LS'

export type PositionGroup = 'QB' | 'RB' | 'WR' | 'TE' | 'OL' | 'DL' | 'LB' | 'DB' | 'ST'

export type Ratings = {
  speed: number
  agility: number
  strength: number
  stamina: number
  throwPower: number
  throwAccuracy: number
  throwOnRun: number
  carrying: number
  breakTackle: number
  vision: number
  catching: number
  routeRunning: number
  catchInTraffic: number
  runBlock: number
  passBlock: number
  passRush: number
  runDefense: number
  blockShedding: number
  manCoverage: number
  zoneCoverage: number
  tackling: number
  hitPower: number
  kickPower: number
  kickAccuracy: number
  awareness: number
  playRecognition: number
  poise: number
  consistency: number
  aggression: number
  injuryProne: number
  // Phase 3.6 additions (DESIGN.md 1.2). `processing` is read speed and is distinct from
  // `awareness`; `separation` is WR release/route separation and is distinct from `routeRunning`
  // and `speed`; `durability` is performance THROUGH minor injury and is distinct from
  // `injuryProne`, which is the chance of getting hurt at all.
  processing: number
  separation: number
  durability: number
}

export type OffensiveSchemeId =
  | 'WEST_COAST' | 'VERTICAL' | 'SPREAD_RPO' | 'AIR_RAID' | 'ZONE_RUN' | 'POWER_RUN'

export type DefensiveSchemeId =
  | 'FOUR_THREE_ZONE' | 'THREE_FOUR_BLITZ' | 'NICKEL_MATCH' | 'COVER_THREE'

export type SchemeId = OffensiveSchemeId | DefensiveSchemeId

/** Per-position rating weights a scheme demands. Weights sum to 1 for every declared position. */
export type SchemeDemand = Partial<Record<keyof Ratings, number>>

export type ProratableBonusKind = 'signing' | 'option' | 'restructure' | 'reporting'

export type ProratableBonus = {
  id: number
  kind: ProratableBonusKind
  amount: number
  createdYear: number
  remainingProration: number[]
}

export type Contract = {
  id: number
  years: number
  yearsRemaining: number
  activeYearsRemaining: number
  baseSalary: number[]
  signingBonus: number
  guaranteedThrough: number
  signedYear: number
  voidYears: number
  bonusEvents: ProratableBonus[]
}

export type ContractTiming = 'preJune1' | 'postJune1' | 'postJune1Designation'

export type DeadMoneyReason = 'release' | 'trade' | 'void'

export type DeadMoneyEntry = {
  teamId: number
  playerId: number
  contractId: number
  year: number
  amount: number
  source: 'bonus' | 'guaranteedSalary'
  reason: DeadMoneyReason
  bonusId: number | null
}

export type TeamCapLedger = {
  teamId: number
  year: number
  currentDeadMoney: DeadMoneyEntry[]
  designatedDeadMoney: DeadMoneyEntry[]
  futureDeadMoney: DeadMoneyEntry[]
  retainedCapUntilJune2: number
  postJune1Designations: number
}

export type SeasonStatLine = {
  season: number
  games: number
  snapShare: number
  /** Phase 3.6 situation record. These make production decomposable after the fact. */
  age: number
  teamId: number
  schemeKey: string
  trueOverall: number
  effectiveOverall: number
  passAttempts: number
  completions: number
  passingYards: number
  passingTouchdowns: number
  interceptions: number
  rushAttempts: number
  rushingYards: number
  rushingTouchdowns: number
  targets: number
  receptions: number
  receivingYards: number
  receivingTouchdowns: number
  tackles: number
  sacks: number
}

export type Player = {
  id: number
  teamId: number | null
  firstName: string
  lastName: string
  position: Position
  jersey: number
  age: number
  accruedSeasons: number
  heightIn: number
  weightLb: number
  ratings: Ratings
  overall: number
  potential: number
  developmentTrait: number
  scoutedOverall: number
  scoutingPct: number
  contract: Contract | null
  draft: { year: number; round: number; pick: number } | null
  weeksInjured: number
  retiredYear: number | null
  careerStats: SeasonStatLine[]
}

export type DraftPick = {
  year: number
  round: number
  originalTeamId: number
  compensatory: boolean
  compensatoryOrder: number | null
}

export type CoachProfile = {
  aggressiveness: number
  passBias: number
  tempo: number
  riskTolerance: number
  trustInQB: number
}

export type Team = {
  id: number
  city: string
  name: string
  abbr: string
  conference: 'AFC' | 'NFC'
  division: 'East' | 'North' | 'South' | 'West'
  primaryColor: string
  secondaryColor: string
  stadiumId: string
  roof: 'outdoors' | 'dome' | 'closed' | 'open'
  surface: 'grass' | 'turf'
  wins: number
  losses: number
  ties: number
  divWins: number
  divLosses: number
  divTies: number
  confWins: number
  confLosses: number
  confTies: number
  pointsFor: number
  pointsAgainst: number
  scheme: CoachProfile
  offensiveScheme: OffensiveSchemeId
  defensiveScheme: DefensiveSchemeId
  capSpace: number
  deadMoney: number
  /**
   * Dead money already committed to NEXT league year by a post-June-1 release.
   *
   * The designation is the one real tool a club has when its contracts are too fresh to cut: it
   * splits the accelerated proration across two years instead of taking all of it now. The engine
   * has modelled and audited the split since Phase 1, but only `simulateCapOffseasons` ever used
   * it, because the main league loop had nowhere to put the second half. This is that place — it
   * is added to `deadMoney` when the next league year opens and cleared.
   */
  deferredDeadMoney: number
  picks: DraftPick[]
  roster: number[]
}

export type StaticTeam = Pick<
  Team,
  | 'id' | 'city' | 'name' | 'abbr' | 'conference' | 'division'
  | 'primaryColor' | 'secondaryColor' | 'stadiumId' | 'roof' | 'surface'
>

export type Stadium = {
  id: string
  name: string
  roof: Team['roof']
  surface: Team['surface']
  climate: 'cold' | 'cool' | 'mild' | 'warm' | 'hot' | 'indoor'
}

export type ScheduleGame = {
  id: string
  week: number
  awayTeamId: number
  homeTeamId: number
  awayRest: number
  homeRest: number
  divGame: boolean
  stadiumId: string
}

export type Weather = {
  tempF: number
  windMph: number
  precip: 'none' | 'rain' | 'snow'
  indoor: boolean
}

export type GameContext = {
  homeScore: number
  awayScore: number
  quarter: number
  clock: number
  down: number
  toGo: number
  yardLine: number
  possession: 'home' | 'away'
  weather: Weather
  /** Shared additive yards-per-successful-play environment, drawn once for both offenses. */
  /**
   * Phase 3.7. One seeded draw per game, shared by BOTH teams: a proportional shift to
   * between-play clock runoff. See `runoffFor` in gameEngine.ts for why it lives there.
   */
  tempoEnvironment: number
  crowdFactor: number
  isTwoMinute: boolean
  timeoutsHome: number
  timeoutsAway: number
}

export type PlayType =
  | 'insideRun' | 'outsideRun' | 'draw'
  | 'screen' | 'shortPass' | 'mediumPass' | 'deepPass' | 'playAction'

export type PlayIntent = {
  playType: PlayType
  riskTolerance: number
  tempo: number
  forceBall: boolean
  drainClock: boolean
  /** NFLVERSE S3: the offence runs this snap without a huddle (the next snap comes quicker). */
  noHuddle: boolean
  maxReads: number
}

export type PlayResult = {
  yards: number
  clockUsed: number
  type: 'run' | 'pass' | 'sack' | 'scramble' | 'incomplete' | 'int' | 'fumble' | 'fg' | 'punt' | 'kneel' | 'spike' | 'penalty'
  isTurnover: boolean
  isTouchdown: boolean
  isFirstDown: boolean
  outOfBounds: boolean
  penalty?: { yards: number; onOffense: boolean; automaticFirstDown: boolean }
  players: { passer?: number; rusher?: number; receiver?: number; tackler?: number; assister?: number; sacker?: number; interceptor?: number }
  /** Stage 3 (DEPTH W1.1): a dropback was pressured (every sack is). Absent on runs, kicks, penalties. */
  pressure?: boolean
  /** Stage 3: an incompletion thrown away (no receiver), or false on an incompletion aimed at one. */
  throwaway?: boolean
  /** Stage 3: a throw on the move, outside the pocket. */
  outOfPocket?: boolean
  desc: string
}

export type PlayerGameStats = Omit<
  SeasonStatLine,
  'season' | 'games' | 'snapShare' | 'age' | 'teamId' | 'schemeKey' | 'trueOverall' | 'effectiveOverall'
> & {
  playerId: number
  fumblesLost: number
}

export type TeamGameStats = {
  teamId: number
  points: number
  totalPlays: number
  totalYards: number
  netPassingYards: number
  grossPassingYards: number
  passAttempts: number
  completions: number
  passingTouchdowns: number
  interceptions: number
  rushAttempts: number
  rushingYards: number
  rushingTouchdowns: number
  defensiveTouchdowns: number
  sacksAllowed: number
  sackYardsLost: number
  firstDowns: number
  passingFirstDowns: number
  rushingFirstDowns: number
  penaltyFirstDowns: number
  thirdDownAttempts: number
  thirdDownConversions: number
  fourthDownAttempts: number
  fourthDownConversions: number
  redZoneTrips: number
  redZoneTouchdowns: number
  penalties: number
  penaltyYards: number
  turnovers: number
  fumblesLost: number
  punts: number
  puntYards: number
  fieldGoalsAttempted: number
  fieldGoalsMade: number
  possessionSeconds: number
}

export type GameResult = {
  id: string
  week: number
  homeTeamId: number
  awayTeamId: number
  homeScore: number
  awayScore: number
  overtime: boolean
  tie: boolean
  homeStats: TeamGameStats
  awayStats: TeamGameStats
  playerStats: PlayerGameStats[]
}

/**
 * NFLVERSE.md N4 — the opt-in play log.
 *
 * `GameResult` holds box-score totals only, and most of the situational comparisons against real
 * play-by-play (a fourth-down go rate by distance, points per drive by starting field position)
 * need the plays themselves. A caller that wants them passes a `PlayRecorder` to `simulateGame`
 * (or `simulateSeason`); the engine hands it one event per snap, kick, score, conversion and new
 * series, and nothing else changes.
 *
 * THE RECORDER IS A SINK, NOTHING MORE. It is off by default. When it is on, the engine builds each
 * event from state it has already computed and passes it out — it never draws from the RNG, never
 * mutates game state, and never changes an order of operations. `test:phase0` proves the whole
 * league is byte-identical with it on and off.
 *
 * Events carry the situation BEFORE the play (`at`). The clock is consumed before scoring is
 * resolved, so at the end of the first half a `series` event with cause `halftime` can arrive
 * between a play and the score it produced; a reader attributes by `at.quarter`, not by arrival.
 */
export type LoggedSide = 'home' | 'away'

export type PlayLogSituation = {
  quarter: number
  clock: number
  down: number
  toGo: number
  yardLine: number
  homeScore: number
  awayScore: number
  timeoutsHome: number
  timeoutsAway: number
}

/** Why a new series started — which is also how the previous one ended. */
export type SeriesCause =
  | 'opening' | 'touchdown' | 'returnTouchdown' | 'safety' | 'fieldGoal' | 'halftime' | 'overtime'
  | 'turnover' | 'downs' | 'missedFieldGoal' | 'punt'

export type PlayLogEvent =
  | { kind: 'season'; year: number }
  | {
    kind: 'gameStart'; gameId: string; week: number; homeTeamId: number; awayTeamId: number
    weather: Weather; receiving: LoggedSide; yardLine: number
  }
  | {
    kind: 'snap'; offense: LoggedSide; at: PlayLogSituation
    playType: PlayType; tempo: number; drainClock: boolean; forceBall: boolean; noHuddle: boolean
    result: PlayResult; runoff: number; timeoutsHomeAfter: number; timeoutsAwayAfter: number
  }
  | { kind: 'fieldGoal'; offense: LoggedSide; at: PlayLogSituation; distance: number; made: boolean; late: boolean }
  | {
    kind: 'punt'; offense: LoggedSide; at: PlayLogSituation; gross: number; touchback: boolean; fairCatch: boolean; returnYards: number
    returnTouchdown: boolean
  }
  | {
    /**
     * NFLVERSE S2. `yardLine` is where the side that has the ball next starts (engine coordinates),
     * null after a return touchdown. `returnYards` counts from the catch.
     */
    kind: 'kickoff'; kicking: LoggedSide; at: PlayLogSituation; onside: boolean; recovered: boolean; touchback: boolean
    returned: boolean; returnYards: number; returnTouchdown: boolean; yardLine: number | null
  }
  | { kind: 'touchdown'; side: LoggedSide; defensive: boolean; specialTeams?: boolean }
  | { kind: 'conversion'; side: LoggedSide; twoPoint: boolean; made: boolean; at: PlayLogSituation }
  | { kind: 'safety'; side: LoggedSide }
  | { kind: 'series'; side: LoggedSide; yardLine: number; quarter: number; clock: number; cause: SeriesCause }
  | { kind: 'gameEnd'; homeScore: number; awayScore: number; overtime: boolean }

export type PlayRecorder = { record(event: PlayLogEvent): void }

export type Standing = {
  teamId: number
  seed: number | null
  wins: number
  losses: number
  ties: number
  winPct: number
}

export type PlayoffSeed = {
  conference: Team['conference']
  seed: number
  teamId: number
  bye: boolean
}

/**
 * What a player's situation multiplied his true ratings by for one season. Recorded so that a
 * production swing can be decomposed into true-rating movement versus situation movement without
 * inferring either one.
 */
export type PlayerSituation = {
  playerId: number
  teamId: number
  position: Position
  schemeKey: string
  trueOverall: number
  effectiveOverall: number
  schemeFit: number
  schemeFitMultiplier: number
  supportingCast: number
  usage: number
  health: number
  swingRange: number
  rawProduct: number
  product: number
}

export type SeasonResult = {
  year: number
  games: GameResult[]
  standings: Standing[]
  playoffSeeds: PlayoffSeed[]
  situations: PlayerSituation[]
  /**
   * The league as it ENDED, present only when a mid-season hook changed it (Phase 6's trade
   * deadline). A caller that passed a hook must advance from these rather than from the arrays it
   * handed in, or every deadline trade is undone by the offseason.
   */
  finalTeams?: Team[]
  finalPlayers?: Player[]
}
