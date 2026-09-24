function deepFreeze<T extends object>(value: T): Readonly<T> {
  Object.freeze(value)
  for (const child of Object.values(value)) {
    if (child !== null && typeof child === 'object' && !Object.isFrozen(child)) {
      deepFreeze(child as object)
    }
  }
  return value
}

export const TUNING = deepFreeze({
  football: {
    rosterSize: 53,
    fieldLength: 100,
    firstDownYards: 10,
    downs: 4,
    regulationSeconds: 3600,
    quarterSeconds: 900,
    overtimeSeconds: 600,
    twoMinuteSeconds: 120,
    // NFLVERSE S2: the 2025 kickoff rule puts a touchback at the 35 (owner decision §9.2b). It is
    // also the spot the game's context starts at before the opening kick is drawn.
    kickoffTouchbackSpot: 35,
    puntTouchbackSpot: 20,
    // NFLVERSE S2, DERIVED: real kick distance = yards to goal + 18.07 (n = 11,264 field goals,
    // 2015-2025). 17 was the rule-of-thumb (10 yards of end zone + 7 to the hold).
    endZoneAndHoldYards: 18,
    startingTimeouts: 3,
    overtimePossessionsRequired: 2,
    firstHalfFinalQuarter: 2,
    touchdownPoints: 6,
    fieldGoalPoints: 3,
    safetyPoints: 2,
    extraPointPoints: 1,
    twoPointPoints: 2,
  },
  clock: {
    secondsPerSnap: 28.7,
    playClockNormal: 40,
    // NFLVERSE S3: seconds run off between a snap and the next when the clock keeps running, by the
    // offence's tempo. FITTED to real seconds between snaps (2015-2025): neutral 31.3 (38.0 after a
    // running-clock play into a huddle, 29.8 into a no-huddle snap), Q2 last two minutes 11.8,
    // Q4 last five minutes trailing by 9+ 15.7, Q4 leading by 9+ 32.3. The final fit refitted
    // normalRunoff 38 -> 35.3 after the timeout refit below took out clock stops (neutral read
    // 32.27 s at 38, 31.90 at 37, 31.53 at 36; now 31.18 against 31.26).
    normalRunoff: 35.3,
    hurryUpRunoff: 20,
    mediumRunoff: 33,
    drainClockRunoff: 40,
    noHuddleRunoff: 26,
    // After a penalty outside the late windows (real seconds to the next snap in neutral time 14.6,
    // the clock restarting on the ready signal). FITTED.
    penaltyRunoff: 9,
    snapToWhistleMin: 4,
    snapToWhistleMax: 7,
    fieldGoalSeconds: 5,
    puntSeconds: 7,
    kickoffSeconds: 6,
    lateGameSeconds: 300,
    overtimeHurryClock: 300,
    // NFLVERSE S3 — timeouts. Real teams use 3.81 a game. A defence trailing in the last two minutes
    // of the game uses one after any play that leaves the clock running (as before), and with
    // `lateDefenseTimeoutChance` from five minutes out; in the last two minutes of the first half a
    // defence stops the clock with `halfDefenseTimeoutChance` and an offence with
    // `halfOffenseTimeoutChance`; a tied or trailing offence in the last two minutes of the game with
    // `hurryOffenseTimeoutChance`; and at any other snap either side calls an ordinary timeout at
    // `ordinaryTimeoutRate` per snap (offence share `offenseTimeoutShare`). FITTED.
    // Refitted in the final fit, by window: the play log had counted only the defence's timeouts, so
    // the S3 fit (0.7 / 0.55 for both halves / 0.5 / 0.08) really used 5.12 a game, most of them
    // early, and teams reached the end short of them. Real per team-game: Q1-Q2 before 2:00 0.57,
    // Q2 last 2:00 1.27, Q3-Q4 before 5:00 0.54, Q4 last 5:00 1.37 (total 3.75); sim now 0.61 /
    // 1.30 / 0.57 / 1.32 (seeds 1111-4444 x 2 seasons; the report reads 3.78 a game against 3.81).
    halfDefenseTimeoutChance: 0.33,
    halfOffenseTimeoutChance: 0.25,
    hurryOffenseTimeoutChance: 0.85,
    lateDefenseTimeoutChance: 0.9,
    ordinaryTimeoutRate: 0.03,
    offenseTimeoutShare: 0.66,
    // NFLVERSE S3 — kneels (real 0.774 per team-game). In Q4 a leading offence kneels once the kneels
    // it has before fourth down, less the opponent's timeouts, would each burn `kneelSeconds`. At the end of the
    // first half an offence in its own half kneels inside `halfKneelClock`. FITTED (final fit 42 -> 33,
    // once any late lead drained the clock: kneels read 0.971; now 0.802).
    kneelSeconds: 33,
    halfKneelClock: 15,
    halfKneelYardLine: 50,
    // NFLVERSE S3 — spikes (real 0.129 per team-game): a hurrying offence with no timeouts, inside
    // `spikeClock`, after a play that left the clock running, spikes with this chance. FITTED (final
    // fit 0.22 -> 0.44: teams now reach the end with more timeouts, and spikes had fallen to 0.064;
    // now 0.137).
    spikeClock: 60,
    spikeChance: 0.44,
    spikeSeconds: 2,
  },
  roster: {
    // Phase 4b work-order roster minimums, CHOSEN roster policy. C precedes OL so a missing
    // center fills both needs.
    minimums: [
      { label: 'C', positions: ['C'], count: 1 },
      { label: 'QB', positions: ['QB'], count: 2 },
      { label: 'RB/FB', positions: ['RB', 'FB'], count: 3 },
      { label: 'WR', positions: ['WR'], count: 4 },
      { label: 'TE', positions: ['TE'], count: 2 },
      { label: 'OL', positions: ['LT', 'LG', 'C', 'RG', 'RT'], count: 8 },
      { label: 'DL', positions: ['EDGE', 'DT'], count: 4 },
      { label: 'LB', positions: ['LB'], count: 3 },
      { label: 'DB', positions: ['CB', 'S'], count: 4 },
      { label: 'K', positions: ['K'], count: 1 },
      { label: 'P', positions: ['P'], count: 1 },
      { label: 'LS', positions: ['LS'], count: 1 },
    ] as const,
    depth: { starter: 0, second: 1, third: 2, fourth: 3 },
    composition: {
      QB: 3, RB: 4, WR: 6, TE: 3,
      LT: 2, LG: 2, C: 1, RG: 2, RT: 2,
      EDGE: 4, DT: 5, LB: 6, CB: 6, S: 4,
      K: 1, P: 1, LS: 1,
    },
    starterCounts: {
      QB: 1, RB: 1, FB: 0, WR: 3, TE: 1,
      LT: 1, LG: 1, C: 1, RG: 1, RT: 1,
      EDGE: 2, DT: 2, LB: 3, CB: 3, S: 2,
      K: 1, P: 1, LS: 1,
    },
    starterMean: 80,
    starterSd: 5.2,
    backupMean: 67,
    backupSd: 3.1,
    starterMin: 70,
    starterMax: 92,
    starMin: 93,
    starMax: 99,
    starChance: 0.025,
    backupMin: 62,
    backupMax: 72,
    replacementOverall: 55,
    replacementRating: 50,
    replacementAthleticRating: 60,
    teamTalentSd: 1.6,
    ratingNoiseSd: 4,
    minimumRating: 25,
    maximumRating: 99,
    baseSkillRating: 42,
    athleticOffset: 8,
    skillOffset: 0,
    secondarySkillOffset: -5,
    weakSkillOffset: -18,
    consistencyOffset: -6,
    potentialMeanBonus: 4,
    potentialSd: 4,
    ageMin: 21,
    // ⚠ UNCHANGED, but investigated in Phase 3.6 and worth recording. This bound shapes only
    // the INITIAL generated league: `generateAge` draws a triangular distribution over
    // [ageMin, ageMax], so 34 starts every save at a mean roster age of 27.5 while the
    // engine's own steady state is 26.0. The league therefore drifts for its first few years.
    // Drawing it younger (31) was tried and is NOT an improvement: it makes the early-year age
    // bubble larger, not smaller, because the bubble is driven by the generated roster being
    // uniformly better than the incoming draft classes rather than by its age, and it prices
    // Phase 2's free-agent market too high by removing the declining-age tail. See SUMMARY.md.
    ageMax: 34,
    ageMode: 25,
    accruedAgeOffset: 21,
    jerseyMin: 1,
    jerseyMax: 99,
    defaultHeight: 74,
    defaultWeight: 225,
    emptyTeamId: -1,
    replacementPlayerId: -1,
    // Phase 4b CHOSEN jersey ranges: conventional position bands with uniqueness per roster.
    jerseyRanges: {
      QB: [1, 19], RB: [1, 49], FB: [1, 49], WR: [1, 49], TE: [1, 49],
      LT: [50, 79], LG: [50, 79], C: [50, 79], RG: [50, 79], RT: [50, 79],
      EDGE: [50, 99], DT: [50, 99], LB: [40, 59], CB: [20, 49], S: [20, 49],
      K: [1, 19], P: [1, 19], LS: [40, 59],
    },
  },
  // Stage 3 (DEPTH W2): archetypes as correlated rating shapes. Each generated player at a shaped
  // position draws one shape and adds its offsets. Over the position's own overall skills the
  // offsets sum to zero, so overall (and so price) holds; offsets to ratings outside those skills
  // (a receiving back's catching, a dual threat's speed) are free. The label is derived for display
  // (generate.ts archetypeOf) and never read by the engine. Every value CHOSEN; the quarterback
  // shapes aim at DESIGN.md 5's four regions from a starter's 80.
  shapes: {
    QB: [
      { name: 'Pocket passer', weight: 0.22, offsets: { throwAccuracy: 6, processing: 6, poise: 6, awareness: 2, throwOnRun: -12, throwPower: -8, speed: -6 } },
      { name: 'Dual threat', weight: 0.2, offsets: { throwOnRun: 12, throwPower: 4, throwAccuracy: -6, processing: -6, poise: -2, awareness: -2, speed: 28, agility: 16, carrying: 20, vision: 20, breakTackle: 10 } },
      { name: 'Gunslinger', weight: 0.15, offsets: { throwPower: 12, throwAccuracy: -2, awareness: -6, processing: -4, aggression: 12 } },
      { name: 'Game manager', weight: 0.15, offsets: { awareness: 8, poise: 4, throwAccuracy: 4, throwPower: -10, throwOnRun: -6, aggression: -36 } },
      { name: 'Balanced', weight: 0.28, offsets: {} },
    ],
    RB: [
      { name: 'Power back', weight: 0.25, offsets: { breakTackle: 12, carrying: 6, speed: -8, agility: -10, strength: 16, catching: -6 } },
      { name: 'Elusive back', weight: 0.25, offsets: { agility: 12, speed: 6, vision: 2, breakTackle: -12, carrying: -8, strength: -8 } },
      { name: 'Receiving back', weight: 0.2, offsets: { agility: 6, vision: 2, carrying: -4, breakTackle: -4, catching: 28, routeRunning: 24, separation: 20, catchInTraffic: 12 } },
      { name: 'Balanced', weight: 0.3, offsets: {} },
    ],
    WR: [
      { name: 'Burner', weight: 0.2, offsets: { speed: 12, separation: 4, agility: 2, catchInTraffic: -10, catching: -4, routeRunning: -4 } },
      { name: 'Possession', weight: 0.2, offsets: { catchInTraffic: 10, catching: 6, routeRunning: 4, speed: -12, agility: -6, separation: -2, strength: 10 } },
      { name: 'Slot', weight: 0.2, offsets: { agility: 10, routeRunning: 6, separation: 4, speed: -4, catchInTraffic: -10, catching: -6 } },
      // DEPTH W4's hybrid: a receiver who can carry (Deebo).
      { name: 'Gadget', weight: 0.2, offsets: { agility: 6, speed: 4, catchInTraffic: 2, routeRunning: -8, separation: -4, carrying: 24, breakTackle: 24, vision: 18, strength: 12 } },
      { name: 'Balanced', weight: 0.2, offsets: {} },
    ],
    TE: [
      { name: 'Blocking', weight: 0.3, offsets: { runBlock: 14, strength: 10, catching: -6, routeRunning: -8, separation: -10, passBlock: 14 } },
      { name: 'Receiving', weight: 0.3, offsets: { routeRunning: 8, separation: 8, catching: 6, runBlock: -14, strength: -8, speed: 10 } },
      { name: 'Balanced', weight: 0.4, offsets: {} },
    ],
    OL: [
      { name: 'Pass protector', weight: 0.3, offsets: { passBlock: 8, awareness: 2, runBlock: -6, strength: -4, agility: 8 } },
      { name: 'Road grader', weight: 0.3, offsets: { runBlock: 8, strength: 6, passBlock: -8, awareness: -6 } },
      { name: 'Balanced', weight: 0.4, offsets: {} },
    ],
    EDGE: [
      { name: 'Speed rusher', weight: 0.3, offsets: { speed: 10, passRush: 8, strength: -8, runDefense: -6, blockShedding: -4, agility: 8 } },
      { name: 'Power rusher', weight: 0.25, offsets: { strength: 10, blockShedding: 6, runDefense: 2, speed: -12, passRush: -6 } },
      { name: 'Run stopper', weight: 0.2, offsets: { runDefense: 12, strength: 6, blockShedding: 2, passRush: -12, speed: -8, tackling: 8 } },
      { name: 'Balanced', weight: 0.25, offsets: {} },
    ],
    DT: [
      { name: 'Penetrator', weight: 0.3, offsets: { passRush: 12, blockShedding: 2, strength: -6, runDefense: -6, tackling: -2, speed: 10, agility: 8 } },
      { name: 'Nose tackle', weight: 0.3, offsets: { strength: 10, runDefense: 10, passRush: -12, tackling: -4, blockShedding: -4 } },
      { name: 'Balanced', weight: 0.4, offsets: {} },
    ],
    LB: [
      { name: 'Coverage', weight: 0.25, offsets: { speed: 10, playRecognition: 4, runDefense: -6, hitPower: -8, manCoverage: 20, zoneCoverage: 24, agility: 8 } },
      { name: 'Thumper', weight: 0.25, offsets: { runDefense: 8, hitPower: 10, tackling: 4, speed: -12, playRecognition: -10, strength: 12, blockShedding: 10 } },
      { name: 'Pass rusher', weight: 0.15, offsets: { speed: 4, hitPower: 4, playRecognition: -4, tackling: -4, passRush: 24, blockShedding: 12 } },
      { name: 'Balanced', weight: 0.35, offsets: {} },
    ],
    CB: [
      { name: 'Man', weight: 0.3, offsets: { manCoverage: 10, speed: 6, zoneCoverage: -8, playRecognition: -8 } },
      { name: 'Zone', weight: 0.3, offsets: { zoneCoverage: 10, playRecognition: 8, manCoverage: -8, speed: -6, agility: -4 } },
      { name: 'Slot', weight: 0.15, offsets: { agility: 10, zoneCoverage: 2, speed: -6, manCoverage: -6, tackling: 10 } },
      { name: 'Balanced', weight: 0.25, offsets: {} },
    ],
    S: [
      { name: 'Free safety', weight: 0.3, offsets: { zoneCoverage: 10, speed: 6, playRecognition: 4, tackling: -10, hitPower: -10, manCoverage: 8 } },
      { name: 'Box safety', weight: 0.3, offsets: { tackling: 10, hitPower: 10, zoneCoverage: -10, speed: -10, runDefense: 16, strength: 10 } },
      { name: 'Balanced', weight: 0.4, offsets: {} },
    ],
  },
  cap: {
    // CBA limits and accounting precision are rules. The synthetic contract/offseason values
    // below are deliberately chosen test-fixture policy, not fitted NFL market estimates.
    fullCapShare: 100,
    accountingScale: 1_000_000,
    maxProrationYears: 5,
    maxPostJune1Designations: 2,
    // CHOSEN — a CBA rule taken from general knowledge, ⚠ not derived from anything in this repo (2020
    // CBA Article 7, as best known): a drafted player's rookie contract may not be renegotiated until
    // after his third regular season. Read by CAP-1's legality last resort, which must be something a
    // real club could legally do; the compliance pass does not honour it (SUMMARY.md). The harness row
    // that checks it uses its own literal, so the check does not read this constant.
    rookieRenegotiationSeasons: 3,
    noGuaranteedYear: -1,
    signingBonusFractionPrior: 0.50, // modeling prior, not an empirical league median
    signingBonusFractionSensitivity: [0.25, 0.50, 0.75] as const,
    syntheticContractYearsMin: 1,
    syntheticContractYearsMax: 5,
    syntheticVoidYears: 1,
    syntheticVoidChance: 0.16,
    syntheticOverallFloor: 60,
    syntheticOverallRange: 39,
    syntheticAnnualValueMin: 0.35,
    syntheticAnnualValueRange: 8.65,
    syntheticValueExponent: 2,
    syntheticGuaranteeShare: 0.45,
    syntheticSalaryEscalation: 0.08,
    guaranteedBaseYears: 1,
    replacementContractYears: 2,
    expensiveCutTeamsPerYear: 8,
    tradePairsPerYear: 1,
    optionBonusTeamsPerYear: 4,
    optionBonusSalaryShare: 0.20,
    restructureConversionShare: 0.60,
    // CHOSEN. How many full restructure passes the offseason compliance step will make before it
    // gives up and starts releasing people. Four is enough that no club in a 12-season, 8-seed
    // run failed to reach the cap by restructuring plus cuts; it exists so the loop is bounded
    // rather than trusting the conversion floor to terminate it.
    maxComplianceRestructureRounds: 4,
    // ⚠ ADDED IN PLAYTEST 3, ALONGSIDE `maxRestructuredBonusShare` BELOW — NOT INSTEAD OF IT.
    //
    // THE MOST PRORATION A CONTRACT MAY CARRY, AS A SHARE OF WHAT IS STILL OWED ON IT. A ceiling
    // in percent-of-cap is the wrong dimension and it failed in the wrong direction: 20% of the
    // cap never binds on an ordinary deal and lets a max contract be walked all the way to it.
    // Measured, 8 seeds x 8 years: contracts signed in 2027 arrived at 2030 carrying EIGHT TO
    // THIRTEEN separate bonus events and up to 20.000% of the cap unamortised — the compliance
    // step restructuring the same deals every year, each conversion pushing money into a later
    // year that then got restructured again, until the final year was almost entirely proration
    // and releasing the player charged 10% of the cap in one hit.
    //
    // Because a restructure moves money from the base term into the bonus term and leaves the
    // total untouched, this ratio is a real constraint on the SHAPE of a deal rather than on its
    // size. DERIVED: swept 0.45 / 0.55 / 0.60 / 0.75 / 0.85 / 1.00 against league dead money,
    // the worst club-season and cap legality; see SUMMARY.md.
    maxRestructuredBonusOfRemaining: 0.60,
    // AND THE ABSOLUTE CEILING STAYS, because it answers a different question. The ratio above
    // bounds the SHAPE of a deal — how much of what is still owed may be proration. This bounds
    // what a single release or trade can charge in one hit, whatever the size of the contract,
    // and `test:phase6` gates it directly. Removing it in favour of the ratio alone took the
    // largest single dead-money charge in the league from 24.1% of the cap to 44.0%. A contract
    // may be restructured only while it is under BOTH.
    maxRestructuredBonusShare: 20,
    // CHOSEN. How many contracts one club may restructure in a single compliance pass — and the
    // offseason runs two, so at most twice this a year. A real front office restructures a
    // handful of big deals in a winter; this step used to convert every eligible contract on the
    // roster, four rounds deep, which is how one deal collected thirteen bonus events.
    maxComplianceRestructuresPerClub: 8,
    minimumCurrentBaseSalary: 0.05,
    capComplianceBuffer: 0.25,
    // CHOSEN. How much of the cap the MAIN LEAGUE LOOP leaves a club after its offseason
    // compliance pass. Distinct from `capComplianceBuffer`, which `simulateCapOffseasons` uses
    // and which stays at 0.25 so `test:cap-audit` is unaffected.
    leagueComplianceHeadroom: 5.0,
    minimumDistinctCapSpaces: 8,
    minimumExpensiveCutDeadMoneyShare: 0.35,
    offseasonYears: 10,
    acceptanceSeed: 104729,
  },
  // Phase 4b CHOSEN body estimates; weightPerInch encodes height/body correlation.
  physical: {
      QB: { height: 75, heightSd: 2, weight: 224, weightSd: 12, weightPerInch: 4 },
      RB: { height: 70, heightSd: 2, weight: 211, weightSd: 11, weightPerInch: 4 },
      WR: { height: 73, heightSd: 3, weight: 200, weightSd: 15, weightPerInch: 3 },
      TE: { height: 77, heightSd: 2, weight: 250, weightSd: 12, weightPerInch: 5 },
      OL: { height: 77, heightSd: 2, weight: 315, weightSd: 16, weightPerInch: 6 },
      EDGE: { height: 76, heightSd: 2, weight: 265, weightSd: 16, weightPerInch: 5 },
      DT: { height: 75, heightSd: 2, weight: 305, weightSd: 20, weightPerInch: 6 },
      LB: { height: 74, heightSd: 2, weight: 238, weightSd: 14, weightPerInch: 5 },
      CB: { height: 72, heightSd: 2, weight: 193, weightSd: 10, weightPerInch: 4 },
      S: { height: 73, heightSd: 2, weight: 205, weightSd: 11, weightPerInch: 4 },
      ST: { height: 73, heightSd: 2, weight: 210, weightSd: 15, weightPerInch: 4 },
  },
  coach: {
    // The centre of the coach profiles' passBias (generate.ts). Since NFLVERSE S3 a coach's pass
    // bias is a deviation from the real call model below, in logits: (passBias - passPlayShare) /
    // (passPlayShare x (1 - passPlayShare)), about +-5.5 points of pass rate per profile sd (CHOSEN).
    passPlayShare: 0.5732,
    profileSd: 0.055,
    neutral: 0.5,
    shortThirdDown: 2,
    // A team leading by more than this in the fourth quarter drains the play clock (CHOSEN: two
    // scores; real teams leading by 9+ in Q4 take 32.3 seconds between snaps).
    drainLead: 8,
    // NFLVERSE final fit: in the last two minutes a side tied or down by a field goal or less, at or
    // past this yard line (a kick of about 53 yards; CHOSEN), stops hurrying and plays for the last
    // kick. Real ones there take 27.8-29.4 s from a run to the next snap; out of range, 20.3-23.2.
    kickRangeYardLine: 65,
    // NFLVERSE final fit: a side down more than lateDeficit hurries from this much of the fourth
    // quarter left (it was clock.lateGameSeconds, 300). Real Q4s that start 9-21 apart give the
    // trailer 17.1 snaps and 2.75 drives; the sim gave 14.4 and 2.61, and ended 15-21-point games
    // within a score half as often (9% against 19%). CHOSEN from the pace table: real trailers by
    // 9+ take 32.9 s from a run to the next snap between 10:00 and 5:00, against 37-40 at level.
    twoScoreHurryClock: 600,
    lateQuarter: 3,
    urgencyFourthQuarter: 1,
    urgencyThirdQuarter: 0.5,
    urgencyCloseDeficit: 8,
    urgencyBase: 0.1,
    urgencyMid: 0.5,
    urgencyHigh: 0.85,
    // Overtime, level score. Must sit ABOVE urgencyDeepThreshold (0.8) or it changes nothing —
    // 0.75 fired but was below every threshold that actually alters play selection. forceBall
    // still cannot trigger here because it additionally requires trailing by more than 8.
    urgencyOvertimeTied: 0.90,
    forceBallClock: 30,
    forceBallDeficit: 8,
    riskScale: 100,
    maxReadsTrusted: 4,
    maxReadsSimple: 2,
    trustReads: 0.7,
    desperateDistance: 10,
    desperateRiskBonus: 20,
    redZoneRiskPenalty: 10,
    lateDeficit: 8,
    turboTempo: 100,
    drainTempo: 10,
    // NFLVERSE S3 — the no-huddle (real: 8.1% of neutral snaps, 2021-2025; 31.7% of snaps by a team
    // trailing by 9-14 late). Neutral: this base rate, moved by the coach's tempo in logits per
    // profile sd (CHOSEN 0.5); hurrying: this share. FITTED (final fit 0.06 -> 0.069: the neutral
    // no-huddle share read 6.8% against a real 7.8%; now 7.8%).
    noHuddleRate: 0.069,
    noHuddleTempoLogit: 0.5,
    hurryNoHuddleShare: 0.32,
    weightScale: 10,
    aggressionDeepScale: 1,
    conservativeThreshold: 0.4,
    conservativeSafeBonus: 2,
    conservativeDeepPenalty: 3,
    lowTrustThreshold: 0.4,
    lowTrustMediumPenalty: 1,
    lowTrustScreenBonus: 3,
    urgencyDeepThreshold: 0.8,
    urgencyShortPenalty: 2,
    urgencyDeepBonus: 3,
    // CHOSEN (Phase 0): a run on a later down with more than this to go is a draw.
    drawDistance: 8,
    aggressiveThreshold: 0.6,
    // Stage 3: the run's direction, replacing Phase 0's CHOSEN random weights (weightBase 1,
    // drawWeightBase 0.5, drawDistanceBonus 2, redZoneInsideBonus 1.5, outsideAggressiveBonus 1).
    // DERIVED (npm run nflverse:tables -- --only=usage; 2015-2025 designed runs outside short
    // yardage and the goal line, with a gap): the share that go outside (tackle or end), before the
    // red zone (n 107,689) and in it (n 16,723).
    outsideRunShare: { open: 0.495, redZone: 0.462 },
    // CHOSEN: an aggressive coach's tilt outside, in logits (about 10 points of share).
    outsideAggressiveLogit: 0.4,
    // FITTED: subtracted from every coach's logit so that, with the aggressive coaches' tilt and
    // the later-down draws (which count as inside runs, as a real draw does), the league runs
    // outside at the real shares.
    outsideRunLogitOffset: -0.28,
    // NFLVERSE S3. P(dropback) is an additive logit: down x distance + time-and-score state +
    // field zone. The grid is CHOSEN; the logits are DERIVED, a model fitted to every real call by
    // `npm run nflverse:tables -- --only=call` (the sim is not involved).
    call: {
      // Distance to go <= each limit: 1, 2, 3, 4-6, 7-10, 11+.
      toGo: [1, 2, 3, 6, 10, 99] as const,
      // Time groups: Q1-Q3 bar the end of the half; Q2 last two minutes; Q4 before the last five
      // minutes (and overtime); Q4 last five minutes.
      times: ['early', 'halfEnd', 'q4', 'q4Late'] as const,
      // Offence lead <= each limit: trailing 9+, trailing 1-8, level, leading 1-8, leading 9+.
      leads: [-9, -1, 0, 8, 99] as const,
      // Yard line (own goal = 0) <= each limit: backed up, open field, red zone.
      zones: [10, 79, 99] as const,
      referenceTime: 0,
      referenceLead: 2,
      referenceZone: 1,
      // DERIVED: a logit fitted to 358,262 real calls, 2015-2025, with no sim involved
      // (`npm run nflverse:tables -- --only=call`). base:
      // downs 1-4 x toGo; state: times x leads (0 at Q1-Q3, level); zone: backed up, open, red zone.
      // Checked against the report's situations within 2.3 points (3rd & 7+: 95.5% real, 93.3%).
      base: [[-1.419, -0.781, -0.728, -0.553, -0.144, 0.746], [-1.146, -0.755, -0.48, 0.026, 0.655, 1.402], [-1.251, 0.587, 1.532, 2.602, 3.068, 2.224], [-1.258, 1.209, 2.721, 2.709, 2.143, 1.99]],
      state: [[0.27, 0.066, 0, 0.006, -0.132], [1.781, 1.408, 1.278, 1.246, 1.12], [1.136, 0.309, 0.107, -0.181, -0.833], [1.912, 1.458, 0.393, -1.592, -2.717]],
      zone: [-0.573, 0, -0.187],
    },
  },
  passing: {
    // FITTED (0.0602 -> 0.0567 in the final fit): the league's sack rate to the real 6.5% once the
    // rate varies by situation (the sim reaches more 3rd and longs than real, where sacks cluster).
    // So this fit absorbs that defect: sackSituation is normalised to the league's 6.2% per
    // dropback, and the base sits 9% under it.
    sackRatePerDropback: 0.0567,
    // NFLVERSE final fit: passing by situation, in cells of down (1, 2, 3-4) x yards to go
    // (situationToGo: <= 2, <= 6, more; CHOSEN). A flat rate on every down gave early downs too many
    // sacks and incompletions and left too many 3rd and longs (sim 53.6% of 3rd downs at 7+ to go
    // against a real 47.3%), which 3rd and short then converted too often.
    situationToGo: [2, 6, 99] as const,
    // DERIVED (2015-2025, n 220,506 dropbacks): sacks per dropback by cell over the league's 6.2%;
    // multiplies sackRatePerDropback. Real sacks cluster on 3rd and long (10.2%) and are rare on 1st
    // down (4.9% on 1st and 7+).
    sackSituation: [0.398, 0.597, 0.793, 0.712, 0.769, 0.874, 0.907, 1.368, 1.631] as const,
    // DERIVED (2015-2025, passes outside the red zone, n 170,951): completions by cell over what
    // the cell's depth mix predicts, normalised to average 1 outside the red zone (the zone table
    // holds the level); multiplies the base completion rate. 1st and <= 6 outside the red zone is
    // too rare to read (n 383) and stays 1.
    completionSituation: [1, 1, 1.026, 1.029, 1.015, 1.015, 0.971, 0.92, 0.949] as const,
    // DERIVED (2015-2025, passes outside the red zone, n 170,951): each depth's share in the cell
    // (screen / short / medium / deep) over its share outside the red zone (20.9 / 44.4 / 21.4 /
    // 13.4%); multiplies the route weights, as routeZoneFactor does by field zone. 3rd and 3-6
    // throws half the screens and a quarter more short routes; 3rd and 7+ goes deeper; 1st and 2nd
    // and long throw more screens. It replaces Phase 0's CHOSEN distance bonuses (coach.veryLong*
    // past 15 to go, coach.short* inside 5), which threw deeper on 2nd and long than real teams do.
    routeSituationFactor: [[1, 1, 1, 1], [1, 1, 1, 1], [1.126, 0.945, 0.972, 1.03], [1.032, 1.04, 0.889, 0.995], [1.091, 1.047, 0.899, 0.862], [1.091, 1.039, 0.924, 0.849], [0.777, 1.268, 0.768, 0.83], [0.517, 1.235, 0.99, 0.99], [0.834, 0.839, 1.318, 1.285]],
    // NFLVERSE S3, FITTED: the league's interceptions per attempt to the real 2.30% (S1: n 5,790
    // team-games; the 96-game sample's 2.1% had set it lower). S5 made it the rate at a
    // league-average matchup: exp(-intEdgePerPoint x edge) averages above 1 over the league's spread
    // of matchups, so this sits below 2.30% and the league still reads 2.3%. FITTED (0.0236 -> 0.0186).
    // Stage 3 refits: 0.0214 with the group-centred pass edge, 0.0209 with the W2 shapes (0.808
    // interceptions per team against a real 0.788 at 0.0214).
    intPerAttempt: 0.0209,
    // NFLVERSE S3: a scramble's chance scales with the quarterback's speed,
    // exp((speed - scrambleSpeedReference) / scrambleSpeedScale). The reference is the league's
    // starting-QB mean speed (61.9 over 96 generated starters); the scale is CHOSEN (a p90 QB
    // scrambles about 2.2x as often as a p10 one). Stage 3 moved the rate itself into the pressure
    // branch (TUNING.pressure), which divides the factor by its league mean.
    scrambleSpeedReference: 62,
    scrambleSpeedScale: 12,
    // Scramble yards, DERIVED from scrambles outside the opponent's 30 (quantiles on
    // distributions.p; mean 7.74).
    scrambleYards: [-5.5, 0.56, 0.63, 0.7, 0.77, 0.9, 1.04, 1.18, 1.53, 1.82, 2.1, 2.39, 2.67, 2.94, 3.21, 3.49, 3.76, 4.03, 4.3, 4.57, 4.82, 5.08, 5.34, 5.61, 5.92, 6.22, 6.53, 6.89, 7.24, 7.6, 7.98, 8.37, 8.77, 9.18, 9.63, 10.23, 10.78, 11.31, 11.99, 12.82, 13.85, 15.19, 16.95, 19.66, 21.09, 22.99, 23.96, 25.13, 27.45, 29.74, 32.86, 38.93, 43.93, 48.14, 87.5] as const,
    // NFLVERSE S5, FITTED (550 -> 420): rating points per point of completion %, with the edges below.
    ratingEffectDivisor: 420,
    // NFLVERSE S5, FITTED: team strength through the passing game. The pass matchup (accuracy +
    // receiver skill - coverage - starterMean, rating points) also scales interceptions,
    // exp(-intEdgePerPoint x edge), and tilts a completion's draw on its yards table toward the long
    // end, u -> 1 - (1 - u)^exp(yardsTiltPerPoint x edge). Fitted to the real team-season spread of
    // net yards per dropback (sd 0.746 offence, 0.588 defence; the sim had 0.70x and 0.68x of it,
    // because yards on a completion and interceptions ignored every rating).
    // All three (and completion, through ratingEffectDivisor) read the edge over the league's: the
    // mean edge per pass is +19.07 rating points (measured on the report's league, 742,244 passes,
    // seeds 1111-8888 x 5 seasons; one seed alone ranges 17.9-21.2), so a league-average matchup
    // moves nothing. MEASURED; re-measure if coverageWeight, the play caller or the rosters move.
    // Stage 3: 1.1 once receiver skill and coverage read against their groups' means (usage), and
    // 2.05 with the W2 shapes (the starting quarterbacks' mean accuracy over 80, 711,935 passes).
    passEdgeCentre: 2.05,
    intEdgePerPoint: 0.018,
    yardsTiltPerPoint: 0.009,
    // The tables are right-skewed, so a tilt of the same size up and down lengthens the league's
    // average completion; the tilt reads the edge less this offset (rating points) so the league's
    // net yards per dropback stays at the real 6.25. FITTED (8 -> 13 in the audit refit: the league
    // read 6.43; now 6.25).
    yardsTiltOffset: 3,
    // NFLVERSE S5, FITTED: coverage's weight in the pass matchup. A pass faces whichever defender
    // covers its receiver, so a defence's quality is averaged over many players and its team-season
    // spread fell short (net yards/dropback allowed sd 0.476 against a real 0.588) while the
    // offence's matched.
    coverageWeight: 2.1,
    forcedCompletionPenalty: 0.12,
    forcedIntBonus: 0.025,
    // NFLVERSE S3, DERIVED (2015-2025, outdoor and open roofs, n 128,815 attempts): completion %
    // falls 0.134 points per mph of wind. The old 0.007 was 5.2x it. Indoor completion is 1.89
    // points above outdoor (n 56,528); net of outdoor wind (real mean 8.24 mph x 0.134) the roof
    // itself is worth 0.8 points. The old 0.035 was 4.4x that.
    windCompletionPenaltyPerMph: 0.0013,
    indoorCompletionBonus: 0.008,
    coldCompletionPenalty: 0.02,
    extremeColdCompletionPenalty: 0.055,
    rainCompletionPenalty: 0.018,
    snowCompletionPenalty: 0.028,
    homeRatingBoost: 13,
    // NFLVERSE S4 retired the late-game completion stand-in (Phase 4c: +0.20 to a team trailing by
    // 9-14 in the last five minutes, +0.09 to one trailing by 1-8). It stood in for no-huddle pace,
    // defences conceding underneath, fourth-down aggression, onside kicks and timeouts. S2-S3 model
    // all but one of those as themselves, and the one left is measured NEGATIVE: real teams trailing
    // by 9-14 late complete 60.7% against 65.5% in neutral time (n 4,835). With both boosts at 0
    // the sim completes 64.2% there (trailing 1-8: 57.2% against 57.8% real), so there is nothing
    // left to stand in for.
    // NFLVERSE S3, DERIVED (2015-2025, 196,000 throws): completion by depth in each route zone over
    // the depth's league rate. Near the goal line the field closes: inside the 10 short throws are
    // completed 49.2% (73.5% beyond the 40), medium ones 33.7%. Multiplies the route's base rate.
    // Replaces redZoneCompletionPenalty 0.03, a flat cut for every throw inside the 20.
    routeZoneCompletion: [[0.953, 0.697, 0.617, 1], [1.008, 1.013, 0.645, 0.958], [1.001, 1.02, 0.993, 0.902], [1.003, 1.041, 1.068, 1.034]],
    // Sack yards, DERIVED (quantiles on distributions.p; mean -6.64, sd 3.62, n 13,745). Replaces a
    // gauss of -6.8 sd 2.2 clamped at -12, whose sd was 0.6x real.
    sackYards: [-30, -17.81, -16.08, -15.08, -14.37, -13.44, -12.84, -12.33, -11.4, -10.8, -10.33, -9.99, -9.64, -9.36, -9.12, -8.88, -8.64, -8.42, -8.24, -8.05, -7.86, -7.68, -7.49, -7.29, -7.1, -6.9, -6.7, -6.51, -6.26, -6, -5.75, -5.5, -5.21, -4.92, -4.63, -4.28, -3.89, -3.49, -3, -2.51, -1.95, -1.37, -0.79, -0.3, -0.14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] as const,
    // NFLVERSE S3. Real pass depth by air yards (screen <= 0, short 1-9, medium 10-19, deep 20+),
    // 2015-2025: share of attempts 20.7 / 46.2 / 21.4 / 11.7%, completion 76.6 / 70.6 / 54.6 / 35.6%
    // (n 197,192). The engine's route is the call; the weights and base completion rates below are
    // FITTED so that, after the situational route adjustments (coachAI.ts) and the rating, weather
    // and pressure terms (playEngine.ts), the sim reproduces those real shares and rates.
    //
    // History: `routeCompletion` was 0.77 / 0.72 / 0.65 / 0.49, lowered 0.008 in Phase 4c to put
    // league completion % inside its band (see PHASE4C). The anchor for all of it was 0.6428, the
    // 96-game sample's completion rate; the population rate is 64.2% (S1). S3 set them to the real
    // rates; S5 refitted them to 0.78 / 0.72 / 0.555 / 0.36 once the matchup terms read the edge
    // over the league's (the sim then reads 76.6 / 71.0 / 54.7 / 35.5%). routeWeights were refitted
    // after passing.routeSituationFactor replaced the distance bonuses (deep read 13.2% of attempts
    // against 11.7%; screen 19.9 against 20.7): 0.204 / 0.5 / 0.225 / 0.074 -> the values below.
    routeWeights: { screen: 0.212, short: 0.504, medium: 0.227, deep: 0.06 },
    // NFLVERSE S3, DERIVED: how much more or less often each depth is thrown by yards to the goal
    // line (<= 10, <= 20, <= 40, beyond), as the zone's real share over the league's: nobody throws
    // deep inside the 10 (0 of 11,771 throws) and 78.5% of throws there are short. Multiplies the
    // route weights after the situational adjustments.
    routeZones: [10, 20, 40, 99] as const,
    routeZoneFactor: [[0.818, 1.698, 0.215, 0.0], [1.035, 0.906, 1.625, 0.17], [1.026, 0.941, 0.922, 1.329], [1.006, 0.965, 1.021, 1.09]],
    routeCompletion: { screen: 0.78, short: 0.72, medium: 0.555, deep: 0.36 },
    // Yards on a completion by depth, DERIVED from own-half throws (quantiles on distributions.p;
    // means 6.41 / 8.84 / 17.90 / 36.11, n 17,996 / 36,528 / 14,266 / 5,157), capped at the goal line
    // by the engine. The real long tail is in the table, so the old long-touchdown roll
    // (longTouchdownChancePerCompletion and its weather terms) is retired.
    completionYards: {
      screen: [-20, -6.58, -5.51, -4.93, -4.38, -3.48, -2.88, -2.35, -1.38, -0.7, -0.2, 0.22, 0.63, 1.01, 1.39, 1.75, 2.11, 2.46, 2.82, 3.17, 3.52, 3.85, 4.17, 4.5, 4.82, 5.14, 5.46, 5.79, 6.12, 6.45, 6.82, 7.19, 7.58, 8.05, 8.51, 9, 9.48, 10.32, 11.07, 11.87, 12.94, 14.39, 16.31, 19.25, 21.07, 23.7, 25.27, 28.09, 31.63, 36.34, 42.13, 52, 63.5, 69.5, 84.5] as const,
      short: [-9.5, 0.81, 1.26, 1.59, 1.78, 2.17, 2.53, 2.76, 3.32, 3.73, 4.06, 4.39, 4.66, 4.9, 5.14, 5.38, 5.62, 5.84, 6.06, 6.28, 6.5, 6.73, 6.96, 7.19, 7.42, 7.66, 7.91, 8.16, 8.41, 8.64, 8.87, 9.1, 9.33, 9.62, 10.07, 10.52, 10.96, 11.4, 11.99, 12.66, 13.48, 14.59, 16.19, 18.55, 20.13, 22.08, 23.49, 25.41, 28.23, 32.37, 37.07, 46.86, 57.38, 67.32, 95.5] as const,
      medium: [-5.5, 9.3, 9.59, 9.7, 9.81, 10.03, 10.25, 10.47, 10.84, 11.2, 11.55, 11.88, 12.2, 12.52, 12.84, 13.15, 13.46, 13.76, 14.05, 14.35, 14.64, 14.94, 15.24, 15.53, 15.83, 16.13, 16.43, 16.76, 17.1, 17.43, 17.79, 18.15, 18.51, 18.92, 19.33, 19.82, 20.37, 21.1, 21.9, 22.8, 24, 25.46, 27.78, 31.54, 34.07, 37.24, 39.79, 43.56, 47.9, 53.52, 57.52, 64.23, 71.37, 75.38, 89.5] as const,
      deep: [11.5, 19.53, 19.64, 19.76, 19.88, 20.11, 20.35, 20.59, 21.22, 21.82, 22.4, 22.93, 23.43, 23.97, 24.51, 25.09, 25.67, 26.24, 26.83, 27.44, 28.08, 28.75, 29.48, 30.2, 30.95, 31.72, 32.54, 33.62, 34.74, 35.85, 36.96, 38.07, 39.24, 40.88, 42.35, 43.93, 45.47, 47.38, 49.52, 51.44, 53.35, 56.19, 59.99, 65.83, 68.32, 71.45, 73.94, 75.03, 76.24, 79.77, 83.28, 87.84, 92.06, 96.78, 98.5] as const,
    },
    outOfBoundsChance: 0.13,
    // Phase 3.6: catching + routeRunning + separation. CHOSEN.
    receiverSkillTerms: 3,
    // Stage 3 (DEPTH W1): a covering defender's coverage is (manCoverage + zoneCoverage +
    // playRecognition) / this. CHOSEN.
    coverageTerms: 3,
    // Stage 3 (DEPTH W1 `blockShedding`): the rush's share of blockShedding beside passRush. CHOSEN.
    rushBlockShedding: 0.25,
    // Stage 3 (DEPTH W1 `throwPower`): the quarterback's arm in the pass edge, rating points per
    // point over the reference, screen / short / medium / deep. The shape (none short, half as much
    // medium as deep) is CHOSEN; the level is FITTED (deep 1 -> 0.5, with catchInTrafficWeight 0.5
    // -> 0.25) to the real team-season spreads that W1 overshot at full strength: points per game
    // sd 4.46 and point differential sd 6.25 against a real 4.25 and 6.03 (4.31 and 6.05 now).
    throwPowerWeight: [0, 0, 0.25, 0.5],
    // MEASURED (the 8 report leagues x 5 seasons): the mean throwPower of the quarterbacks throwing
    // medium and deep, so the league's edge is unmoved.
    throwPowerReference: 79.9,
    // Stage 3 (DEPTH W1 `catchInTraffic`): the receiver's hands in traffic on contested throws
    // (medium routes, and every throw in the red zone), rating points per point. FITTED with
    // throwPowerWeight above (0.5 -> 0.25).
    catchInTrafficWeight: 0.25,
    // MEASURED (the 8 report leagues x 5 seasons, 218,729 contested throws): each group's mean
    // catchInTraffic on contested throws.
    catchInTrafficReference: { WR: 81.2, TE: 77.9, RB: 46.8 },
    // NFLVERSE S3: the completion-yards tables read throws snapped from inside this yard line (the
    // offence's own half), so the goal line cannot cut the real tail short before the engine applies
    // its own cap. CHOSEN.
    tableYardLineMax: 50,
  },
  rushing: {
    // NFLVERSE S3: a designed run's yards are drawn from the real distribution, DERIVED from
    // 97,202 designed runs snapped outside the opponent's 30, short yardage excepted (quantiles on
    // distributions.p; mean 4.68; <= 0: 17.4%, 1-3: 34.9%, 4-9: 35.8%, 10-19: 9.1%, 20+: 2.8%), then
    // shifted by the blocking-and-vision matchup below. It replaces a gauss (yardsMean 4.24, yardsSd
    // 4.35, clamped to -5..22) plus a separate breakaway draw, which could not make the real shape:
    // 1-3 yards were 24.5% of runs against 37.0%, 4-9 yards 43.1% against 33.3%. Until the final fit
    // one table held every run, short yardage too, which gave early downs the loaded box's stuffs.
    runYards: [-15, -5.29, -4.27, -3.66, -3.24, -2.53, -2.11, -1.7, -0.98, -0.42, -0.11, 0.2, 0.51, 0.76, 1, 1.24, 1.49, 1.69, 1.89, 2.09, 2.29, 2.5, 2.7, 2.9, 3.11, 3.31, 3.52, 3.75, 3.99, 4.22, 4.45, 4.75, 5.05, 5.36, 5.73, 6.15, 6.59, 7.16, 7.8, 8.55, 9.33, 10.74, 12.36, 15.02, 16.62, 19.03, 20.71, 23.15, 26.7, 32.74, 38.63, 48.23, 59.55, 69.41, 99] as const,
    // Runs on 3rd or 4th and <= shortYardageToGo, DERIVED the same way (n 6,899; mean 3.68; <= 0:
    // 25.1%, 1-3: 45.6%, 4-9: 20.0%, 10-19: 6.3%, 20+: 3.1%).
    shortYardageRunYards: [-15, -5, -3.81, -3.22, -2.81, -2.19, -1.69, -1.35, -0.75, -0.41, -0.26, -0.11, 0.04, 0.19, 0.34, 0.49, 0.71, 0.92, 1.13, 1.35, 1.53, 1.65, 1.77, 1.89, 2.01, 2.13, 2.25, 2.37, 2.49, 2.67, 2.87, 3.06, 3.26, 3.45, 3.76, 4.11, 4.46, 4.99, 5.57, 6.33, 7.39, 9, 10.98, 14.11, 16.29, 19.9, 22.1, 24.84, 29.44, 35.7, 40.35, 50.7, 58.7, 66.05, 90.5] as const,
    // Phase 4d, DERIVED: 18 -> 36. Team-season yards per carry was dispersed at sd 0.631
    // (Phase 4c, 5 seeds) / 0.588 (8 seeds x 3 seasons) against a real-NFL ~0.36 — 1.63x too
    // wide, while every other channel sat at or below real. Decomposing the season figure into
    // the part that is sampling noise on ~470 carries and the part that is team talent shows
    // the defect is worse than the headline: sampling 0.265, TEAM TALENT 0.525, against a real
    // NFL talent component of ~0.177 once its own sampling noise (6.5 / sqrt(430) = 0.313) is
    // removed. Talent spread is linear in 1/divisor, so the sweep is a straight line:
    //   divisor 18 -> ypc sd 0.588 (1.63x)  talent 0.525
    //   divisor 24 -> ypc sd 0.471 (1.31x)  talent 0.390
    //   divisor 30 -> ypc sd 0.428 (1.19x)  talent 0.337
    //   divisor 36 -> ypc sd 0.381 (1.06x)  talent 0.278
    //   divisor 44 -> ypc sd 0.340 (0.94x)  talent 0.218
    // 36 is the first value clear of the 1.2x ceiling rather than sitting on it, and it also
    // cut the sim's excess negative home/away score covariance (gate seed -7.78 -> -3.94
    // against a real ~-3.25 implied by a 13.84 total sd and a 9.95 team-score sd): a team with
    // an over-expressed run game held the ball and suppressed its opponent.
    // NFLVERSE S5, FITTED: 36 -> 33 with runDefenseWeight and passThreatWeight below (the Phase 4d
    // sweep above measured an engine that no longer exists and is kept as history).
    ratingEffectDivisor: 33,
    // NFLVERSE S5, FITTED: the front's run defence weight in the run matchup (team-season yards per
    // carry allowed sd 0.303 against a real 0.407; the offence's side matched at 0.396 / 0.428).
    // With it, passThreatWeight and ratingEffectDivisor 36 -> 33, the sim reads 0.388 allowed and
    // 0.453 gained (audit refit report).
    runDefenseWeight: 2.4,
    // Stage 3 (DEPTH W1): the front's run defence blends a lineman's blockShedding and a
    // linebacker's playRecognition in at these shares beside runDefense. CHOSEN.
    frontBlend: { blockShedding: 0.25, playRecognition: 0.5 },
    // Stage 3 (DEPTH W1 `tackling`): the second level's (LB1-2, S1-2) mean tackling against runs,
    // rating points per point over the reference. CHOSEN.
    tacklingWeight: 0.5,
    // MEASURED (the 8 report leagues x 5 seasons, per designed run, n 525,570).
    tacklingReference: 82.3,
    // Stage 3 (DEPTH W1 `strength`): at the goal line and in short yardage, the line's strength over
    // the front's, rating points per point over the league's mean difference. CHOSEN.
    powerLineWeight: 0.5,
    // MEASURED (per goal-line and short-yardage run, n 43,315).
    powerLineCentre: 11.5,
    // Stage 3 (DEPTH W1 `stamina`): in the fourth quarter and overtime, the trench's mean stamina
    // over the other trench's, rating points per point, on runs and on the rush. CHOSEN. Stamina is
    // drawn at every player's level, so the league's mean edge is 0.
    lateStaminaWeight: 0.5,
    // NFLVERSE S5, FITTED: the quarterback's accuracy in the run matchup (rating points per point
    // over starterMean). A team's passing and running move together in the real league (in-season
    // team-season r 0.222 between net yards/dropback and yards/carry, n 352) and not in the sim
    // without it (0.055): nothing else links the two, because different players carry them. The
    // sim reads 0.249 with it (audit refit report; 0.210-0.249 across the final-fit runs).
    passThreatWeight: 0.77,
    // A rusher faster than a starter gets this much extra chance, per point of speed over
    // `roster.starterMean`, of a draw from the table's top `breakawayTail` (the 20-yard-plus runs).
    // CHOSEN: it carries over the old breakaway's speed term (speed - starterMean) / 4200.
    breakawayTail: 0.029,
    // NFLVERSE S3, FITTED: yards taken off a designed run inside the opponent's 20, on top of the
    // goal line's own cap, so red-zone runs gain the real 2.71 a carry (n 23,624).
    redZoneYardsPenalty: 0.55,
    // NFLVERSE S3, FITTED: yards added to every designed run so the league's matchup term centres
    // the real table on the real yards per carry (4.27; the sim read 4.13 without it). Refitted in
    // S5 (0.17 -> 0.25) for the weighted run matchup, and in Stage 3 (0.25 -> 0.17) when the
    // carrier's vision began to read against his group's league mean rather than starterMean, and
    // (0.17 -> 0.14) when receivers took their real carries at their real yards (usage).
    runShift: 0.14,
    fumbleLostPerPlay: 0.0083,
    fumbleEligibleMultiplier: 1.45,
    // NFLVERSE S2, DERIVED: the offence keeps 53.9% of its scrimmage fumbles (n 5,874, 2015-2025).
    fumbleRecoveryOffense: 0.5392,
    carryingEffectDivisor: 4200,
    hitPowerEffectDivisor: 5200,
    outOfBoundsChance: 0.08,
    // NFLVERSE S3: the run-yards table reads designed runs snapped from inside this yard line, so
    // the goal line rarely cuts the tail short. CHOSEN.
    tableYardLineMax: 70,
    // NFLVERSE S3: a designed run on 3rd or 4th and this many yards or fewer draws from
    // shortYardageRunYards (a loaded box); every other run from runYards. CHOSEN boundary.
    shortYardageToGo: 2,
  },
  // Stage 3 (DEPTH W1.1, NFLVERSE S7): pressure, and what the quarterback does with it. Replaces a
  // pocket-time loop whose result nothing read. A dropback is pressured or clean; a pressured one
  // ends in a sack, a scramble, a throwaway, a throw on the move or a throw from the pocket, a
  // clean one in all of those but the sack. The shares at a league-average quarterback are real;
  // his ratings move them.
  pressure: {
    // DERIVED (npm run nflverse:tables -- --only=pressure; FTN participation 2023-2025, n 60,543
    // dropbacks; FTN Data via nflverse, CC-BY-SA 4.0): pressured dropbacks, and each cell's
    // pressure rate over the league's (cells as passing.sackSituation).
    pressureRate: 0.3,
    pressureSituation: [1.078, 0.962, 0.895, 0.943, 0.928, 0.925, 1.025, 1.133, 1.3],
    // MEASURED (834,925 simulated dropbacks, seeds 1111-8888 x 5 seasons, with the W2 shapes and
    // blockShedding in the rush): the league mean of the line matchup, (pass rush - protection) /
    // passing.ratingEffectDivisor. Pressure reads the matchup over it, so the league's pressure rate
    // is the real one.
    lineCentre: 0.0035,
    // FITTED (1 -> 0.36): the line matchup's weight on pressure, to the real team-season spread of
    // the pressure rate allowed (sd 3.9%, 96 FTN team-seasons; the sim read 9.7% at 1, 3.9% at 0.36
    // when fitted). With the W2 shapes and W1's blockShedding in the rush it reads 4.4% (inside 3
    // SE; not refit). 1 would move sacks exactly as the old sack roll did; the quarterback now
    // carries part of it.
    lineWeight: 0.36,
    // DERIVED, same dropbacks: pressured (n 18,187) and clean (n 42,356) outcomes, as shares of the
    // dropbacks that did not end in a sack (every real sack is a pressure): scramble / throwaway /
    // throw on the move / throw from the pocket. Throws split by FTN's out-of-pocket flag
    // (pressured 27.9%, clean 7.6%).
    pressuredShares: [0.0974, 0.1154, 0.2193, 0.5666],
    cleanShares: [0.042, 0.012, 0.0719, 0.8741],
    // DERIVED: completion and interception per throw (throwaways out) over the league's per
    // attempt (throwaways in, 64.97% and 2.257%), clean pocket / clean move / pressured pocket /
    // pressured move (71.5 / 70.4 / 55.1 / 53.1% and 2.0 / 2.1 / 3.6 / 3.4%). They multiply the
    // route's completion and interception chances, which were fitted per attempt.
    completionFactor: [1.1005, 1.0836, 0.8481, 0.8173],
    interceptionFactor: [0.886, 0.93, 1.595, 1.506],
    // FITTED: the scramble factor, exp((speed - 62) / 12) capped, is divided by this. The FTN
    // seasons scramble on 5.2% of dropbacks and 2015-2025 on 4.33% (the S3 target, n 220,506), so
    // the level is fitted to the window's rate and the pressured-to-clean ratio kept. With the W2
    // shapes' dual threats (1.52 -> 1.81, and the cap 4 -> 3 below) the rate reads 4.3%.
    scrambleSpeedMean: 1.81,
    // MEASURED (the 8 report leagues x 5 seasons, per dropback, with the W2 shapes): the references
    // the rating factors below read against, (processing + poise + awareness) / 3 for sacks,
    // (processing + awareness) / 2, throwOnRun, aggression (pressured dropbacks for the first and
    // last). Each is the rating at which its factor's league mean is 1, (1/k) ln E[exp(k x rating)]:
    // with shaped quarterbacks the plain mean (aggression 76.8 against 79.1) left a factor of mean
    // 1.1 and lifted interceptions.
    pocketReference: 81.1,
    readsReference: 81.9,
    throwOnRunReference: 81,
    aggressionReference: 79.1,
    // Rating points to a factor, exp(this x (rating - reference)), on the dropback's outcomes: more
    // throwaways for reads (processing, awareness), more throws on the move for throwOnRun, more
    // throws from the pocket under pressure for aggression. FITTED (CHOSEN 0.04 -> 0.025) with the
    // W2 shapes, to the real team-season spread of throwaways per dropback (sd 1.2%, 96 FTN
    // team-seasons; the shaped league read 1.8% at 0.04, 1.3% now). 10 points is 1.28x.
    ratingPerPoint: 0.025,
    // FITTED (0.04 -> 0.02 -> 0.01): the same for fewer sacks per pressure with pocket sense
    // (processing, poise, awareness), toward the real team-season spread of sacks per pressure (sd
    // 4.8%, 96 team-seasons). With the W2 shapes it reads 5.7% (7.9% at 0.02 and ratingPerPoint
    // 0.04): still wide, not fitted further.
    sackRatingPerPoint: 0.01,
    // FITTED (CHOSEN 4 -> 3) with the W2 shapes' dual threats: the scramble factor's cap, to the real
    // team-season spread of scrambles per dropback (sd 2.5%; the shaped league read 3.1% at 4, 2.8%
    // now).
    scrambleFactorMaximum: 3,
    // CHOSEN (DEPTH W1.1): a throw on the move completes 1 + this x (throwOnRun - reference) times
    // as often (10 points is 5%), and a throw from the pocket under pressure is intercepted
    // exp(ratingPerPoint x (aggression - reference)) times as often.
    moveAccuracyPerPoint: 0.005,
  },
  // Stage 3 (DEPTH W1.2): who gets the credit for a tackle, a sack or an interception. The ROLE is
  // drawn from the real share for that kind of play; within the role, each depth slot in proportion
  // to its real season snap share, scaled by the player's fitness for the credit. Stats only: which
  // defender is credited moves no yard, except through the tackler's hitPower on fumbles.
  credit: {
    // Engine roles, in the order of every share below.
    roles: ['EDGE', 'DT', 'LB', 'CB', 'S'] as const,
    // DERIVED (npm run nflverse:tables -- --only=credit; 2015-2025, solo tackles on non-touchdown
    // plays that ended with a carrier down, roles from PFF's position; n 189,953). Inside runs are
    // middle and guard, outside runs tackle and end; the engine's insideRun and draw are inside.
    tackleRoleShares: {
      inside: [0.196, 0.268, 0.278, 0.069, 0.188],
      outside: [0.166, 0.179, 0.279, 0.144, 0.232],
      scramble: [0.177, 0.091, 0.334, 0.16, 0.238],
      screen: [0.093, 0.06, 0.301, 0.272, 0.274],
      short: [0.036, 0.008, 0.281, 0.393, 0.282],
      medium: [0.012, 0.001, 0.12, 0.45, 0.416],
      deep: [0.006, 0, 0.077, 0.459, 0.458],
    },
    // DERIVED, same plays: the share of tackles made with an assist (tackle_with_assist). The engine
    // credits a second tackler on these, so its tackle totals count like NFL.com's combined column.
    assistedTackleShare: { inside: 0.183, outside: 0.141, scramble: 0.022, screen: 0.083, short: 0.062, medium: 0.034, deep: 0.015 },
    // DERIVED: sack credit (half sacks 0.5, n 13,646.5) and interceptions (n 4,555) by role.
    sackRoleShares: [0.526, 0.277, 0.119, 0.027, 0.051],
    interceptionRoleShares: [0.042, 0.017, 0.16, 0.383, 0.398],
    // DERIVED (npm run nflverse:tables -- --only=snaps; 2015-2025 snap_counts, 352 team-seasons):
    // mean season snap share of each depth slot at the role, the within-role credit weight.
    slotShare: {
      EDGE: [0.716, 0.558, 0.382, 0.232],
      DT: [0.661, 0.527, 0.391, 0.265],
      LB: [0.845, 0.62, 0.307, 0.147],
      CB: [0.853, 0.664, 0.439, 0.24, 0.116],
      S: [0.904, 0.724, 0.44, 0.211],
    },
    // CHOSEN: within a role, credit scales by exp(this x (fitness - starterMean)), fitness being
    // (tackling + playRecognition) / 2 for a tackle, (passRush + blockShedding) / 2 for a sack and
    // (coverage + playRecognition) / 2 for an interception. 10 points of fitness is 1.65x the credit.
    fitnessPerPoint: 0.05,
    // CHOSEN: the defender covering the targeted receiver is this many times likelier than his
    // role-mates to be the one credited with an interception.
    coverDefenderInterceptionWeight: 3,
  },
  // Stage 3 (DEPTH W4): who is targeted. One allocation over every receiver on the depth chart,
  // replacing Phase 4b's additive slot weights (1.36 / 1.12 / 0.96 / 0.76 + overall / 22), which
  // could not put more than about 1.4x WR3's targets on WR1 and read a back's RUSHING overall.
  usage: {
    targetGroups: ['WR', 'TE', 'RB'] as const,
    // DERIVED (npm run nflverse:tables -- --only=usage; 2015-2025, 191,000 targets by air yards):
    // each depth's share of targets by group, WR / TE / RB (backs include fullbacks).
    targetGroupShare: {
      screen: [0.343, 0.158, 0.498],
      short: [0.557, 0.26, 0.183],
      medium: [0.758, 0.216, 0.026],
      deep: [0.834, 0.139, 0.028],
    },
    // DERIVED (352 team-seasons): each rank's share of its group's targets over a season. The
    // engine renormalises over the ranks a team fields.
    targetRankShare: { WR: [0.382, 0.256, 0.171, 0.097, 0.053], TE: [0.63, 0.239, 0.097], RB: [0.543, 0.264, 0.116] },
    // FITTED: the weight of each depth slot, so that the slot's weight times its players' league
    // mean fitness reproduces the rank share above (a starter is fitter than his backup, and
    // targetRankShare already counts that once). The engine reads these, renormalised over the
    // slots a team fields.
    targetSlotWeight: { WR: [0.268, 0.23, 0.202, 0.162, 0.096], TE: [0.471, 0.337, 0.158], RB: [0.446, 0.322, 0.154] },
    // CHOSEN (DEPTH W4): a receiver's weight scales by exp(this x (route score - his group's
    // league mean)), clamped to DEPTH's stated span, so the best route runner at a group draws
    // about 3x the targets of the worst at equal slot.
    targetFitnessPerPoint: 0.07,
    fitnessMin: 0.5,
    fitnessMax: 1.6,
    // MEASURED (the 8 report leagues, seeds 1111-8888, rank-weighted over every team's receivers):
    // each group's mean route score by depth, screen / short / medium / deep, so a receiver of
    // league-average fitness for his group has fitness 1. Re-measure if generation moves.
    // Re-measured for the W2 shapes: each moved by the shift in the score at which the group's
    // slot-weighted mean clamped fitness is 1 (backs +1.7 to +3.1 from receiving backs; the rest
    // within 1.5), so the slot weights fitted against them still hold.
    targetFitnessReference: { WR: [71, 79.4, 79.2, 81.7], TE: [54.1, 77.3, 77.1, 66.6], RB: [66.2, 49.9, 50.3, 59.4] },
    // MEASURED (711,935 simulated passes, seeds 1111-8888 x 5 seasons, with the W2 shapes): the mean receiver skill,
    // (catching + routeRunning + separation) / 3, of each group's targets, and the mean coverage of
    // the defenders covering them (CBs, a linebacker, a safety). The pass edge reads both against
    // these, so the league's mix of targets by group does not move its completion rate. Coverage
    // re-measured when playRecognition joined it (DEPTH W1; TE 50.2 -> 61.4, RB 62.9 -> 69.3).
    receiverSkillReference: { WR: 82, TE: 78.6, RB: 54.6 },
    coverageReference: { WR: 81.5, TE: 61.4, RB: 69.3 },
    // Stage 3 (DEPTH W4): who carries a designed run, replacing rushing.leadRbCarryShare /
    // secondRbCarryShare / thirdRbCarryShare (0.60 / 0.25 / 0.10 of RB carries, CHOSEN), which
    // read no ratings and gave the quarterback no designed runs at all.
    // DERIVED (npm run nflverse:tables -- --only=usage; 352 team-seasons): each rank's share of the
    // backs' carries.
    backCarryShare: [0.58, 0.26, 0.1, 0.039],
    // FITTED: slot weight x the slot's league mean carry fitness reproduces backCarryShare, then
    // one pass against the report's season shares (0.424 / 0.34 / 0.15 read 52.9 / 30.3 / 12.2% of
    // the backs' carries). Refit with the per-game form and receivers' carries: 0.465 / 0.292 /
    // 0.123 / 0.064 read RB1 47.2%, RB3 9.5% of team carries against a real 48.1%, 8.3%; these
    // read 48.5%, 8.8%.
    backCarrySlotWeight: [0.474, 0.292, 0.107, 0.056],
    // DERIVED (2015-2025 designed runs): the quarterback's share on 3rd/4th and <= 2 (n 10,669),
    // inside the goal-line cut (n 4,065), and on other inside (middle, guard, or no gap recorded;
    // n 64,376) and outside (tackle, end; n 61,028) runs.
    quarterbackRunShare: { shortYardage: 0.218, goalLine: 0.117, inside: 0.035, outside: 0.045 },
    // CHOSEN: the goal-line cell, runs snapped inside the opponent's 3.
    goalLineYards: 3,
    // FITTED (Stage 3, W2): the share of outside designed runs a team gives its receivers when it
    // has one who can carry, so that the league's receivers take the real 6.1% of outside designed
    // runs (DERIVED: jet sweeps, reverses; n 61,028) when only about half the teams have one.
    receiverOutsideRunShare: 0.124,
    // CHOSEN (DEPTH W4): a receiver enters the carry allocation only at carrying and breakTackle
    // at or above this.
    hybridCarryThreshold: 60,
    // CHOSEN: the carry fitness strength, the same as the targets'.
    carryFitnessPerPoint: 0.07,
    // MEASURED (the 8 report leagues): each group's league mean carry score, inside / outside / draw
    // / power, backs rank-weighted, the starting quarterback, and receivers at the hybrid threshold.
    // With the W2 shapes the RB and QB rows moved by the shift in the clamped-fitness reference
    // (dual threats lift the quarterback's +1.7 to +3.2), and the WR row is the gadget receivers'
    // own reference, solved directly now that some reach the threshold.
    carryFitnessReference: { RB: [67.2, 74.4, 76.9, 59.2], QB: [44.7, 51.4, 45.3, 43.5], WR: [65.5, 82.4, 78.2, 64] },
    // MEASURED (the 8 report leagues x 5 seasons, with the W2 shapes): each group's mean carry
    // score on its carries of each kind, inside / outside / draw / power, which the run matchup reads
    // the carrier's score against. Replaces rusherVisionReference (vision alone: RB 77.5, QB 49,
    // WR 64.1).
    // Receivers carry outside runs only; their other columns are their carryFitnessReference.
    rusherScoreReference: { RB: [68.7, 76.2, 77.9, 61.9], QB: [47, 56.4, 49, 44.6], WR: [65.5, 83, 78.2, 64] },
    // DERIVED (designed runs outside short yardage, snapped inside the own 70): each group's mean
    // yards less the backs' (RB 4.63, n 91,486; QB 4.56, n 3,436; WR 6.21, n 3,132).
    carrierYardsOffset: { RB: 0, QB: -0.07, WR: 1.58 },
    // Stage 3 (DEPTH W1 `consistency`): a player's usage varies from game to game by a lognormal
    // multiplier of mean 1 (his season share holds). FITTED: its sd at a starter's consistency, for
    // carries to the game-leading rusher's real share of carries (58.4%, 5,790 team-games), and for
    // targets to the real week-to-week sd of receiving yards at a given season mean (S6, receivers
    // with 8+ targeted weeks: 23.5 / 31.8 / 38.5 / 46.6 yards at 20-40 / 40-60 / 60-80 / 80+ a week).
    // The game-leading receiver's share of catches (real 30.5%) then reads about 28%: a wider
    // target sd would overshoot the weekly spread, so it is left as a miss.
    formSd: { carries: 1, targets: 0.2 },
    // CHOSEN: the sd scales by exp(this x (a starter's consistency - his)), so a 10-point less
    // consistent player's usage swings about a third wider, at the same mean.
    consistencyPerPoint: 0.03,
  },
  penalties: {
    // NFLVERSE S3 + S5, DERIVED (2015-2025 bar 2020; `--only=pen`): accepted penalties per
    // scrimmage snap. The offence draws 4.72% whether it is home or away (the crowd does NOT add
    // false starts: away minus home is -0.05 a game). The defence draws 3.40% at home and 3.82% on
    // the road: the crowd's 0.42 points, applied to the away DEFENCE when the home team has the ball
    // and scaled by `context.crowdFactor` (2020, without crowds, has no home margin). Replaces
    // perSnap 0.074 + homeCrowdAwayBonus 0.025 on the away OFFENCE, split 56/44 by offenseShare.
    offensePerSnap: 0.0472,
    // Stage 3 (DEPTH W1 `awareness`): the offence's rate scales by exp(-this x (the line's mean
    // awareness - reference)). CHOSEN: 10 points is 18% fewer.
    awarenessPerPoint: 0.02,
    // MEASURED (per snap, the 8 report leagues x 5 seasons): the line awareness at which that
    // factor's league mean is 1, so the league's rate is the real one.
    awarenessReference: 78,
    defensePerSnap: 0.034,
    homeCrowdDefenseBonus: 0.0042,
    // DERIVED: 49.4% of offensive penalties are pre-snap (false start, delay, illegal formation,
    // shift, motion; 4.90 yards); the rest average 9.97 yards. Was preSnapShare 0.31.
    offensivePreSnapShare: 0.494,
    falseStartYards: 5,
    holdingYards: 10,
    // Defensive penalties: real 75.3% give a first down, averaging 10.76 yards (sd 7.93); the others
    // 5.31. FITTED: the automatic-first-down share (a 5-yard foul also gives one when it reaches the
    // line to gain) and the mean of the automatic-first-down foul's yards before its clamp. Final fit:
    // 0.67 -> 0.69 (the share read 73.9% against 75.5%; now 75.8%).
    automaticFirstDownShare: 0.69,
    passInterferenceMean: 9.9,
    passInterferenceSd: 7.93,
    passInterferenceMin: 5,
    passInterferenceMax: 40,
    defensiveHoldingYards: 5,
  },
  kicking: {
    // NFLVERSE S2, DERIVED (`npm run nflverse:tables -- --only=try`, 2015-2025): extra points made
    // 94.4% (n 13,445), two-point tries made 47.7% (n 1,322).
    extraPointRate: 0.944,
    twoPointRate: 0.4773,
    // NFLVERSE S2, DERIVED: the try-for-two decision. Q1-Q3: 4.2% of tries (n 10,470). Q4: a chart
    // on the scoring team's lead after the touchdown, -17 .. +17 (the end cells take any bigger
    // margin), n 4,297. The real chart is signed: down 2 goes for two 98% of the time, up 2 only 2%.
    // It replaces twoPointTryBase / twoPointTryLate / twoPointNeedScores (Phase 4c, CHOSEN), which
    // treated |lead| alike.
    twoPointTryEarly: 0.0416,
    twoPointTryFourthQuarter: [0.3788, 0.52, 0.0588, 0, 0.9268, 0.4839, 0.0853, 1, 0.3026, 0.2179, 0, 0.0225, 0.9901, 0.0113, 0, 0.9802, 0.1255, 0.0092, 1, 0.0171, 0.0093, 0.7209, 0.9506, 0.0162, 0.1509, 0.0139, 0.0409, 0.0556, 0.0435, 0.8393, 0, 0.0656, 0.1538, 0.0155, 0.0415] as const,
    // Retained only for the report's two-point rows (derive/s2Kicking.ts); the engine no longer reads it.
    twoPointNeedScores: [2, 5, 8, 11] as const,
    distanceBuckets: [30, 40, 50, 55, 60] as const,
    // NFLVERSE S2, DERIVED (`--only=fg`, 2015-2025, n 11,264): the make rate by kick-distance
    // bucket (<30, 30-39, 40-49, 50-54, 55-59, 60+) with the wind taken out: real made rate +
    // windPenaltyPerMph x the bucket's mean wind (indoor kicks at 0). Blocks count as misses, as in
    // the data (1.8% of attempts; the engine has no blocks). Real made rates 97.8 / 92.4 / 78.3 /
    // 70.2 / 60.2 / 37.5%.
    distanceRates: [0.9877, 0.9339, 0.7925, 0.7108, 0.6096, 0.3831] as const,
    ratingEffectDivisor: 500,
    // NFLVERSE S2, DERIVED: make rate per mph of wind with distance held fixed, outdoor and open
    // roofs, -0.00176 (se 0.0008, n 7,220). The old 0.006 was 3.4x the real effect.
    windPenaltyPerMph: 0.0018,
    indoorWind: 0,
    minAttemptRate: 0.05,
    maxAttemptRate: 0.995,
    baseMaxDistance: 59,
    powerDistanceDivisor: 4,
    powerBaseline: 75,
    // Clamp on a punt's gross yards (CHOSEN; wide enough for a pooch punt and a long bomb).
    puntMin: 15,
    puntMax: 75,
    // NFLVERSE S2, CHOSEN: a club's `scheme.aggressiveness` shifts every fourth-down go rate by this
    // many logits per sd of the coach profile (TUNING.coach.profileSd), so identity is a deviation
    // from the league's real rate. 0.4 logits is the spread of real team go rates around the
    // league's in a season. ⚠ General knowledge, not derived; the team-season spread of real go rates
    // could replace it.
    goAggressionLogit: 0.4,
    // A go rate of 0 or 1 has no logit; the table's rates are held this far inside (CHOSEN).
    goRateBound: 0.001,
    // NFLVERSE final fit (`npm run nflverse:tables -- --only=fg`, 2015-2025, n 202): in regulation, a
    // side tied or down by a field goal or less kicks before fourth down only as the last play; real
    // kicks like that come at a median of 0:03 left, 95% by 0:08 (max 0:20). The clock is DERIVED;
    // using the 95th percentile as the cut-off is a CHOSEN rule. Earlier, the drive plays on and the fourth-down
    // table (lateGoRate, lateFieldGoalShare) decides. It retires a stand-in that drained the clock
    // without a snap and kicked from 5:00 left down 3 (lateKickClock 300), 8:00 tied
    // (tiedLateKickClock 480, Phase 4c) and 0:45 down 1-2 (shortDeficitLateKickClock 45): 64% of
    // the sim's overtime games began with that kick, and the other side never got the ball back.
    lastPlayKickClock: 8,
    overtimeLateKickClock: 300,
    lateKickRemainingClock: 5,
    // NFLVERSE S2. The grids of the tables below are CHOSEN (coarse enough that every cell has
    // hundreds of plays); the values in them are DERIVED by `npm run nflverse:tables`.
    // Q4 try-for-two chart: the scoring team's lead after the touchdown, from -limit to +limit
    // (a bigger lead or deficit reads the end cell). CHOSEN range.
    twoPointLeads: 17,
    fourthDown: {
      // Rows: yards to go <= each limit. Columns: yards to the goal line <= each limit.
      toGo: [1, 2, 5, 9, 99] as const,
      yardsToGoal: [19, 30, 40, 50, 70, 99] as const,
      // Q4 inside `clock.lateGameSeconds`: trailing by <= each limit; columns: in or out of range.
      lateDeficits: [3, 8, 99] as const,
      lateYardsToGoal: [40, 99] as const,
      // DERIVED, 2023-2025 (era cause `fourth-down-analytics`), `npm run nflverse:tables -- --only=fourth`,
      // n 11,666 fourth downs. goRate: P(go for it). fieldGoalShare: P(field goal | not going),
      // the rest are punts. A field goal beyond the kicker's range becomes a punt.
      goRate: [[0.8971, 0.7982, 0.9203, 0.9267, 0.562, 0.1654], [0.5375, 0.4902, 0.5867, 0.6977, 0.1787, 0.0784], [0.1866, 0.2343, 0.4179, 0.4113, 0.0795, 0.0246], [0.0483, 0.0286, 0.1343, 0.0976, 0.0327, 0.0208], [0.033, 0.0129, 0.0707, 0.0608, 0.0298, 0.0046]],
      fieldGoalShare: [[1, 1, 1, 0.0909, 0, 0], [1, 1, 1, 0, 0, 0], [1, 1, 0.9231, 0.0274, 0, 0], [1, 1, 0.8776, 0.0232, 0, 0], [1, 1, 0.808, 0.05, 0, 0]],
      lateGoRate: [[0.0843, 0.6703], [0.9151, 0.7358], [0.7468, 0.8009]],
      lateFieldGoalShare: [[1, 0.2333], [1, 0], [1, 0.0222]],
      lateLevelGoRate: [0.2905, 0.0569],
      lateLevelFieldGoalShare: [0.9476, 0.0079],
    },
    // NFLVERSE S2: kickoffs under the 2025 rule (era cause `kickoff-2025`, owner decision §9.2b),
    // DERIVED from 2025 play-by-play (`--only=ko`), 2,742 kicks that were not onside.
    kickoff: {
      touchbackRate: 0.2104,
      returnRate: 0.7757,
      // Per returned kick (6 of 2,105 in 2025).
      returnTouchdownRate: 0.0028,
      // Where the receiving team's drive starts after a return, as quantiles on distributions.p.
      returnStart: [1.5, 9.12, 10.81, 12.43, 13.4, 14.74, 15.82, 16.89, 19.03, 20.33, 21.82, 22.66, 23.38, 24.1, 24.72, 25.22, 25.67, 26.06, 26.45, 26.89, 27.33, 27.7, 28.03, 28.36, 28.73, 29.14, 29.54, 29.87, 30.2, 30.53, 30.88, 31.22, 31.58, 32.01, 32.45, 32.97, 33.51, 34.14, 34.84, 35.7, 36.84, 38.97, 40.13, 42.7, 44.83, 46.93, 48.42, 51.86, 54.3, 56.54, 61.85, 73.13, 84.31, 86.41, 99] as const,
      // The average catch is 4.4 yards from the goal line: return yards = drive start - catch.
      catchSpot: 4.4,
      // The 1.4% of kicks neither touched back nor returned (out of bounds and the like): drive start.
      otherSpot: 36,
      // Onside kicks: Q4 inside `clock.lateGameSeconds`, kicking team trailing by <= each limit.
      onsideDeficits: [8, 99] as const,
      // Share of kickoffs that are onside, 2025: trailing by 1-8 late 31.0% (n 58), by 9+ 74.2%
      // (n 31); any other kick 0.4% (n 2,705).
      onsideLateShare: [0.3103, 0.7419] as const,
      onsideOtherShare: 0.0041,
      // Recovered by the kicking team: 2024-2025, the declared-onside rule set (8 of 104; 2025 alone
      // is 5 of 52, and its row is report-only, owner decision 2). CHOSEN window, DERIVED value.
      onsideRecovery: 0.0769,
      // Drive starts after an onside kick, 2024-2025: the receiving team's (n 95), and the kicking
      // team's when it recovers (n 8 — few; mirrors the receiving spot within a few yards).
      onsideReceivingSpot: 56,
      onsideKickingSpot: 51,
    },
    // NFLVERSE S2: punts, DERIVED from 2015-2025 (`--only=punt`, 23,893 unblocked punts), by yards
    // to the goal line at the snap. A punter pins a short field rather than booming it, so gross
    // yards and every outcome share depend on where the punt is from. Blocks (0.5%) are not modelled.
    punt: {
      // Yards to the goal line at the snap, <= each limit.
      yardsToGoal: [40, 50, 60, 70, 80, 90, 99] as const,
      // Gross yards of a punt that goes into the end zone (touchbacks): never short of the goal line.
      grossMean: [32.24, 37.56, 44.71, 48.74, 49.12, 49.31, 49.77] as const,
      grossSd: [5.61, 6.11, 7.44, 8.47, 8.57, 8.66, 8.29] as const,
      // Every other punt comes down this many yards from the goal line: a punter pins a short field
      // (8 yards out from inside the 40) and booms a long one. The mean is interpolated between the
      // zones' mean snap distances; the sd is the zone's.
      snapMean: [38.43, 45.96, 55.86, 65.87, 75.08, 84.84, 94.07] as const,
      landingMean: [8.06, 9.96, 12.83, 17.87, 26.16, 35.59, 44.3] as const,
      landingSd: [4.76, 4.99, 6.23, 8.19, 8.7, 8.96, 8.54] as const,
      touchbackRate: [0.2303, 0.1639, 0.133, 0.0453, 0.0083, 0.0018, 0] as const,
      fairCatchRate: [0.2645, 0.4498, 0.3585, 0.2408, 0.2, 0.1838, 0.1365] as const,
      // Per punt that is neither a touchback nor fair caught (0.6%, n 15,765).
      returnTouchdownRate: 0.0056,
      // Return yards on those punts, downed and out-of-bounds punts at 0, as quantiles on
      // distributions.p (mean 5.36).
      returnYards: [-10, -3.89, -2.56, -1.83, -1.26, -0.5, -0.47, -0.45, -0.4, -0.34, -0.29, -0.23, -0.18, -0.12, -0.07, -0.01, 0.04, 0.1, 0.15, 0.2, 0.26, 0.31, 0.37, 0.42, 0.48, 1.16, 2.17, 3.15, 4.09, 4.96, 5.75, 6.47, 7.19, 7.89, 8.56, 9.27, 10.03, 10.83, 11.66, 12.58, 13.68, 14.97, 16.57, 19.11, 20.47, 22.69, 24.15, 26.23, 29.16, 34.68, 40.44, 47.16, 55.82, 62.82, 82.5] as const,
    },
  },
  // NFLVERSE S2-S3. Every yardage distribution the engine draws from a real table is stored as
  // quantiles on this grid (CHOSEN: finer in the tails, where the long plays live). A draw is
  // u ~ U(0, 1), interpolated linearly between grid points, then rounded to the yard.
  distributions: {
    p: [0, 0.005, 0.01, 0.015, 0.02, 0.03, 0.04, 0.05, 0.075, 0.1, 0.125, 0.15, 0.175, 0.2, 0.225, 0.25, 0.275, 0.3, 0.325, 0.35, 0.375, 0.4, 0.425, 0.45, 0.475, 0.5, 0.525, 0.55, 0.575, 0.6, 0.625, 0.65, 0.675, 0.7, 0.725, 0.75, 0.775, 0.8, 0.825, 0.85, 0.875, 0.9, 0.925, 0.95, 0.96, 0.97, 0.975, 0.98, 0.985, 0.99, 0.993, 0.996, 0.998, 0.999, 1] as const,
  },
  scoring: {
    // Phase 3.7, CHOSEN; refitted to 0 in the NFLVERSE final fit. One draw per game, shared by both
    // teams, scaling the clock's runoff between snaps (gameEngine.ts runoffFor), so both teams get
    // more or fewer possessions together. It was sized for an engine whose home/away score covariance
    // was too negative (-7.78). Here it pushed the other way: pooled over 8 seeds the covariance was
    // +4.2 against a real -2.49 (2,895 games), and the sd of drives per game 3.68 against 3.21. At 0
    // they read +1.6 and 3.21. The rest of the covariance gap is the rosters' (a team's offence and
    // defence are drawn independently: in-season r of points/drive scored vs allowed +0.02 sim,
    // -0.09 real), not a pace effect, and the sd cannot go below 0. Kept as a knob.
    gameScriptTempoSd: 0,
    // Defensive return touchdowns. NFLVERSE S2, DERIVED (2015-2025): 9.2% of interceptions are
    // returned for a touchdown (n 4,560) and 8.9% of lost fumbles (n 2,708). The general-knowledge
    // values were 0.08 and 0.06.
    interceptionReturnTouchdown: 0.0921,
    fumbleReturnTouchdown: 0.089,
    // NFLVERSE S2, DERIVED (`--only=safety`, 2015-2025, 392,683 snaps): the chance a scrimmage snap
    // (penalties included) ends in a safety, by the offence's yard line <= each limit: 3.7% from the
    // 1-2 (n 1,311), 1.7% from the 3-5 (n 2,463), 0.5% from the 6-10 (n 7,522); 0.58 in 10,000
    // beyond. It replaces a geometric rule (any loss past the goal line) that gave 10.8% from inside
    // the 5 against a real 2.2%, and the unlabelled `safetyPerOffensivePlay` 0.00042 on top of it.
    // A loss that does not become a safety stops at the 1.
    safetyYardLines: [2, 5, 10] as const,
    safetyRate: [0.0366, 0.0171, 0.0053] as const,
    redZoneLine: 80,
  },
  homeField: {
    crowdFactor: 1,
    // NFLVERSE S5, DERIVED (2015-2025 bar 2020, `--only=pen`): the away offence is sacked 0.23 points
    // more per dropback (6.66% against 6.43%; 0.003 before the audit, read off rounded percentages)
    // and intercepted 0.09 points more per attempt (2.36% against 2.27%). Both scale with the crowd, as does passing.homeRatingBoost; 2020, without
    // crowds, had a home margin of +0.05 (CALIBRATION.md).
    awaySackBonus: 0.0023,
    awayIntBonus: 0.001,
    targetMargin: 1.74,
    restRatingPerDay: 0.18,
    maxRestRating: 1.2,
  },
  weather: {
    indoorTemp: 70,
    indoorWind: 0,
    coldMean: 34,
    coolMean: 44,
    mildMean: 58,
    warmMean: 72,
    hotMean: 84,
    tempSd: 12,
    windMean: 7,
    windSd: 5,
    windMin: 0,
    windMax: 24,
    rainChance: 0.12,
    snowChanceCold: 0.13,
    snowTemperature: 32,
    extremeCold: 20,
    coldPenalty: 0.025,
    extremeColdPenalty: 0.07,
    turfScoringBoost: 0.012,
  },
  season: {
    regularGames: 272,
    teams: 32,
    gamesPerTeam: 17,
    weeks: 18,
    playoffTeamsPerConference: 7,
    firstSeed: 1,
    initialYear: 2026,
    maximumGameSnaps: 350,
  },
  stats: {
    targetSharePrecision: 1000000,
  },
  // ---------------------------------------------------------------------------------------
  // PHASE 2 — FREE AGENCY
  // ⚠ EVERY CONSTANT IN THIS BLOCK IS A DESIGN CHOICE OR AN ESTIMATE FROM GENERAL KNOWLEDGE.
  // NONE IS FITTED FROM DATA. `positionalValue` in particular is the SPEC.md guess and should be
  // replaced with real APY-by-position once the nflverse player-season table lands.
  // See PHASE1-DATA-BRIEF.md, "The prize: constants that stop being guesses".
  // ---------------------------------------------------------------------------------------
  freeAgency: {
    days: 21,
    // The decay is what makes the market converge. Without it, everyone waits and nobody signs.
    askDecayPerDay: 0.04,
    openingAskMultiple: 1.05,
    maxOffersPerTeamPerDay: 3,

    // Market value: apy = maxBaseApy * normalized^valueExponent * positional * ageFactor
    // normalized = (overall - replacementOverall) / (ratingCeiling - replacementOverall)
    //
    // ⚠ RECALIBRATED IN PLAYTEST 1. The shipped curve priced the whole elite band at about HALF
    // the real market — an 85 at $10.9M against a real ~$22M — and the second symptom confirmed
    // it from the other side: the league spent 58.9% of the cap when real clubs run near the
    // ceiling. The user-visible consequence is what found it: a 90-overall receiver offered for
    // nothing was REFUSED, because his cap hit exceeded what the model thought he produced, so a
    // star read as a liability. Nothing in the trade code was wrong. See PLAYTEST-1.md.
    //
    // CALIBRATED TO TARGETS, NOT TO A FORMULA, and the two halves are fitted by different things:
    //
    //   positionalValue  DERIVED. One multiplier per position, solved from PLAYTEST-1.md's
    //                    published top-of-position table (QB 19% of cap, WR/EDGE/CB 11%, RB 6%,
    //                    K 2%) at the rating the best player at that position actually carries in
    //                    this league — QB 92.4, WR 94.1, EDGE 91.6, CB 92.5, RB 88.6, K 88.5,
    //                    measured over 8 seeds x 6 seasons. The twelve positions with no published
    //                    target keep their shipped relative values, scaled by 1.067, the mean
    //                    adjustment the six fitted ones required.
    //
    //                    ONE CORRECTIVE ITERATION ON THE SIX. The first solve was done at peak
    //                    age, and the best quarterback in a league is usually past it — so the
    //                    OBSERVED top-of-position value came in below the target that had been
    //                    fitted exactly (QB 16.1 against 18-20). The six were re-solved against
    //                    the observed figure, which is what the published table actually means:
    //                    what the best man at the position commands, at the age he is. The
    //                    twelve untargeted positions were deliberately left alone, because there
    //                    is no evidence about them either way and moving them would only spend
    //                    cap. `test:phase2`'s MARKET CALIBRATION block measures all six.
    //   valueExponent    CHOSEN, swept. The six targets all live at the top of the board and
    //                    cannot pin the SHAPE, so the shape is pinned by the aggregate target
    //                    instead — league cap usage 88-95%, which is a statement about the middle
    //                    of the distribution, where a roster's money actually goes. Swept at
    //                    steady state (seasons 8-12, so the contract-less opening league is not
    //                    mistaken for equilibrium):
    //
    //                      exponent   2.2     2.3     2.4     2.5     2.6
    //                      cap usage  95.5%   92.7%   91.2%   89.2%   86.8%
    //
    //                    2.4 sits mid-band and is closest to the real roster's money split.
    //
    // WORTH RECORDING: THE EXPONENT BARELY MOVED. 2.6 -> 2.4. The diagnosis in PLAYTEST-1.md was
    // that the curve is "too convex through the upper-middle", and it is, slightly — but the bug
    // was overwhelmingly the LEVEL. `maxBaseApy` 8.2 -> 12.17 is a 48% rise, and it is what took
    // cap usage from 58.9% to 91.0% and the overpaid share from 45.5% to 37.1%.
    replacementOverall: 55,
    ratingCeiling: 99,
    maxBaseApy: 12.170,
    valueExponent: 2.4,
    minimumApy: 0.32,
    // ⚠ UNCHANGED, and it now BINDS. 22% of cap is $66M at the 2026 limit, above any contract the
    // real league has signed, and at the recalibrated curve every quarterback above about 95
    // overall prices at exactly it. That is a real compression at the very top of the QB market
    // rather than an accident, but it means the curve cannot distinguish a 95 from a 99 there.
    maxApy: 22,

    positionalValue: {
      QB: 2.69, RB: 1.04, FB: 0.32, WR: 1.26, TE: 1.07,
      LT: 1.49, LG: 0.91, C: 0.91, RG: 0.91, RT: 1.17,
      // ⚠ EDGE IS AT ITS BAND EDGE AND HAS BEEN ALL ALONG. `test:phase2` wants the best edge
      // rusher in a league at 10-12% of the cap. Measured over 16 seeds, the engine before
      // Playtest 3 produced 10.076 (se 0.410) and after it 9.889 — a move of less than half a
      // standard error, from just inside the band to just outside it. Re-solving this multiplier
      // to 1.36 does put the row mid-band, and it also reshuffles the league enough to move three
      // other calibration rows out of theirs, so it is NOT done here: it needs its own pass with
      // every calibration gate re-verified. See SUMMARY.md.
      EDGE: 1.21, DT: 1.07, LB: 0.91, CB: 1.43, S: 1.07,
      K: 0.36, P: 0.32, LS: 0.21,
    },

    age: { peakStart: 25, peakEnd: 28, youngFactor: 0.9, declinePerYear: 0.075, floor: 0.35 },

    // Contract shape
    contractYearsMin: 1,
    contractYearsMax: 5,
    yearsQualityScale: 4,
    guaranteeShareBase: 0.42,
    guaranteeShareQualityBonus: 0.28,
    salaryEscalation: 0.06,

    // Player preferences. Weights are drawn per player and normalized to 1.
    // moneyWeightFloor keeps money the dominant term for most players, as in reality.
    moneyWeightFloor: 0.35,
    nonMoneyWeightSpread: 0.65,
    nonMoneyValueScale: 0.30,
    scoreNoiseSd: 0.05,

    // Team behaviour
    badTeamPremium: 0.14,
    needAggression: 0.05,
    capReserveShare: 0.06,
    // How far above a player's current ask a team will go when it values him more than he is
    // asking. This is the competition premium that gets stars paid above market.
    competitiveBump: 1.10,
    minOfferRatio: 0.72,
    maxOfferRatio: 1.20,
    starterGapScale: 12,
    // Baseline appetite for depth once positional needs are met but roster spots remain.
    depthNeedFloor: 0.18,
    shortfallWeight: 1.4,
    contenderWinPct: 0.55,

    // CHOSEN. What a club assumes an unfilled roster spot will cost when it reserves cap against
    // the men it has not signed yet. The veteran minimum (0.32) is the FLOOR, not the estimate —
    // reserving at the floor let a club spend its way to 99% of the cap in a single offseason and
    // then discover the rest of the roster cost more than that, and by the next spring every one
    // of those contracts was too fresh to release for a saving. Set between the minimum and the
    // ~1.7% a roster spot actually averages at the calibrated market.
    rosterCompletionReserve: 0.8,
    // CHOSEN. How far above the veteran minimum a player may price and still plausibly sign for
    // it. Anyone dearer would not take the deal, so a club filling a roster spot at the minimum
    // must take a minimum-calibre body rather than the best free agent left in the league.
    minimumDealMarketMultiple: 1.4,
    minimumRosterAfterFA: 45,
    targetRosterSize: 53,
  },

  // ---------------------------------------------------------------------------------------
  // PHASE 3 — DRAFT + SCOUTING
  // ⚠ Unless a field says otherwise, every modeling value in this block is a CHOSEN design
  // parameter, not a value derived from the project's CSVs. In particular, the 15-20% first-
  // round bust and 3-5% late-round star acceptance bands come from general NFL knowledge.
  // `jimmyJohnsonValues` is the published 224-pick trade chart, not a fitted game parameter.
  // ---------------------------------------------------------------------------------------
  draft: {
    rounds: 7,
    teams: 32,
    regularPicks: 224,
    compensatoryPicks: 38,
    totalSelections: 262,
    prospectPoolSize: 890,
    // ⚠ CHANGED IN PHASE 3.6, from 21-23. Both values are CHOSEN, neither is fitted, but 21-23
    // was younger than real football: NFL draft eligibility requires three years out of high
    // school, so draftees are 21-24 with a mean near 22.8, and a 21-year-old rookie is rare.
    // The old range put mean rookie entry at 22.0, and because entry age sets the whole league's
    // age structure it held the mean roster age about a year low. See SUMMARY.md.
    ageMin: 22,
    ageMax: 24,

    // Chosen synthetic position mix. Counts sum exactly to prospectPoolSize.
    positionCounts: {
      QB: 62, RB: 70, FB: 5, WR: 113, TE: 51,
      LT: 46, LG: 32, C: 27, RG: 32, RT: 43,
      EDGE: 78, DT: 68, LB: 76, CB: 92, S: 62,
      K: 14, P: 14, LS: 5,
    },
    compensatoryByRound: { 1: 0, 2: 0, 3: 4, 4: 8, 5: 10, 6: 9, 7: 7 },

    // True prospect talent. All values are CHOSEN, not data-derived. Phase 3.7 raises mean
    // potential growth so the draft-and-development pipeline can replace the calibrated initial
    // league instead of converging to replacement level; the current-rating distribution is the
    // free parameter used to preserve the existing bust/star outcome bands.
    // Potential is correlated with, but not identical to, current ability; draft position is
    // determined without reading either true value.
    overallMean: 48,
    overallSd: 18,
    overallMin: 30,
    overallMax: 88,
    potentialGrowthMean: 4,
    potentialGrowthSd: 14,
    potentialGrowthAnchorOverall: 73.5,
    potentialGrowthPerOverall: 1.4,
    potentialBreakoutChance: 0.32,
    potentialBreakoutBonus: 50,
    // Only prospects at or below this current rating can draw the breakout. CHOSEN.
    potentialBreakoutMaxOverall: 60,
    // ⚠ CHOSEN. Potential is a soft target (DESIGN.md 3.2), so every prospect keeps some
    // headroom above his current rating — drawn per player, not constant, so the potential
    // distribution has no point mass sitting exactly at the current rating.
    potentialHeadroomMean: 4.0,
    potentialHeadroomSd: 4.0,
    potentialMin: 45,
    potentialMax: 90,
    // Only a late bloomer may exceed `potentialMax`. CHOSEN.
    potentialBreakoutMax: 99,

    // CFB DisplayRating ports width=(100-scoutingPct)/10. The persistent bias draw is then
    // scaled by the unscouted fraction, so increasing knowledge converges to truth rather than
    // merely drawing a tighter interval around the same wrong center.
    scoutingPctMin: 0,
    scoutingPctMax: 100,
    scoutingDisplayMin: 0,
    scoutingDisplayMax: 99,
    baselineScoutingPct: 15,
    displayRangeDivisor: 10,
    biasSdAtZeroScouting: 12.3,
    // Heteroscedastic evaluation error: a prospect at or above `biasCertainOverall` is scouted
    // with the base error, and one `biasCertaintySpan` points below it is scouted with
    // `1 + biasWeakProspectSlope` times that error. A blue-chip prospect has been filmed,
    // combined and interviewed by everyone; a small-school day-three player has not, and that is
    // where boards are actually wrong. ⚠ All three CHOSEN.
    biasCertainOverall: 63,
    biasCertaintySpan: 33,
    biasWeakProspectSlope: 1.1,
    scoutingBudget: 0,
    scoutingAllocationChunk: 20,
    scoutingNeedWeight: 4,
    scoutingValueWeight: 1.5,
    scoutingGradeDivisor: 25,

    // AI board score. True overall and true potential are deliberately absent.
    bpaWeight: 1,
    needWeight: 3.5,
    positionalValueWeight: 2,

    // Rookie wage scale, all as percentages of that year's salary cap. Four active years for
    // every pick; first-round fifth-year-option eligibility is derived from draft round.
    rookieContractYears: 4,
    fifthYearOptionRound: 1,
    rookieMinimumApy: 0.32,
    rookieTopApy: 3.5,
    rookieWageExponent: 0.55,
    rookieSigningBonusShareMin: 0.10,
    rookieSigningBonusShareMax: 0.65,
    rookieSigningBonusExponent: 0.50,
    rookieSalaryEscalation: 0.05,
    rookieGuaranteedBaseYears: 1,
    contractIdYearMultiplier: 1_000_000,
    bonusIdOffset: 500_000,

    // Minimal pick-only trading. Values after pick 224 use the chart's final value because the
    // original chart predates tradable compensatory selections and explicitly ends at 224.
    tradeValueBeyondChart: 2,
    fairTradeRatioMin: 0.90,
    fairTradeRatioMax: 1.10,
    jimmyJohnsonValues: [
      3000, 2600, 2200, 1800, 1700, 1600, 1500, 1400,
      1350, 1300, 1250, 1200, 1150, 1100, 1050, 1000,
      950, 900, 875, 850, 800, 780, 760, 740,
      720, 700, 680, 660, 640, 620, 600, 590,
      580, 560, 550, 540, 530, 520, 510, 500,
      490, 480, 470, 460, 450, 440, 430, 420,
      410, 400, 390, 380, 370, 360, 350, 340,
      330, 320, 310, 300, 292, 284, 276, 270,
      265, 260, 255, 250, 245, 240, 235, 230,
      225, 220, 215, 210, 205, 200, 195, 190,
      185, 180, 175, 170, 165, 160, 155, 150,
      145, 140, 136, 132, 128, 124, 120, 116,
      112, 108, 104, 100, 96, 92, 88, 86,
      84, 82, 80, 78, 76, 74, 72, 70,
      68, 66, 64, 62, 60, 58, 56, 54,
      52, 50, 49, 48, 47, 46, 45, 44,
      43, 42, 41, 40, 40, 39, 39, 38,
      38, 37, 37, 36, 36, 35, 35, 34,
      34, 33, 33, 32, 32, 31, 31, 31,
      30, 30, 29, 29, 29, 28, 28, 27,
      27, 27, 26, 26, 25, 25, 25, 24,
      24, 23, 23, 23, 22, 22, 21, 21,
      21, 20, 20, 19, 19, 19, 18, 18,
      17, 17, 17, 16, 16, 15, 15, 15,
      14, 14, 13, 13, 13, 12, 12, 11,
      11, 11, 10, 10, 9, 9, 9, 8,
      8, 7, 7, 7, 6, 6, 5, 5,
      5, 4, 4, 3, 3, 3, 2, 2,
    ],

    acceptance: {
      drafts: 10,
      seed: 20260901,
      selectionTolerance: 5,
      minimumPicksPerTeam: 7,
      maximumPicksPerTeam: 9,
      firstRound: 1,
      comparisonRound: 4,
      lateRoundMin: 5,
      bustOverall: 65,
      starOverall: 85,
      bustRateMin: 0.15,
      bustRateMax: 0.20,
      lateStarRateMin: 0.03,
      lateStarRateMax: 0.05,
      minimumRoundOutcomeGap: 5,
      // Bands for the two round-quality rows. These previously used 0-99, which is the full
      // rating scale and therefore could never fail — they reported a number dressed as a test.
      // Structural sanity checks, chosen, not data-derived.
      firstRoundPeakMin: 70,
      firstRoundPeakMax: 80,
      fourthRoundPeakMin: 58,
      fourthRoundPeakMax: 68,
      lowScoutingBudget: 0,
      highScoutingBudget: 12_000,
      maximumHighToLowScoutingErrorRatio: 0.70,
      maximumRookiePoolFirstYearCapHit: 12,
    },
  },

  // ---------------------------------------------------------------------------------------
  // PHASE 3.6 — SCHEME FIT, SUPPORTING CAST, AND THE SITUATION MULTIPLIERS
  //
  // ⚠ EVERYTHING IN THIS BLOCK IS **CHOSEN**. Not one value is derived from the project CSVs or
  // from any external dataset. The scheme weight vectors in particular are PURE DESIGN: no data
  // source prices "how much a West Coast offence values processing versus arm strength". They
  // are an opinion about football, written down so it can be argued with and tuned.
  //
  // Every demand vector must sum to exactly 1 for its position. `assertSchemeDemands` in
  // scheme.ts enforces that at module load, and the Phase 3.6 gate reports it as a row.
  // ---------------------------------------------------------------------------------------
  scheme: {
    offensive: ['WEST_COAST', 'VERTICAL', 'SPREAD_RPO', 'AIR_RAID', 'ZONE_RUN', 'POWER_RUN'] as const,
    defensive: ['FOUR_THREE_ZONE', 'THREE_FOUR_BLITZ', 'NICKEL_MATCH', 'COVER_THREE'] as const,

    // Positions with no declared demand (K, P, LS) are scheme-neutral by construction rather
    // than through a fabricated kicker scheme vector.
    demands: {
      WEST_COAST: {
        QB: { throwAccuracy: 0.35, processing: 0.30, poise: 0.15, awareness: 0.10, throwPower: 0.05, speed: 0.05 },
        RB: { vision: 0.20, agility: 0.20, catching: 0.20, passBlock: 0.15, breakTackle: 0.15, carrying: 0.10 },
        FB: { runBlock: 0.35, passBlock: 0.25, catching: 0.15, strength: 0.15, awareness: 0.10 },
        WR: { separation: 0.30, routeRunning: 0.30, catching: 0.20, catchInTraffic: 0.10, speed: 0.10 },
        TE: { catching: 0.25, routeRunning: 0.25, runBlock: 0.20, separation: 0.15, catchInTraffic: 0.15 },
        LT: { passBlock: 0.45, agility: 0.20, awareness: 0.20, strength: 0.15 },
        LG: { passBlock: 0.35, runBlock: 0.30, awareness: 0.20, agility: 0.15 },
        C: { awareness: 0.30, passBlock: 0.30, runBlock: 0.25, strength: 0.15 },
        RG: { passBlock: 0.35, runBlock: 0.30, awareness: 0.20, agility: 0.15 },
        RT: { passBlock: 0.40, runBlock: 0.25, awareness: 0.20, strength: 0.15 },
      },
      VERTICAL: {
        QB: { throwPower: 0.30, throwAccuracy: 0.20, poise: 0.20, processing: 0.15, awareness: 0.15 },
        RB: { passBlock: 0.30, vision: 0.20, breakTackle: 0.20, carrying: 0.15, catching: 0.15 },
        FB: { passBlock: 0.35, runBlock: 0.30, strength: 0.20, awareness: 0.15 },
        WR: { speed: 0.30, catching: 0.20, catchInTraffic: 0.20, separation: 0.15, routeRunning: 0.15 },
        TE: { runBlock: 0.30, catching: 0.25, catchInTraffic: 0.20, routeRunning: 0.15, strength: 0.10 },
        LT: { passBlock: 0.50, strength: 0.20, agility: 0.15, awareness: 0.15 },
        LG: { passBlock: 0.40, strength: 0.25, runBlock: 0.20, awareness: 0.15 },
        C: { passBlock: 0.35, awareness: 0.30, strength: 0.20, runBlock: 0.15 },
        RG: { passBlock: 0.40, strength: 0.25, runBlock: 0.20, awareness: 0.15 },
        RT: { passBlock: 0.45, strength: 0.25, runBlock: 0.15, awareness: 0.15 },
      },
      SPREAD_RPO: {
        QB: { speed: 0.25, throwOnRun: 0.20, processing: 0.20, throwAccuracy: 0.20, poise: 0.15 },
        RB: { vision: 0.25, agility: 0.25, speed: 0.20, breakTackle: 0.15, carrying: 0.15 },
        FB: { runBlock: 0.40, strength: 0.25, carrying: 0.20, awareness: 0.15 },
        WR: { separation: 0.30, speed: 0.25, routeRunning: 0.20, catching: 0.15, agility: 0.10 },
        TE: { routeRunning: 0.25, catching: 0.25, separation: 0.20, runBlock: 0.20, agility: 0.10 },
        LT: { runBlock: 0.30, passBlock: 0.30, agility: 0.25, awareness: 0.15 },
        LG: { runBlock: 0.35, agility: 0.25, passBlock: 0.25, awareness: 0.15 },
        C: { awareness: 0.30, runBlock: 0.25, agility: 0.25, passBlock: 0.20 },
        RG: { runBlock: 0.35, agility: 0.25, passBlock: 0.25, awareness: 0.15 },
        RT: { runBlock: 0.30, passBlock: 0.30, agility: 0.25, awareness: 0.15 },
      },
      AIR_RAID: {
        QB: { throwAccuracy: 0.30, processing: 0.30, poise: 0.20, throwPower: 0.10, awareness: 0.10 },
        RB: { catching: 0.30, routeRunning: 0.20, agility: 0.20, passBlock: 0.20, vision: 0.10 },
        FB: { catching: 0.30, passBlock: 0.30, runBlock: 0.25, awareness: 0.15 },
        WR: { separation: 0.35, routeRunning: 0.25, catching: 0.20, speed: 0.10, agility: 0.10 },
        TE: { separation: 0.30, routeRunning: 0.25, catching: 0.25, catchInTraffic: 0.20 },
        LT: { passBlock: 0.50, agility: 0.20, awareness: 0.20, strength: 0.10 },
        LG: { passBlock: 0.45, awareness: 0.25, agility: 0.20, strength: 0.10 },
        C: { awareness: 0.35, passBlock: 0.35, agility: 0.20, strength: 0.10 },
        RG: { passBlock: 0.45, awareness: 0.25, agility: 0.20, strength: 0.10 },
        RT: { passBlock: 0.50, agility: 0.20, awareness: 0.20, strength: 0.10 },
      },
      ZONE_RUN: {
        QB: { throwAccuracy: 0.25, processing: 0.20, throwOnRun: 0.20, poise: 0.20, awareness: 0.15 },
        RB: { vision: 0.35, agility: 0.25, speed: 0.20, carrying: 0.10, breakTackle: 0.10 },
        FB: { runBlock: 0.45, agility: 0.20, strength: 0.20, awareness: 0.15 },
        WR: { separation: 0.25, routeRunning: 0.25, catching: 0.20, runBlock: 0.20, speed: 0.10 },
        TE: { runBlock: 0.40, catching: 0.20, routeRunning: 0.15, agility: 0.15, strength: 0.10 },
        LT: { runBlock: 0.40, agility: 0.30, passBlock: 0.20, awareness: 0.10 },
        LG: { runBlock: 0.40, agility: 0.30, awareness: 0.15, passBlock: 0.15 },
        C: { runBlock: 0.35, agility: 0.25, awareness: 0.25, passBlock: 0.15 },
        RG: { runBlock: 0.40, agility: 0.30, awareness: 0.15, passBlock: 0.15 },
        RT: { runBlock: 0.40, agility: 0.30, passBlock: 0.20, awareness: 0.10 },
      },
      POWER_RUN: {
        QB: { throwAccuracy: 0.25, poise: 0.25, processing: 0.20, throwPower: 0.20, awareness: 0.10 },
        RB: { breakTackle: 0.30, carrying: 0.25, vision: 0.25, strength: 0.10, speed: 0.10 },
        FB: { runBlock: 0.40, strength: 0.30, hitPower: 0.15, awareness: 0.15 },
        WR: { runBlock: 0.25, catching: 0.20, catchInTraffic: 0.20, separation: 0.20, routeRunning: 0.15 },
        TE: { runBlock: 0.45, catching: 0.20, strength: 0.20, catchInTraffic: 0.15 },
        LT: { runBlock: 0.40, strength: 0.30, passBlock: 0.20, awareness: 0.10 },
        LG: { runBlock: 0.40, strength: 0.35, passBlock: 0.15, awareness: 0.10 },
        C: { runBlock: 0.35, strength: 0.30, awareness: 0.20, passBlock: 0.15 },
        RG: { runBlock: 0.40, strength: 0.35, passBlock: 0.15, awareness: 0.10 },
        RT: { runBlock: 0.40, strength: 0.30, passBlock: 0.20, awareness: 0.10 },
      },
      FOUR_THREE_ZONE: {
        EDGE: { passRush: 0.35, runDefense: 0.25, blockShedding: 0.20, speed: 0.10, tackling: 0.10 },
        DT: { runDefense: 0.35, blockShedding: 0.25, strength: 0.25, passRush: 0.15 },
        LB: { zoneCoverage: 0.25, playRecognition: 0.25, tackling: 0.20, runDefense: 0.20, speed: 0.10 },
        CB: { zoneCoverage: 0.35, playRecognition: 0.25, manCoverage: 0.15, speed: 0.15, tackling: 0.10 },
        S: { zoneCoverage: 0.30, playRecognition: 0.30, tackling: 0.20, speed: 0.10, hitPower: 0.10 },
      },
      THREE_FOUR_BLITZ: {
        EDGE: { passRush: 0.40, speed: 0.20, blockShedding: 0.20, runDefense: 0.10, agility: 0.10 },
        DT: { strength: 0.35, blockShedding: 0.30, runDefense: 0.25, passRush: 0.10 },
        LB: { passRush: 0.25, tackling: 0.20, speed: 0.20, playRecognition: 0.20, blockShedding: 0.15 },
        CB: { manCoverage: 0.40, speed: 0.25, agility: 0.15, playRecognition: 0.10, zoneCoverage: 0.10 },
        S: { playRecognition: 0.25, hitPower: 0.20, tackling: 0.20, manCoverage: 0.20, speed: 0.15 },
      },
      NICKEL_MATCH: {
        EDGE: { passRush: 0.40, speed: 0.25, agility: 0.15, blockShedding: 0.10, runDefense: 0.10 },
        DT: { passRush: 0.35, blockShedding: 0.25, strength: 0.20, runDefense: 0.20 },
        LB: { manCoverage: 0.25, zoneCoverage: 0.20, speed: 0.20, playRecognition: 0.20, tackling: 0.15 },
        CB: { manCoverage: 0.35, zoneCoverage: 0.20, playRecognition: 0.20, agility: 0.15, speed: 0.10 },
        S: { manCoverage: 0.25, zoneCoverage: 0.25, playRecognition: 0.25, speed: 0.15, tackling: 0.10 },
      },
      COVER_THREE: {
        EDGE: { runDefense: 0.30, passRush: 0.30, blockShedding: 0.25, tackling: 0.15 },
        DT: { runDefense: 0.40, blockShedding: 0.25, strength: 0.25, passRush: 0.10 },
        LB: { runDefense: 0.30, playRecognition: 0.25, tackling: 0.25, zoneCoverage: 0.20 },
        CB: { zoneCoverage: 0.40, playRecognition: 0.20, speed: 0.20, tackling: 0.10, manCoverage: 0.10 },
        S: { zoneCoverage: 0.35, speed: 0.25, playRecognition: 0.25, tackling: 0.15 },
      },
    },

    // A scheme change stands in for the Phase 5 coaching hire: it recomputes every player's fit
    // without touching a single rating (DESIGN.md 4.3). Losing teams change far more often than
    // winning ones, which is where most of the league's situation churn comes from.
    changeBaseChance: 0.14,
    changeLosingWeight: 0.55,
    changeNeutralWinPct: 0.5,
  },
  // ---------------------------------------------------------------------------------------
  // PHASE 3.6 — EFFECTIVE RATINGS
  //
  //   effectiveRating = trueRating x schemeFit x supportingCast x usage x health
  //
  // ⚠ EVERY VALUE BELOW IS **CHOSEN**. None is fitted from data.
  //
  // Two structural rules hold and are gated:
  //   1. A neutral situation multiplies by EXACTLY 1.0, so effective == true where nothing is
  //      helping or hurting. Every multiplier is written as `1 + swing x (score - 0.5)` for
  //      that reason; the DESIGN.md 2.2 form `0.80 + 0.40 x fit` is the same expression.
  //   2. The bound on the PRODUCT scales inversely with true overall (DESIGN.md 3.5.2), so
  //      elite talent is nearly situation-proof and marginal talent is nearly all situation.
  // ---------------------------------------------------------------------------------------
  effective: {
    // Each multiplier is bounded to [0.80, 1.20] individually, per DESIGN.md 2.1.
    multiplierMin: 0.80,
    multiplierMax: 1.20,
    neutralScore: 0.5,
    // 0.40 x (score - 0.5) spans exactly [-0.20, +0.20] over score in [0, 1].
    multiplierSwing: 0.40,

    // --- Scheme fit -----------------------------------------------------------------------
    // `schemeFit` itself is DESIGN.md 2.2 verbatim: sum of (rating_i / 99) x weight_i. Read
    // literally, that number is dominated by how good the player is rather than by how well he
    // fits, so a 90 overall would score ~0.90 in EVERY scheme and collect a large bonus for
    // being good — double-counting talent. The multiplier therefore compares his fit in THIS
    // scheme against the mean of his fit across every scheme on that side of the ball. A player
    // in an average-for-him scheme lands at exactly 1.0, which is the neutrality rule above.
    ratingCeiling: 99,
    // CHOSEN: response = swing * delta / (scale + abs(delta)), delta = relative fit minus 1.
    // The slope at neutral is deliberately high, so modest scheme differences matter;
    // saturation prevents extreme mismatches dominating the roster.
    //
    // ⚠ Phase 4c. Phase 4b raised these to 0.20 / 0.050 outside the scope PHASE4B.md permitted
    // (its carry-share section). They were reverted to the Phase 3.7 pair 0.188 / 0.046 first,
    // which by itself fixed phase3-5 outright and moved revival lift 1.27 -> 1.33.
    //
    // `fitRelativeSwing` then went 0.188 -> 0.178, CHOSEN, and it must be read together with
    // `teamMeanDamping` 0.95 -> 0.35 below. This constant scales the scheme-fit MULTIPLIER, so
    // it moves individual situation variance and team-strength dispersion TOGETHER — raising it
    // to buy revival movement is what re-broke phase0's margin rows twice. `teamMeanDamping`
    // moves individual situation variance ALONE. Lowering the swing and the damping together
    // leaves the situation product's total spread slightly NARROWER than it was (sd 0.0706 ->
    // 0.0680) while its revival movement goes UP, because the composition shifted away from the
    // term that reaches the scoreboard. That is the DESIGN.md 3.5 decoupling, applied.
    fitRelativeSwing: 0.178,
    fitResponseScale: 0.046,
    // Same relative fit, remapped to the 0..1 / neutral-0.5 shape the Phase 3.5 development
    // factor expects, so an average-scheme player develops exactly as he did before this phase.
    progressionFitSwing: 2.2,

    // --- Supporting cast ------------------------------------------------------------------
    // Position-specific, from the DESIGN.md 2.3 table. Scores are centred on the league's
    // starter mean so an average supporting cast is worth exactly 1.0.
    castNeutralRating: 80,
    // Phase 3.7, CHOSEN: 900 -> 4000. The play engine already reads teammates' ratings
    // on every snap. Keep the cast direction but reduce its shared roster-strength effect
    // to 22.5% of the previous slope, freeing variance for individual scheme fit.
    castRatingScale: 4000,
    castWeights: {
      // QB: line, receiver separation, back in protection.
      QB: { passBlock: 0.55, separation: 0.30, backProtection: 0.15 },
      // RB: the line in front of him, almost entirely.
      RB: { runBlock: 0.80, passBlock: 0.20 },
      FB: { runBlock: 0.80, passBlock: 0.20 },
      // WR: the quarterback throwing him the ball, plus the attention other receivers draw.
      WR: { quarterback: 0.75, otherReceivers: 0.25 },
      TE: { quarterback: 0.70, otherReceivers: 0.30 },
      // OL: the quarterback's ability to get the ball out, and the back's contribution.
      OL: { quarterback: 0.65, backProtection: 0.35 },
      // EDGE: interior pressure plus coverage behind — sacks need both.
      EDGE: { interiorRush: 0.55, coverage: 0.45 },
      DT: { edgeRush: 0.60, coverage: 0.40 },
      LB: { interiorRush: 0.45, coverage: 0.55 },
      // CB: the pass rush, and safety help over the top.
      CB: { passRush: 0.55, safetyHelp: 0.45 },
      S: { passRush: 0.45, cornerHelp: 0.55 },
    },
    castStarterCount: 5,
    castReceiverCount: 3,
    castSecondaryCount: 3,
    castRushCount: 2,

    // --- Usage ----------------------------------------------------------------------------
    // Prior-season snap share and stamina. A player already in a full-time role plays closer to
    // his ceiling; a body pulled off the bench into a role he has not had reps for does not.
    usageNeutralSnapShare: 0.50,
    usageNeutralStamina: 80,
    // Phase 3.7, CHOSEN: snap weight 0.30 -> 0.04; stamina weight 0.04 -> 0.035.
    // Retain both effects while reducing persistent role/athletic-rating variance relative
    // to scheme variance. The progression system's snap multipliers are unchanged.
    usageSnapWeight: 0.04,
    usageStaminaWeight: 0.035,
    usageStaminaScale: 40,

    // Remove this share of the common team deviation before league balancing. The adjustment is
    // proportional to each individual's absolute deviation, so an exactly neutral individual
    // stays neutral even among non-neutral teammates.
    //
    // ⚠ Phase 4c, CHOSEN: 0.95 -> 0.35. Phase 3.7 raised this to 0.95 reasoning that the shared
    // team component widens game margins. Measured, it does not: sweeping 0.95 / 1.0 / 1.15 /
    // 1.3 and 0.60 / 0.30 leaves the pooled five-seed phase0 margin rows unmoved (53/53 at both
    // 0.60 and 0.30). What it does move is the INDIVIDUAL situation swing, because the shrinkage
    // is proportional to each player's own deviation — so it is the one lever that buys revival
    // movement without paying for it in margins. DESIGN.md 3.5.8's situation-movement row went
    // 48.0% -> 52.4% (mean of eight seeds) on this change.
    teamMeanDamping: 0.35,
    // Numerical solver controls, not football balance targets. CHOSEN precision budget.
    normalizationIterations: 52,
    normalizationMidpointWeight: 0.5,

    // --- Health ---------------------------------------------------------------------------
    // Wired and live, but `weeksInjured` is never set anywhere in the engine yet, so it is
    // exactly 1.0 in every current simulation. It is a real formula on a zero input, NOT a
    // fabricated value: there is no injury system before Phase 4.
    healthNeutralDurability: 80,
    healthDurabilityScale: 60,
    healthPenaltyPerWeek: 0.018,
    healthSeasonWeeks: 17,

    // --- The bound that matters most (DESIGN.md 3.5.2) --------------------------------------
    //
    // ⚠ DESIGN.md 3.5.2 states a FORMULA and a TABLE OF OUTCOMES, and they contradict each
    // other. Both are reproduced in the Phase 3.6 work order, so this had to be resolved.
    //
    //   formula:  swingRange = 0.30 x (1 - (trueOverall - 55) / 44)^2
    //   table:    95 -> plays 88-99 | 85 -> 73-96 | 75 -> 57-91 | 65 -> 46-82
    //
    //   overall   published    formula gives   1 - x^2 gives
    //      95        88-99       89.3-99.0       89.3-99.0
    //      85        73-96       79.9-89.6       71.4-97.3
    //      75        57-91       68.3-81.0       57.1-91.1
    //      65        46-82       53.4-75.5       46.5-81.6
    //
    // Moving the square inside — 0.30 x (1 - x^2) — reproduces the published table almost to
    // the point, while the literal form matches only the 95 row. Three further pieces of the
    // design agree with the table and not the formula:
    //   * the worked example in DESIGN.md 3.5.1 swings an ~85 quarterback from "plays like 71"
    //     to "plays like 99". The literal formula allows that player 79.9-89.6.
    //   * DESIGN.md 3.5.8 requires quarterbacks to revive more than running backs. Under the
    //     literal formula only sub-75 players can swing 12 points at all, so the revivers are
    //     whoever has declined most — which is running backs, the exact opposite.
    //   * the Geno Smith case the whole section is built around is a fringe STARTER, not a
    //     replacement-level player, and the literal formula cannot move him.
    //
    // The table is therefore treated as the specification and the formula as a typo in it. Flip
    // this one flag to false to restore the formula verbatim; the Phase 3.6 gate asserts the
    // four published play ranges directly, so the consequence is visible immediately.
    swingUsesPublishedTable: true,
    swingMax: 0.30,
    swingMin: 0.06,
    swingOverallFloor: 55,
    swingOverallSpan: 44,
    swingUpShare: 0.90,
  },

  // ---------------------------------------------------------------------------------------
  // PHASE 3.5 — PROGRESSION, AGING, DECLINE, AND RETIREMENT
  // ⚠ EVERY MODELING VALUE IN THIS BLOCK IS CHOSEN, NOT DERIVED FROM THE PROJECT CSVs.
  // The age curves start from DESIGN.md sections 3 and 3.5.3. They must be replaced with fitted
  // nflverse player-season curves when that licensed local analysis exists.
  // ---------------------------------------------------------------------------------------
  progression: {
    developmentTrait: { mean: 50, sd: 37, min: 0, max: 100 },
    eligibility: { rfaAccruedSeasons: 3, ufaAccruedSeasons: 4 },

    // ⚠ CHANGED IN PHASE 3.6. Athletic `developUntil` 24 -> 25, athletic `baseRate` 44 -> 48,
    // technique `baseRate` 24 -> 26. Rookie entry moved from age 21-23 to 22-24 (see the draft
    // block), which removes a full year from every development window and cut the published
    // Phase 3 late-round star rate from 3.3% to 1.4%. The outcome bands are the contract; these
    // rates are the free parameter, so the rates moved to restore them. 25 is still within
    // DESIGN.md 3.5.3's "~24". All CHOSEN. See SUMMARY.md.
    groups: {
      athletic: { developUntil: 25, baseRate: 62 },
      // Phase 4d, CHOSEN window [27, 30], replacing a single global `declineFrom: 29`.
      // Technique decline is now position-aware — clamped `ageCurves[position].peakEnd` — the
      // same shape athletic decline has always had. DESIGN.md 3.5.3 publishes one global
      // technique row but its prose asserts the asymmetry outright ("a 32-year-old quarterback
      // has lost nothing that mattered to him ... that is why the late-career quarterback
      // revival is real and the late-career running back revival is not"), and one global age
      // cannot express it. The window resolves to: RB/FB 27 < CB 28 < WR/EDGE/LB 29 <
      // TE/DT/S/OL/QB/K/P/LS 30.
      //
      // DERIVED, 8 seeds x 20 league years, against the two rows this trades between:
      //                        QB-RB peak-age gap        prime-minus-30+ overall
      //   [29,29] (before)     mean 2.99  min 2.62  4/8  mean 1.52  min 0.46  8/8
      //   [29,31]              mean 3.36  min 3.08  4/4  mean 0.37  min -0.86 3/4
      //   [25,33]              mean 3.95  min 3.42  4/4  mean 0.45  min -0.44 3/4
      //   [27,31]              mean 3.50  min 3.14  8/8  mean 0.79  min 0.25  8/8
      //   [26,30]              mean 3.40  min 3.21  8/8  mean 0.96  min 0.06  8/8
      //   [27,30] SHIPPED      mean 3.36  min 3.22  8/8  mean 0.99  min 0.66  8/8
      // Every one-sided delay of technique decline buys the peak-age row by spending the
      // age-shape row, because it lifts the 30+ cohort. Only the position-aware form pays for
      // itself: running backs lose craft two years EARLIER, which widens the gap from the
      // other end and pulls the 30+ mean back down. [27,30] is the only setting where both
      // rows clear their floors on all eight seeds with margin.
      technique: { developUntil: 29, declineFromMin: 27, declineFromMax: 30, baseRate: 36.3, declineRate: 3.6 },
      mental: { developUntil: 34, declineFrom: 38, baseRate: 11, declineRate: 0.18 },
    },

    ageCurves: {
      QB: { peakStart: 28, peakEnd: 35, athleticDeclineRate: 0.6, cliffAge: 39 },
      RB: { peakStart: 22, peakEnd: 25, athleticDeclineRate: 6.5, cliffAge: 30 },
      FB: { peakStart: 22, peakEnd: 25, athleticDeclineRate: 6.5, cliffAge: 30 },
      WR: { peakStart: 26, peakEnd: 29, athleticDeclineRate: 2.0, cliffAge: 33 },
      TE: { peakStart: 27, peakEnd: 30, athleticDeclineRate: 1.8, cliffAge: 34 },
      LT: { peakStart: 27, peakEnd: 31, athleticDeclineRate: 1.2, cliffAge: 35 },
      LG: { peakStart: 27, peakEnd: 31, athleticDeclineRate: 1.2, cliffAge: 35 },
      C: { peakStart: 27, peakEnd: 31, athleticDeclineRate: 1.2, cliffAge: 35 },
      RG: { peakStart: 27, peakEnd: 31, athleticDeclineRate: 1.2, cliffAge: 35 },
      RT: { peakStart: 27, peakEnd: 31, athleticDeclineRate: 1.2, cliffAge: 35 },
      EDGE: { peakStart: 26, peakEnd: 29, athleticDeclineRate: 2.0, cliffAge: 34 },
      DT: { peakStart: 27, peakEnd: 30, athleticDeclineRate: 2.0, cliffAge: 33 },
      LB: { peakStart: 25, peakEnd: 29, athleticDeclineRate: 2.2, cliffAge: 33 },
      CB: { peakStart: 25, peakEnd: 28, athleticDeclineRate: 2.8, cliffAge: 32 },
      S: { peakStart: 26, peakEnd: 30, athleticDeclineRate: 1.8, cliffAge: 34 },
      K: { peakStart: 28, peakEnd: 36, athleticDeclineRate: 0.4, cliffAge: 42 },
      P: { peakStart: 28, peakEnd: 36, athleticDeclineRate: 0.4, cliffAge: 42 },
      LS: { peakStart: 28, peakEnd: 36, athleticDeclineRate: 0.4, cliffAge: 42 },
    },

    development: {
      factorBase: 0.48,
      traitWeight: 0.30,
      positionCoachWeight: 0.20,
      snapShareWeight: 0.15,
      schemeFitWeight: 0.10,
      injuryWeight: 0.20,
      neutralPositionCoachRating: 0.50,
      neutralSchemeFit: 0.50,
      seasonGames: 17,
      growthPercentScale: 0.01,
      growthSdShare: 0.85,
      athleticSnapFloor: 0.80,
      athleticSnapWeight: 0.15,
      techniqueSnapFloor: 0.80,
      techniqueSnapWeight: 0.17,
      mentalSnapFloor: 0.80,
      mentalSnapWeight: 0.20,
      quarterbackBackupThreshold: 0.25,
      quarterbackFinishingSchoolWeight: 0.35,
      starterQualityScale: 99,
      defaultSnapShare: 0.50,
      careerEvaluationSeasons: 12,
      careerEvaluationSnapShare: 0.90,
    },

    decline: {
      sdShare: 0.35,
      ageAccelerationPerYear: 0.05,
      cliffMultiplier: 1.75,
      slowRatePeakEndThreshold: 0.8,
    },

    snapShare: {
      depthWeight: 0.35,
      usageWeight: 0.55,
      gamesWeight: 0.10,
      // CHOSEN (Phase 4b): the depth shares of positions the data below does not cover (FB, K, P, LS).
      depthShares: [0.80, 0.16, 0.04] as const,
      reserveDepthShare: 0.01,
      // Stage 3 (NFLVERSE S6), DERIVED (npm run nflverse:tables -- --only=snaps; 2015-2025
      // snap_counts, 352 team-seasons): each depth slot's real season snap share, the share of the
      // team's snaps at its side of the ball. They replace depthShares where they exist: that
      // CHOSEN table gave every position one starter, so a WR2, CB2 or LB2 read 16% against a real
      // 65-70%. The engine's tackles and guards are two positions each: LT and RT take the real
      // tackles' starting pair's mean ((0.912 + 0.686) / 2) and half the third tackle's share, and
      // LG and RG the guards' likewise.
      slotShares: {
        QB: [0.822, 0.141],
        RB: [0.534, 0.302, 0.157],
        WR: [0.79, 0.65, 0.479, 0.291, 0.168],
        TE: [0.654, 0.387, 0.202],
        LT: [0.799, 0.135], RT: [0.799, 0.135],
        LG: [0.784, 0.14], RG: [0.784, 0.14],
        C: [0.812, 0.212],
        EDGE: [0.716, 0.558, 0.382, 0.232],
        DT: [0.661, 0.527, 0.391, 0.265],
        LB: [0.845, 0.62, 0.307, 0.147],
        CB: [0.853, 0.664, 0.439, 0.24, 0.116],
        S: [0.904, 0.724, 0.44, 0.211],
      },
    },

    retirement: {
      maximumAge: 45,
      minimumCareerSeasons: 2,
      // Phase 3.6. Draft and undrafted intake arrives at 21-23, so this gives a player who has
      // never made a roster two to four years to catch on before he is out of football. CHOSEN.
      undraftedWashoutAge: 25,
      baseChance: 0.045,
      agePressureStart: 27,
      // Fix pass: 0.025 -> 0.030 keeps the independently-seeded old-age shares inside the
      // existing 10-17% band after intake was trimmed. CHOSEN.
      ageChancePerYear: 0.065,
      cliffChance: 0.25,
      chancePerYearPastCliff: 0.18,
      unsignedChance: 0.22,
      lowOverallThreshold: 62,
      lowOverallChance: 0.12,
      starterOverallThreshold: 70,
      starterChanceReduction: 0,
      declineChancePerPoint: 0,
      maximumDeclineChance: 0.24,
      injuryChancePerWeek: 0.002,
      maximumChance: 0.96,
    },

    // -------------------------------------------------------------------------------------
    // PHASE 3.6 — LEAGUE INTAKE AND FINAL CUTDOWN
    //
    // The Phase 3.5 review found the age distribution skewed and named the cause: the draft is
    // the league's ONLY intake, worth ~262 players against a real ~25-30% annual roster
    // turnover. It also missed a second, larger structural gap that this block closes: NOTHING
    // trimmed a roster back to 53. Rosters bloated to a mean of 61.2 across 20 years, because
    // free agency filled to 53 and the draft then added ~8 more that were never cut.
    //
    // ⚠ EVERY VALUE HERE IS CHOSEN. Camp size and the keep-score weights are design judgement.
    // -------------------------------------------------------------------------------------
    intake: {
      // Free agency stops short of a full roster so draft picks and undrafted rookies have
      // somewhere to land, exactly as a real offseason leaves room before camp.
      freeAgencyRosterTarget: 51,

      // Teams re-sign their own expiring players before the market opens. `runFreeAgency` has
      // no incumbent preference, so without this every expiring contract hit the open market
      // and league turnover ran at ~53% against a real 22-32%. Quality-weighted: a replacement-
      // level player is retained ~35% of the time, a 99 overall ~80%. CHOSEN.
      resignBaseChance: 0.72,
      resignQualityWeight: 0.30,
      resignContractIdOffset: 700_000,
      // A distinct id band for the pre-market cap-compliance pass, so its replacement contracts
      // cannot collide with the re-signing band above or the draft band below.
      complianceContractIdOffset: 600_000,
      campRosterSize: 66,
      // Fix pass: 3 -> 2. Three overshot the <=24 share; two passes both league-shape gates.
      undraftedSigningsPerTeam: 4,

      // The undrafted class. Generated separately from the 330-player draft pool so that this
      // phase does not perturb Phase 3's scouting economics, and because undrafted players are
      // genuinely a lower talent tier rather than the tail of the same distribution.
      undraftedClassSize: 300,
      // ⚠ CHANGED IN PHASE 3.7, from mean 58 / sd 8 / range 42-78. An undrafted player is one
      // that all 32 teams passed on 262 times, so the tier has to sit below the draft class, and
      // the number that matters is not the pool mean but the mean of the ~17% actually signed:
      // for a normal that is mean + 1.47 x sd, which at 58/8 came out at 70.1 against a drafted
      // intake of 64.2. At 50/6 the signed cohort lands near 59.
      undraftedOverallMean: 50,
      undraftedOverallSd: 6,
      undraftedOverallMin: 38,
      undraftedOverallMax: 70,
      // ⚠ CHANGED IN PHASE 3.7, from growth mean 15 / sd 17 and a separate formula. Undrafted
      // prospects now run the SAME anchored potential model as drafted ones (see
      // `prospectPotential` in draft.ts) with a strictly lower growth constant and no breakout
      // draw, so at any given current overall an undrafted ceiling is expected to sit
      // `potentialGrowthMean - undraftedPotentialGrowthMean` points below a draftee's. Before
      // this, an undrafted class averaged 88.4 potential against a drafted class's 69.4.
      undraftedPotentialGrowthMean: 0,
      undraftedPotentialGrowthSd: 7,
      undraftedBreakoutChance: 0,
      undraftedPotentialMin: 40,
      undraftedPotentialMax: 90,
      undraftedAgeMin: 22,
      undraftedAgeMax: 24,

      // Final cutdown. A general manager does not simply keep the 53 highest overalls — he
      // keeps upside on a rookie deal over a marginal veteran, which is exactly what stops the
      // league ageing out. Position floors keep every roster legally playable.
      keepPotentialWeight: 0.25,
      // Scaled by draft round: a first-round pick gets the full bonus and is effectively
      // uncuttable as a rookie, a seventh-rounder gets a seventh of it, an undrafted rookie gets
      // `keepUndraftedBonus`. Second-year players keep a share of the same leash.
      keepRookieBonus: 16,
    // CHOSEN. What a percent of the cap in accelerated dead money is worth, in rating points, to
    // a club deciding who survives the final cutdown. A man you cannot afford to release is a man
    // you keep, and before this the cutdown ranked on talent alone and released the proration for
    // free. SWEPT against league dead money and the worst club-season; see SUMMARY.md.
    keepDeadMoneyWeight: 8.0,
      keepUndraftedBonus: 1,
      keepSecondYearShare: 0.45,
      positionFloorSlack: 1,
      minimumPositionFloor: 1,
    },

    // -------------------------------------------------------------------------------------
    // PHASE 3.6 ACCEPTANCE. Every band below is CHOSEN. The revival requirements originate in
    // DESIGN.md 3.5.8; the unstable QB:RB event ratio is replaced by the matched mechanism row
    // required by the fix review. The league-shape rows come from the Phase 3.5 review.
    // -------------------------------------------------------------------------------------
    acceptance36: {
      seed: 3_600_017,
      leagueYears: 20,

      // Phase 3.7. The draft must be the better intake tier at every stage. ⚠ CHOSEN margins;
      // the requirement that the gap be positive is the point, the size is judgement.
      minimumDraftedIntakeAdvantage: 1.0,
      minimumDraftedFinalAdvantage: 2.0,

      // Scheme demand vectors: 6 offensive schemes x 10 positions + 4 defensive x 5 = 80.
      expectedDemandVectors: 80,
      maximumDemandSumError: 1e-9,
      // VALUATION-2 rider: two epsilon literals the purity-determinism run found in engine code, moved
      // beside the precedent above with their values unchanged (same seed, identical league). CHOSEN,
      // as they were: each admits floating-point reassociation and nothing else.
      // `trade.ts`: evaluation and execution may disagree on a club's cap room by this much, no more.
      capRoomTolerance: 1e-9,
      // `offseason.ts`: a compliance restructure counts only if it lowers the cap hit by more than this.
      restructureProgressTolerance: 1e-9,
      minimumSchemeFitSpread: 0.04,
      minimumSchemeChanges: 20,

      // The bound (DESIGN.md 3.5.2). Reference overalls and the swing the published formula
      // produces for each. These are the FORMULA's values, computed by hand from
      // 0.30 x (1 - (overall - 55) / 44)^2 clamped to [0.06, 0.30].
      // [true overall, published floor, published ceiling] straight out of DESIGN.md 3.5.2.
      publishedPlayRanges: [
        [95, 88, 99],
        [85, 73, 96],
        [75, 57, 91],
        [65, 46, 82],
      ] as const,
      playRangeTolerance: 2,
      // ⚠ CHANGED from 0.05 while building this gate. The row's job is to prove the bound is
      // not vacuous, and it was written before the swing curve was resolved: under the narrow
      // literal formula the bound bit 23.7% of player-seasons, under the published table it
      // bites 1.6% — about 540 of ~34,000. That is the bound working as a safety rail rather
      // than as the main mechanism, which is what DESIGN.md 3.5.2 describes.
      minimumBoundedShare: 0.005,

      // Effective ratings.
      neutralProductTolerance: 1e-9,
      effectiveOverallTolerance: 1,
      maximumClampedShare: 0.05,
      effectiveRatioBias: 0.01,
      identityProbeSample: 400,
      identityProbeProducts: [0.80, 0.90, 0.95, 1.00, 1.05, 1.10] as const,
      minimumMeanProduct: 0.93,
      maximumMeanProduct: 1.05,
      // Required by the Phase 3.6 review: the league product redistributes performance and its
      // mean must stay within 0.01 of neutral after the per-player safety bound is reapplied.
      meanProductNormalizationTolerance: 0.01,
      minimumProductSpread: 0.03,

      // Revival — DESIGN.md 3.5.8, quoted.
      revivalAge: 28,
      revivalGain: 12,
      revivalMinimumPriorSeasons: 3,

      // Phase 4d. The single rate row was measuring two different phenomena. Both deltas are
      // taken against a CAREER AVERAGE, so a player who improved steadily arrives with a large
      // `trueDelta` from his own weaker early seasons and no situation change at all: a back who
      // was 70 at 24 and 84 at 28 has a prior-career mean near 75 and posts trueDelta ~ +9,
      // most of a "revival". Over four seeds Phase 4c counted 890 revivals, 474 of them
      // true-rating-carried with a mean true gain of +12.4 points. Slightly more than half the
      // counted population was a late bloomer. The rate row counted both kinds and the
      // situation-share row required the situation kind to be the majority, so the two rows sat
      // on one axis and every lever that helped one hurt the other. That is a metric defect.
      //
      // The rate is now decomposed. `situationRevivalRate` gates the DESIGN.md 3.5.8
      // phenomenon; `revivalRate` keeps total volume gated; the share is a printed diagnostic,
      // because with both numerators gated it is exactly their ratio.
      //
      // DERIVED across 12 seeds (3600017-3600028) x 20 league years, on the shipped Phase 4d
      // build, as share of qualifying 28+ players — the same denominator the row it replaces
      // used, which is also what keeps `mirrorRatio` (declines/revivals) coherent:
      //
      //   seed      situation-carried   all +12        seed      situation-carried   all +12
      //   3600017        2.79%           5.21%         3600023        2.79%           4.99%
      //   3600018        3.53%           5.85%         3600024        3.23%           5.35%
      //   3600019        2.13%           4.52%         3600025        2.75%           4.90%
      //   3600020        3.35%           5.15%         3600026        2.97%           5.07%
      //   3600021        2.85%           4.84%         3600027        2.64%           4.79%
      //   3600022        3.39%           5.56%         3600028        2.54%           4.77%
      //
      //   situation-carried   mean 2.91%  sd 0.39%  min 2.13%  max 3.53%
      //   all +12             mean 5.08%  sd 0.35%  min 4.52%  max 5.85%
      //
      // Band rule, applied to both: [min - 1sd, max + 1sd] rounded outward to the nearest 0.5%.
      // 12 of 12 seeds inside each. Phase 4c showed the gate seed sits at the high end of its
      // own distribution, so a band fitted to one seed is worthless; 3600017 lands at 2.79% and
      // 5.21%, mid-pack on the first and above the mean on the second.
      //
      // Cross-check on the PRE-Phase-4d build, same 12 seeds: situation-carried mean 2.69%
      // sd 0.45% min 2.06% max 3.50%, all +12 mean 4.77% sd 0.49% min 3.90% max 5.70%. The
      // same rule applied to that build derives situation-carried 1.5%-4.0% — byte-identical to
      // the band above — so the primary row's band does not depend on this phase's engine
      // changes. The volume row does move: this phase's changes raised the all-causes rate by
      // +0.31pp (4.77% -> 5.08%), and the pre-4d build's weakest seed, 3.90%, would sit 0.10pp
      // under the 4.0% floor derived here. The floor gates the shipped build, so it is derived
      // on the shipped build, but that is the margin it has.
      //
      // ⚠ THE CEILING MOVED. `revivalRateMax` was 0.05 and is now 0.065. DESIGN.md 3.5.8
      // publishes 2-5% for the all-causes definition, so the volume row is now WIDER than the
      // design's published range and that is a real, authorised (PHASE4D.md section 1) loss of
      // strictness. What replaces it is the row above: situation-carried revivals measure 2.91%
      // and sit INSIDE DESIGN.md's published 2-5%. The design's number now gates the phenomenon
      // the design describes, and the old row's job — capping total volume — survives as a
      // separate, weaker ceiling rather than as the primary check.
      situationRevivalRateMin: 0.015,
      situationRevivalRateMax: 0.040,
      revivalRateMin: 0.040,
      revivalRateMax: 0.065,
      // No longer a gate. DESIGN.md 3.5.8's "a clear majority must be attributable to a
      // situation change" is printed against this threshold in the diagnostics block; it is not
      // asserted, because with both rate rows above gated it is exactly their ratio.
      revivalSituationShareMin: 0.50,
      minimumMovedLift: 1.4,
      // Phase 3.6 review replacement for the unstable QB:RB revival ratio (only four RB events).
      // Matched ratings and RNG isolate the position-specific athletic decline mechanism.
      athleticDeclineSample: 400,
      athleticDeclineYoungAge: 26,
      athleticDeclineOldAge: 32,
      minimumRbToQbAthleticDeclineGap: 8,
      mirrorRatioMin: 0.5,
      mirrorRatioMax: 2.0,

      // Progression seam. ⚠ CHANGED from 0.5, which was a guess made before measuring. The
      // magnitude is not free: Phase 3.5 fixes `schemeFitWeight` at 0.10 inside a development
      // factor near 1.0, so a perfect-fit scheme can only develop a player about 11% faster
      // than a worst-fit one, which over an eight-season window is ~0.3 points of overall. The
      // row asserts the seam is live and directional with margin over matched-pair noise.
      minimumSchemeDevelopmentGap: 0.20,
      schemeDevelopmentSeasons: 8,
      schemeDevelopmentSnapShare: 0.8,
      schemeDevelopmentMaxAge: 24,
      schemeDevelopmentMinimumRoom: 5,
      schemeDevelopmentSample: 400,

      // League shape — the three rows the Phase 3.5 review recommended.
      youngShareMin: 0.25,
      youngShareMax: 0.35,
      youngAge: 24,
      oldShareMin: 0.10,
      oldShareMax: 0.17,
      oldAge: 30,
      turnoverMin: 0.22,
      turnoverMax: 0.32,

      // League talent level. A dynasty sim whose league-wide ability collapses invalidates its
      // own play-engine calibration, so the level is gated rather than assumed.
      minimumFinalMeanOverall: 72,
      maximumFinalMeanOverall: 78,
      maximumGeneratedMeanOverallGap: 2,
    },

    acceptance: {
      seed: 3_500_091,
      leagueYears: 20,
      cohortDraftYears: 10,
      minimumMeanRosterAge: 25.5,
      maximumMeanRosterAge: 27.5,
      minimumPlayerAge: 21,
      maximumPlayerAge: 45,
      minimumPeakMinusPotentialSd: 4.0,
      abovePotentialRateMin: 0.03,
      abovePotentialRateMax: 0.08,
      belowPotentialMargin: 5,
      minimumBelowPotentialRate: 0.20,
      minimumLeverOverallGap: 1.0,
      highDevelopmentTrait: 85,
      lowDevelopmentTrait: 15,
      highSnapShare: 0.90,
      lowSnapShare: 0.10,
      leverEvaluationSeasons: 4,
      minimumRbToQbPeakAgeGap: 3,
      minimumCbToSafetyPeakAgeGap: 0.01,
      cohortYoungAge: 26,
      cohortOldAge: 32,
      minimumAthleticDropAt32: 8,
      minimumMentalChangeAt32: 0,
      minimumMeanCareerLength: 4,
      maximumMeanCareerLength: 7,
      minimumRbToQbCareerLengthGap: 0.01,
    },
  },

  // ---------------------------------------------------------------------------------------
  // PHASE 6 — TRADES (DESIGN.md 7.2, 7.3, 10)
  //
  // The currency is SURPLUS VALUE IN CAP-SHARE-YEARS. Every number in this block is either a
  // published convention, a value measured off this engine (the measurement is named), or a
  // CHOSEN design parameter (labelled).
  // ---------------------------------------------------------------------------------------
  trade: {
    // DESIGN.md 10.1. The NFL deadline is after week 8's games in a 18-week season; week 9 is
    // where the work order puts it, so that is what this enforces.
    deadlineWeek: 9,
    // DESIGN.md 7.2 states the discount explicitly as "approximately 0.88/yr".
    discountPerYear: 0.88,

    // --- draft picks ---------------------------------------------------------------------
    //
    // MEASURED, not chosen. `tmp/65/measureSlots.ts` followed every drafted player through his
    // four-year rookie deal across 12 seeds x 5 draft classes (15,720 players) and summed
    // (marketValue at his actual overall that year - his actual cap hit) x 0.88^t. All three
    // charts are normalised onto this number, so they disagree about how a draft's value is
    // DISTRIBUTED and agree about what a whole draft is worth.
    //
    // ⚠ RE-MEASURED IN PLAYTEST 1: 378.8 -> 950.1, and it was re-measured rather than adjusted.
    // The rookie wage scale is a fixed dollar schedule while `marketValue` rose about 50%, so
    // every rookie contract became a far better bargain and the surplus in a draft class more
    // than doubled. Nothing about the draft changed; the thing it is measured against did.
    draftSurplusPerClass: 950.1,
    // The analytics chart is exp(-decay x (pick-1)). CHOSEN decay: 0.024 puts pick 32 at 0.475
    // of pick 1 against the Johnson chart's 0.197 - "much flatter", as DESIGN.md 7.3 asks -
    // which is the character of the published Fitzgerald-Spielberger and Massey-Thaler curves.
    analyticsDecay: 0.024,
    analyticsTopValue: 1000,
    // --- the measured chart (PHASE6-5.md §4a) ----------------------------------------------
    //
    // DERIVED, not chosen. The same method that produced `draftSurplusPerClass`: every drafted
    // player followed through his four-year rookie deal, summing (marketValue at his actual
    // overall that year − his actual cap hit) × 0.88^t, then averaged over ten-slot buckets.
    // 12 seeds, 15,720 players; n = 600 a bucket except the last, which carries every selection
    // past 230 and has 1,920. Standard error is 0.05–0.36 a bucket.
    //
    // ⚠ RE-MEASURED IN PLAYTEST 1, AND THE SHAPE MOVED, NOT ONLY THE LEVEL. Against the shipped
    // half-price market the curve peaked around pick 25 and the first ten selections returned
    // 42% of that peak — the Massey–Thaler result, and Phase 6.5's headline. At the corrected
    // market it is GONE: picks 1-10 now return 8.23 against a peak of 8.66 at picks 21-30, 95%.
    //
    // The mechanism is the same one that produced the original finding, running the other way.
    // Massey–Thaler holds when the rookie scale charges a top pick close to what he is worth, and
    // the scale is a fixed dollar schedule — so when market value rose about 50% and the scale did
    // not, the top of round one stopped being expensive relative to what it returns. The finding
    // was real, and it was an artefact of a market that priced stars at half price. See SUMMARY.md.
    //
    // Buckets are picks 1-10, 11-20, ... 221-230, then 231-262.
    measuredSlotSurplus: [
      8.232, 7.652, 8.661, 7.856, 6.659, 6.464, 5.346, 5.109,
      4.531, 3.444, 3.680, 3.003, 2.635, 2.732, 2.232, 2.200,
      1.811, 1.729, 1.690, 1.521, 1.359, 1.352, 1.475, 1.138,
    ] as const,
    measuredSlotBucketWidth: 10,

    // --- concave packaging (PHASE6-5.md §1) -------------------------------------------------
    //
    // CHOSEN: λ in `Σ vᵢ × λ^rankᵢ`. `marketValue` is convex (exponent 2.6) and summing surpluses
    // linearly was not, so the trade model preferred quantity while the production model
    // preferred quality — a gap a player could farm by hoarding cheap mid-tier surplus and
    // converting it into stars.
    //
    // SWEPT WITH `marginalStrength`, NOT AFTER IT — both reduce the value of piling up bodies, so
    // sweeping one at a time reads the other's effect as noise. 11 grid points, each pooled over
    // 3 seeds x 12 AI-only seasons (~1,200 trade lines a point) so the decision is not made on
    // the gate seed. Full table in SUMMARY.md. Against Phase 6 (λ = 1, strength = 0) this point
    // improves every gated row: mean absolute asymmetry 1.513 -> 1.463, asymmetry sd 3.425 ->
    // 2.947, clubs beyond 3 sd of chance 3 -> 0, buyer premium -0.241 -> -0.161, chart cohort
    // gap 0.158 -> 0.038 — while two-first-round-picks-for-a-starter deals rise 108 -> 136.
    packageDecay: 0.90,

    // --- marginal pricing over the depth chart (PHASE6-5.md §2) -----------------------------
    //
    // All CHOSEN. You can only start eleven, so a club's fifth receiver produces almost nothing
    // whatever his contract says. `marginalStrength` blends the whole factor back toward 1 and is
    // the sweep axis; at 0 the Phase 6 valuation is recovered exactly. Swept jointly with
    // `packageDecay` — see its note above and the table in SUMMARY.md. Past about 0.75 the market
    // starts overpaying at need and the buyer-premium row goes out of band.
    marginalStrength: 0.65,
    // Per rung below the starting line. 0.45 puts the first man off the lineup at 45% of a
    // starter, the second at 20%, the third at 9% — steep, because the drop from playing to not
    // playing is the steepest thing on a roster.
    depthDecayPerRank: 0.45,
    // A body is never literally free; a fourth quarterback still has a price.
    marginalFloor: 0.08,
    // How far a genuine hole may lift a price above par. Bounded on purpose: a needy club that
    // will pay any price is an exploitable club, and `needQualityScale` is 12, so a club whose
    // weakest starter at the position is 4 or more rating points under the 80 starter bar is
    // already at the cap.
    marginalNeedLiftMax: 0.35,

    // --- fog of war on picks (PHASE6-5.md §3) -----------------------------------------------
    //
    // All CHOSEN. A club reads the class through its own scouting reports and prices the picks
    // that reach its part of the board accordingly. The multiplier is renormalised so a club's
    // own seven-pick inventory is worth exactly what the chart said — scouting redistributes,
    // it never inflates — so these constants set the SPREAD across rounds and clubs, nothing
    // more. Measured spread is reported in SUMMARY.md.
    pickScoutWeight: 1.0,
    // Rating points of board-quality edge that move a pick's price by one `pickScoutWeight`.
    // `biasSdAtZeroScouting` is what sets how far two clubs' boards diverge in the first place.
    pickScoutQualityScale: 8,
    // Rating points a prospect is worth extra on the board of a club that needs his position.
    pickScoutNeedBonus: 4,
    pickScoutMultiplierCap: 0.30,
    // CHOSEN. `riskTolerance` is drawn per club with a median near 0.506, so this splits the
    // league roughly in half: the clubs that go for it on fourth down are the clubs that trust
    // a model over a 1991 negotiating convention.
    analyticsChartRiskThreshold: 0.506,
    // CHOSEN. A future pick's slot is unknown, so it is valued at its round's midpoint and
    // haircut on top of the time discount. Real front offices apply roughly a round of haircut.
    futurePickDiscount: 0.85,
    // DESIGN.md 10.1: "picks current and future, up to 3 years out".
    maxFuturePickYears: 3,
    maxPicksPerPackage: 4,

    // --- option and risk (DESIGN.md 7.2's second and third terms) -------------------------
    // All CHOSEN. Option value is the extra market value a player would command at his
    // potential rather than his current level, times the chance he gets there.
    optionAgeFloor: 22,
    optionAgeCeiling: 30,
    optionTraitFloor: 0.25,
    // developmentTrait is 0-100, so this maps the full range onto 0.25-0.85 of reach chance.
    optionTraitSlope: 0.006,
    optionRealisation: 0.55,
    ratingScale: 100,
    injuryRiskWeight: 0.22,
    // freeAgency.age.peakEnd is 28; two years past it is where a multi-year deal starts to be
    // a liability rather than an asset.
    ageCliff: 30,
    ageCliffRiskPerYear: 0.08,
    ageCliffRiskMax: 0.35,
    riskDiscountMax: 0.55,

    // --- AI stance (DESIGN.md 10.2) -------------------------------------------------------
    buyerOdds: 0.65,
    sellerOdds: 0.35,
    // CHOSEN. Playoff odds are a logistic on win percentage, tightened as the season runs. At
    // 12 the slope puts a 4-1 club near 0.72 and a 1-4 club near 0.28 by the deadline, which is
    // the buyer/seller split DESIGN.md 10.2 describes.
    oddsSlope: 12,
    // DESIGN.md 10.2 gives 1.05 flat. The stance modulation around it is CHOSEN: a seller is
    // cheaper to buy from than a contender, and nobody gives value away.
    // ⚠ NARROWED after measurement. The first values were 1.00 / 1.05 / 1.10, and the spread
    // between them IS the deadline premium: buyers pay it, sellers collect it. Measured on 20
    // AI-only seasons that premium ran to -0.303 cap-share-years per buyer line against +0.527
    // per seller line, which put two clubs more than 3 sd from chance on the neutral yardstick —
    // a systematic effect, not noise. Halving the spread keeps DESIGN.md 10.3 item 4's falling
    // seller price and stops it accumulating into an exploit. See SUMMARY.md.
    acceptRatioHold: 1.05,
    acceptRatioSeller: 1.02,
    acceptRatioBuyer: 1.08,
    analyticsRatioEdge: 0.02,

    // roster.starterMean is 80. A player at or above it is a starter, and a buyer does not sell
    // one at the deadline.
    starterOverall: 80,
    veteranAge: 28,
    blockSize: 6,
    partnersConsidered: 24,
    proposalsPerTeam: 4,
    // CHOSEN, and the reason DESIGN.md 10.4's "no club accumulating 15 first-rounders" holds:
    // one club cannot strip another bare in a single deadline. Set with `partnersConsidered` and
    // `proposalsPerTeam` to land the league in DESIGN.md 10.4's 25-60 trades a year.
    maxTradesPerTeamPerDeadline: 4,
    // CHOSEN. A seller shops at a slight discount to what the buyer thinks the player is
    // worth, which is what makes a deadline market clear at all. DESIGN.md 10.3 item 4.
    sellerAskDiscount: 0.92,
    // CHOSEN. A seller leads with the player who fills the buyer's hole, because that is
    // the call that gets returned. DESIGN.md 10.3 item 2.
    sellerNeedBonus: 1.5,
    // CHOSEN. How far off 53 a trade may leave a club before the corresponding move cannot
    // close it. Two in either direction covers every package the AI builds and every one a
    // user can assemble on the screen.
    maxRosterSwing: 2,
    // `correspondingCutReserve` LIVED HERE AND IS GONE. It was the cap a club reserved per man
    // it came out of a trade over the limit, against the proration the corresponding cut would
    // accelerate — an ESTIMATE of a move execution then made for real. Evaluation and execution
    // disagreed on every trade this engine made, by as much as 14.4% of the cap, and a club could
    // be approved as cap-legal and finish the year over. `planCorrespondingMoves` now computes
    // the actual move at evaluation and `executeTrade` applies it, so there is nothing to reserve
    // against. Deliberately not replaced with a bigger number: a margin hides the defect.
    maxCapReliefCuts: 4,
    // CHOSEN. How hard a street signing chases the hole the trade opened rather than the
    // best player left on the board.
    replacementNeedWeight: 40,
    // CHOSEN. How a club prices a position it has little evidence about: the observed
    // effective/true ratio is shrunk toward 1 by n/(n + productShrinkage) and clamped. Without
    // it, a position held by one player produced a multiplier drawn from a sample of one, and
    // because marketValue is convex the resulting prices had a spread of accepted-trade
    // asymmetry of 4.07 cap-share-years against 3.0 with it.
    productShrinkage: 3,
    productFloor: 0.90,
    productCeiling: 1.10,
    needShortfallWeight: 1.4,
    needQualityScale: 12,

    // --- what a club prices a player at, as opposed to what he plays at (VALUATION-1.md) -----
    //
    // How much of a player's SITUATION carries into the rating the trade model prices him on.
    // 1 is his effective overall and is what shipped through W9; 0 is his true overall and every
    // club reads every player identically. `valuationOverall` interpolates.
    //
    // ⚠ CHOSEN — swept, not computed. A grid was measured and a point was picked, and no
    // formula returns 0.05. `draftSurplusPerClass` two blocks up is what DERIVED looks like.
    //
    // THE DEFECT IS A CHANGE OF UNITS, not of ratings. `effective.ts` bounds the situation swing
    // in RATING space exactly as DESIGN.md 3.5.2 publishes — at an 89 overall the legal floor is
    // 78.24, a 12.1% penalty — and the only consumer of it works in VALUE space, through
    // `marketValue`'s exponent of 2.4, where the same 12.1% removes 59.9% of his priced
    // production. The cap hit does not move, so the sign flipped and the best contracts in the
    // league priced as liabilities to the clubs that held them.
    //
    // SWEPT over 13 points from 0.00 to 1.00 (0.05 steps to 0.40, then 0.50 / 0.65 / 0.80 / 1.00),
    // each pooled over 8 independently generated leagues, against four competing rows: priced
    // production retained at the legal swing floor must clear 0.75 for every overall at 85 and
    // above, which binds from ABOVE at w <= 0.248; trade volume must stay inside DESIGN.md 10.4's
    // 25-60 a league year, which binds from BELOW (19.5 at w = 0); "valuations that move with the
    // situation" needs w > 0; and the two acceptance rows this work order exists to close want w
    // as low as possible. 0.05 is the best measured point on every one of those axes bar volume,
    // where it reads 39.9 a league year against a floor of 25. It also keeps `phase6-hindsight`
    // closest to its pre-change state. Full table in SUMMARY.md, 2026-09-12.
    //
    // ⚠ AND IT DOES NOT CLOSE ITS OWN ROWS. At every weight including 0, two rows in
    // `test:phase6-value` stay red. Those failures are NOT this constant's population: 65 of the
    // 67 measured are paid ABOVE market over the life of the deal and only look cheap because the
    // contract is back-loaded, and the row filters on one year's cap hit and then asks about five
    // years of surplus. The row needs fixing, not this number. See SUMMARY.md.
    valuationSituationWeight: 0.05,

    // --- the deal bar (DEPTH.md W9) ---------------------------------------------------------
    //
    // Where the trade screen's five bands meet, in units of `dealProgress` — that is,
    // `incomingValue / (outgoingValue × requiredRatio)`. So 1.00 is the club's own acceptance
    // bar and IS NOT A NUMBER IN THIS BLOCK: it is the boundary `evaluateTrade` already draws,
    // and a tunable copy of it is exactly the drift between bar and verdict that W9 exists to
    // make impossible. These are the three boundaries around it, and all three are CHOSEN.
    dealBar: {
      // Below half of their bar this is not a negotiation, it is an opening joke. Nothing is
      // drawn at all under it — a sliver at 0.4 reads as progress and invites the user to keep
      // nudging one seventh-rounder at a time at a deal that is three rounds away. The band
      // still carries its label, so the state is never conveyed by the absence of a colour.
      notCloseBelow: 0.50,
      // Where "no" starts to mean "not yet". A club's ratio runs 1.00–1.08, so a package at 0.85
      // is about one mid-round pick short — close enough that the next asset the user adds can
      // finish it, which is the whole of what this band has to tell him.
      closeBelow: 0.85,
      // How far past a club's bar stops being margin and starts being generosity. The ratios
      // themselves span 0.06 (1.02 at a seller, 1.08 at a buyer), so a margin tighter than that
      // would paint ordinary stance variation as overpaying and the warning would stop meaning
      // anything. 0.15 is clear of it and still inside one mid-round pick on most packages.
      overpayMargin: 0.15,
    },
  },

  acceptance: {
    seasons: 10,
    seed: 42,
    performanceSeasonSeconds: 3,
    outcomes: {
      pointsPerTeam: { min: 22.0, max: 23.5, label: 'Points per team per game' },
      gameTotalSd: { min: 13.0, max: 14.5, label: 'Game total, sd' },
      teamScoreSd: { min: 9.4, max: 10.5, label: 'Team score, sd' },
      meanAbsoluteMargin: { min: 10.5, max: 11.8, label: 'Mean absolute margin' },
      medianMargin: { min: 7, max: 9, label: 'Median margin' },
      homeMargin: { min: 1.4, max: 2.2, label: 'Home margin' },
      homeWinPct: { min: 0.52, max: 0.57, label: 'Home win %' },
      overtimeRate: { min: 0.045, max: 0.07, label: 'OT rate' },
      shutoutRate: { min: 0.006, max: 0.016, label: 'Shutouts per team-game' },
    },
    cumulativeMargins: [
      { margin: 3, target: 0.242, tolerance: 0.02 },
      { margin: 7, target: 0.489, tolerance: 0.025 },
      { margin: 10, target: 0.598, tolerance: 0.025 },
      { margin: 14, target: 0.708, tolerance: 0.025 },
      { margin: 21, target: 0.859, tolerance: 0.02 },
      { margin: 28, target: 0.947, tolerance: 0.015 },
    ],
    exactMarginThree: { min: 0.13, max: 0.16 },
    // NFLVERSE S4, REPORT-ONLY (owner decision 2026-09-24): the other exact-margin spikes, banded the
    // way exactMarginThree is. That band is the real 14.65% +- 1.5 points, 2.28 SE of 2,895 games;
    // each band here is its real rate (6.94 / 8.67 / 4.87 / 5.11%, schedules 2015-2025) +- 2.28 of
    // its own SE. DERIVED rates, the 2.28 carried over from exact-3. `report:nflverse` prints them
    // beside the rows; no gate reads them.
    exactMarginReportBands: [
      { margin: 6, min: 0.059, max: 0.080 },
      { margin: 7, min: 0.075, max: 0.099 },
      { margin: 10, min: 0.040, max: 0.058 },
      { margin: 14, min: 0.042, max: 0.060 },
    ],
    scoreThresholds: [
      { points: 10, target: 0.917, tolerance: 0.025 },
      { points: 17, target: 0.737, tolerance: 0.03 },
      { points: 20, target: 0.637, tolerance: 0.03 },
      { points: 24, target: 0.465, tolerance: 0.03 },
      { points: 30, target: 0.254, tolerance: 0.025 },
      { points: 35, target: 0.115, tolerance: 0.02 },
      { points: 40, target: 0.055, tolerance: 0.015 },
    ],
    // S1 (NFLVERSE.md), 2026-09-23: every band re-centred on the population value, width unchanged
    // (owner decision §9.3). DERIVED from nflverse play-by-play, regular season 2015-2025, n = 5,790
    // team-games (punts: 2023-2025, n = 1,632, era cause `fourth-down-analytics`), manifest
    // 2026-09-23T22:13:05Z. Reproduce with `npm run nflverse:rebase-s1`, which also lists the
    // before value of every band. The 96-game sample these came from is no longer a target source.
    boxScore: {
      totalYards: { min: 327.5, max: 358.5, label: 'Total yards' },
      totalPlays: { min: 60.2, max: 66.2, label: 'Total plays (incl. sacks)' },
      yardsPerPlay: { min: 5.17, max: 5.67, label: 'Yards per play' },
      passingYards: { min: 213.9, max: 242.9, label: 'Passing yards (net)' },
      passAttempts: { min: 31.2, max: 37.2, label: 'Pass attempts' },
      completionPct: { min: 0.622, max: 0.662, label: 'Completion %' },
      rushingYards: { min: 102.1, max: 127.1, label: 'Rushing yards' },
      // Net passing yards / (attempts + sacks): per DROPBACK, not per attempt (CALIBRATION.md).
      yardsPerDropback: { min: 5.8, max: 6.7, label: 'Yards per dropback' },
      rushAttempts: { min: 23.6, max: 29.6, label: 'Rush attempts' },
      yardsPerCarry: { min: 3.978, max: 4.628, label: 'Yards per carry' },
      sacksAllowed: { min: 1.97, max: 2.77, label: 'Sacks allowed' },
      firstDowns: { min: 18, max: 22, label: 'First downs' },
      penaltyFirstDowns: { min: 1.41, max: 2.31, label: '  1D via penalty' },
      thirdDownAttempts: { min: 11.43, max: 14.43, label: '3rd down attempts' },
      redZoneTrips: { min: 2.88, max: 3.78, label: 'Red zone trips' },
      penalties: { min: 5.3, max: 7.3, label: 'Penalties' },
      penaltyYards: { min: 45, max: 61, label: 'Penalty yards' },
      punts: { min: 3.12, max: 4.52, label: 'Punts' },
      puntAverage: { min: 43.4, max: 48.4, label: 'Punt average' },
      possessionSeconds: { min: 1736.7, max: 1886.7, label: 'Time of possession (sec)' },
    },
    // Derived rates from CALIBRATION.md. These were specified in SPEC.md's Phase 0 acceptance
    // table and must be gated, not merely produced. S1 re-based the first eight exactly as the
    // box-score block above (same source, same script). The tie rate is an outcome row from the
    // schedules and did not move.
    rates: {
      sackRatePerDropback: { min: 0.0589, max: 0.0709, label: 'Sack rate per dropback' },
      turnoversPerTeam: { min: 1.07, max: 1.57, label: 'Turnovers per team' },
      intPerAttempt: { min: 0.0175, max: 0.0285, label: 'INT per attempt' },
      fumblesLostPerTeam: { min: 0.384, max: 0.684, label: 'Fumbles lost per team' },
      thirdDownPct: { min: 0.3568, max: 0.4318, label: '3rd down %' },
      redZoneTdPct: { min: 0.506, max: 0.616, label: 'Red zone TD %' },
      passPlayShare: { min: 0.544, max: 0.614, label: 'Pass play share' },
      passShareOfYards: { min: 0.626, max: 0.706, label: 'Pass share of yards' },
      tieRate: { min: 0.0, max: 0.006, label: 'Tie rate' },
    },
  },
})

