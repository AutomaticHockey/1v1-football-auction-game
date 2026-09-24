// Stand-in for Cornerstone's generate.ts, which the depth chart imports for one function only.
// The real module pulls in the draft, schemes and progression tables. This returns the same
// replacement player as generate.ts's createReplacementPlayer (build.mjs fills in the one value
// it reads from TUNING.progression). The depth chart only reaches for it when a roster is empty.
import { TUNING } from '../cornerstone/tuning'

const RATING_KEYS = [
  'speed', 'agility', 'strength', 'stamina', 'throwPower', 'throwAccuracy', 'throwOnRun', 'carrying', 'breakTackle', 'vision',
  'catching', 'routeRunning', 'catchInTraffic', 'runBlock', 'passBlock', 'passRush', 'runDefense', 'blockShedding',
  'manCoverage', 'zoneCoverage', 'tackling', 'hitPower', 'kickPower', 'kickAccuracy', 'awareness', 'playRecognition', 'poise',
  'consistency', 'aggression', 'injuryProne', 'processing', 'separation', 'durability',
]
declare const __DEVELOPMENT_TRAIT_MEAN__: number

export function createReplacementPlayer(position: string): any {
  const ratings: any = Object.fromEntries(RATING_KEYS.map((key) => [key, TUNING.roster.replacementRating]))
  ratings.speed = TUNING.roster.replacementAthleticRating
  ratings.stamina = TUNING.roster.replacementAthleticRating
  return {
    id: TUNING.roster.replacementPlayerId,
    teamId: TUNING.roster.emptyTeamId,
    firstName: 'Replacement',
    lastName: 'Player',
    position,
    jersey: TUNING.roster.jerseyMax,
    age: TUNING.roster.ageMode,
    accruedSeasons: 0,
    heightIn: TUNING.roster.defaultHeight,
    weightLb: TUNING.roster.defaultWeight,
    ratings,
    overall: TUNING.roster.replacementOverall,
    potential: TUNING.roster.replacementOverall,
    developmentTrait: __DEVELOPMENT_TRAIT_MEAN__,
    scoutedOverall: TUNING.roster.replacementOverall,
    scoutingPct: TUNING.coach.riskScale,
    contract: null,
    draft: null,
    weeksInjured: 0,
    retiredYear: null,
    careerStats: [],
  }
}
