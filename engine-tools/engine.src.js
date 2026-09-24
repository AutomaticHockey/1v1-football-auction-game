/* =====================================================================
   PLAY-BY-PLAY ENGINE
   A JavaScript port of the Cornerstone NFL engine (D:\NFL game test, src/core:
   rng, depthChart, coachAI, playEngine, gameEngine, stats). Constants in T are
   copied verbatim from its tuning.ts.

   With no options it reproduces the original exactly, draw for draw.
   `opts.real` switches on what this game adds, all of it outside the original's
   random stream: per-player modifiers from real stats (target share, carry share,
   catch rate, yards per catch, INT rate, defense quality), a drive log, a neutral
   field, and quarter-by-quarter play.
   ===================================================================== */
const ENGINE = (() => {
  const T = /*@@TUNING@@*/null;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const otherSide = s => (s === 'home' ? 'away' : 'home');

  /* ---------- rng.ts ---------- */
  function mulberry32(seed) {
    const rootSeed = seed >>> 0;
    let a = rootSeed;
    const next = () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      next,
      int(min, max) { return Math.floor(next() * (max - min + 1)) + min; },
      pick(arr) { return arr[Math.floor(next() * arr.length)]; },
      chance(p) { return next() < Math.max(0, Math.min(1, p)); },
      gauss(mean, sd) {
        let u = 0, v = 0;
        while (u === 0) u = next();
        while (v === 0) v = next();
        return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      },
      fork(label) {
        let hash = 2166136261 ^ rootSeed;
        for (let i = 0; i < label.length; i += 1) { hash ^= label.charCodeAt(i); hash = Math.imul(hash, 16777619); }
        return mulberry32(hash >>> 0);
      }
    };
  }

  /* ---------- depthChart.ts ---------- */
  const GROUP_POSITIONS = { QB: ['QB'], RB: ['RB', 'FB'], WR: ['WR'], TE: ['TE'], OL: ['LT', 'LG', 'C', 'RG', 'RT'], DL: ['EDGE', 'DT'], LB: ['LB'], DB: ['CB', 'S'], ST: ['K', 'P', 'LS'] };
  const RATING_KEYS = ['speed', 'agility', 'strength', 'stamina', 'throwPower', 'throwAccuracy', 'throwOnRun', 'carrying', 'breakTackle', 'vision', 'catching', 'routeRunning', 'catchInTraffic', 'separation', 'runBlock', 'passBlock', 'passRush', 'runDefense', 'blockShedding', 'manCoverage', 'zoneCoverage', 'tackling', 'hitPower', 'kickPower', 'kickAccuracy', 'awareness', 'playRecognition', 'poise', 'processing', 'consistency', 'aggression', 'injuryProne'];
  function createReplacementPlayer(position) {
    const ratings = {};
    for (const k of RATING_KEYS) ratings[k] = T.roster.replacementRating;
    return { id: -1, lastName: 'Replacement', position, ratings, overall: T.roster.replacementRating, weeksInjured: 0 };
  }
  const availableSorted = list => list.filter(p => p.weeksInjured === 0).sort((l, r) => r.overall - l.overall || l.id - r.id);
  function buildDepthChart(team, players) {
    const ids = new Set(team.roster);
    const roster = players.filter(p => ids.has(p.id));
    const positions = new Map(), groups = new Map();
    for (const p of roster) if (!positions.has(p.position)) positions.set(p.position, availableSorted(roster.filter(c => c.position === p.position)));
    for (const [group, gp] of Object.entries(GROUP_POSITIONS)) groups.set(group, availableSorted(roster.filter(p => gp.includes(p.position))));
    const available = availableSorted(roster);
    const fallback = (position, depth) => {
      const group = Object.keys(GROUP_POSITIONS).find(k => GROUP_POSITIONS[k].includes(position));
      const related = group === undefined ? [] : (groups.get(group) || []);
      const atPos = positions.get(position);
      return related[depth] ?? (atPos ? atPos[0] : undefined) ?? related[0] ?? available[0] ?? createReplacementPlayer(position);
    };
    return {
      unit: team.unit || null,
      get(position, depth = 0) { const l = positions.get(position); return (l ? l[depth] : undefined) ?? fallback(position, depth); },
      getGroup(group, depth = 0) { const l = groups.get(group); return (l ? l[depth] : undefined) ?? fallback(GROUP_POSITIONS[group][0], depth); }
    };
  }
  function receivingOptions(chart) {
    const d = T.roster.depth;
    const options = [chart.get('WR', d.starter), chart.get('WR', d.second), chart.get('WR', d.third), chart.get('TE', d.starter), chart.get('RB', d.starter), chart.get('WR', d.fourth), chart.get('TE', d.second), chart.getGroup('RB', d.second)];
    return options.filter((p, i) => options.findIndex(o => o.id === p.id) === i);
  }

  /* ---------- coachAI.ts ---------- */
  const C = () => T.coach;
  function scoreDiffCtx(context, isHome) { return isHome ? context.homeScore - context.awayScore : context.awayScore - context.homeScore; }
  function urgency(context, isHome) {
    const difference = scoreDiffCtx(context, isHome);
    if (context.quarter > T.football.downs) {
      if (difference < 0) return C().urgencyFourthQuarter;
      if (difference === 0) return C().urgencyOvertimeTied;
      return C().urgencyBase;
    }
    if (difference >= 0) return C().urgencyBase;
    const timeFactor = context.quarter === T.football.downs ? C().urgencyFourthQuarter : context.quarter === C().lateQuarter ? C().urgencyThirdQuarter : 0;
    if (difference >= -C().urgencyCloseDeficit && timeFactor === C().urgencyFourthQuarter) return C().urgencyFourthQuarter;
    return C().urgencyMid * timeFactor;
  }
  function selectPassType(coach, context, need, rng) {
    const c = C(), w = T.passing.routeWeights;
    let screen = w.screen * c.weightScale, short = w.short * c.weightScale, medium = w.medium * c.weightScale, deep = w.deep * c.weightScale;
    if (context.toGo > c.veryLongDistance) { screen += c.veryLongScreenBonus; deep += c.veryLongDeepBonus; short -= c.veryLongShortPenalty; }
    if (context.toGo < c.shortDistance) { short += c.shortPassBonus; medium += c.mediumPassBonus; deep -= c.shortDeepPenalty; }
    deep += coach.aggressiveness * c.aggressionDeepScale;
    if (coach.riskTolerance < c.conservativeThreshold) { screen += c.conservativeSafeBonus; short += c.conservativeSafeBonus; deep -= c.conservativeDeepPenalty; }
    if (coach.trustInQB < c.lowTrustThreshold) { deep = 0; medium -= c.lowTrustMediumPenalty; screen += c.lowTrustScreenBonus; }
    if (need > c.urgencyDeepThreshold) { short -= c.urgencyShortPenalty; deep += c.urgencyDeepBonus; }
    const choices = [['screen', screen], ['shortPass', short], ['mediumPass', medium], ['deepPass', deep]];
    const total = choices.reduce((s, ch) => s + Math.max(0, ch[1]), 0);
    let roll = rng.next() * total;
    for (const ch of choices) { roll -= Math.max(0, ch[1]); if (roll <= 0) return ch[0]; }
    return 'shortPass';
  }
  function selectRunType(coach, context, rng) {
    const c = C();
    let inside = c.weightBase, outside = c.weightBase, draw = c.drawWeightBase;
    if (context.toGo > c.drawDistance) draw += c.drawDistanceBonus;
    if (context.yardLine >= T.scoring.redZoneLine) inside += c.redZoneInsideBonus;
    if (coach.aggressiveness > c.aggressiveThreshold) outside += c.outsideAggressiveBonus;
    inside += rng.next(); outside += rng.next(); draw += rng.next();
    if (draw > inside && draw > outside) return 'draw';
    return outside > inside ? 'outsideRun' : 'insideRun';
  }
  function selectPlay(coach, context, isHome, rng) {
    const c = C();
    const need = urgency(context, isHome);
    let passProbability = coach.passBias + c.selectionPassAdjustment;
    if (context.down === c.lateQuarter && context.toGo > c.longThirdDown) passProbability += c.longThirdPassBonus;
    if (context.down === c.lateQuarter && context.toGo < c.shortThirdDown) passProbability -= c.shortThirdPassPenalty;
    const difference = scoreDiffCtx(context, isHome);
    if (difference > c.protectLeadPoints && context.quarter >= c.lateQuarter) passProbability -= c.protectLeadPassScale * (1 - coach.aggressiveness);
    else if (difference < -c.comebackPoints && context.quarter >= c.lateQuarter) passProbability += c.comebackPassScale * need;
    if (REAL && coach.rzRun && context.yardLine >= T.scoring.redZoneLine) passProbability -= coach.rzRun;
    passProbability = Math.max(c.minProbability, Math.min(c.maxProbability, passProbability));
    const playType = rng.chance(passProbability) ? selectPassType(coach, context, need, rng) : selectRunType(coach, context, rng);
    const drainClock = difference > c.comebackPoints && context.quarter === T.football.downs;
    let riskTolerance = Math.round(coach.riskTolerance * c.riskScale);
    if (context.down === c.lateQuarter && context.toGo > c.desperateDistance) riskTolerance += c.desperateRiskBonus;
    if (context.yardLine >= T.scoring.redZoneLine) riskTolerance -= c.redZoneRiskPenalty;
    let tempo = Math.round(coach.tempo * c.riskScale);
    if (difference < -c.lateDeficit && context.quarter === T.football.downs && context.clock < T.clock.lateGameSeconds) tempo = c.turboTempo;
    if (drainClock) tempo = c.drainTempo;
    if (context.quarter > T.football.downs && difference === 0) tempo = c.turboTempo;
    if (context.quarter === T.football.downs && difference === 0 && context.clock < T.football.twoMinuteSeconds) tempo = c.turboTempo;
    return {
      playType, riskTolerance, tempo,
      forceBall: need > c.urgencyHigh && context.clock <= c.forceBallClock && difference < -c.forceBallDeficit,
      drainClock,
      greenLightScramble: coach.trustInQB > c.trustScramble,
      maxReads: coach.trustInQB > c.trustReads ? c.maxReadsTrusted : c.maxReadsSimple
    };
  }

  /* ---------- playEngine.ts ---------- */
  // REAL is the active game's real-stats switch. The engine is synchronous, so it is set at the
  // start of every public call and never interleaves.
  let REAL = false;
  const clockUsed = rng => rng.int(T.clock.snapToWhistleMin, T.clock.snapToWhistleMax);
  const resultBase = rng => ({ clockUsed: clockUsed(rng), isTurnover: false, isTouchdown: false, isFirstDown: false, outOfBounds: false, players: {} });
  const average = (ps, field) => ps.reduce((s, p) => s + p.ratings[field], 0) / ps.length;

  function penaltyResult(context, rng, isHomeOffense) {
    const P = T.penalties;
    const crowdBonus = isHomeOffense ? 0 : P.homeCrowdAwayBonus * context.crowdFactor;
    if (!rng.chance(P.perSnap + crowdBonus)) return null;
    const onOffense = rng.chance(P.offenseShare);
    let yards, automaticFirstDown = false;
    if (onOffense) yards = rng.chance(P.preSnapShare) ? P.falseStartYards : P.holdingYards;
    else if (rng.chance(P.automaticFirstDownShare)) {
      automaticFirstDown = true;
      yards = rng.chance(P.preSnapShare) ? P.defensiveHoldingYards
        : Math.round(clamp(rng.gauss(P.passInterferenceMean, P.passInterferenceSd), P.passInterferenceMin, P.passInterferenceMax));
    } else yards = rng.chance(P.facemaskShare) ? P.facemaskYards : P.defensiveHoldingYards;
    const applied = onOffense ? -yards : yards;
    return Object.assign(resultBase(rng), {
      yards: applied, type: 'penalty',
      isFirstDown: automaticFirstDown || (!onOffense && applied >= context.toGo),
      penalty: { yards, onOffense, automaticFirstDown },
      desc: `${onOffense ? 'Offensive' : 'Defensive'} penalty, ${yards} yards`
    });
  }
  function chooseRusher(chart, rng, context) {
    const R = T.rushing, d = T.roster.depth;
    if (REAL) {
      // Carry share from real carries per game: lead back, second back (a FLEX RB or filler), QB designed runs, the rest.
      const qb = chart.get('QB'), options = [chart.get('RB', d.starter), chart.getGroup('RB', d.second), qb, chart.getGroup('RB', d.third)];
      const rz = context.yardLine >= T.scoring.redZoneLine;
      const w = options.map((p, i) => (i === 2 ? (p.prof ? p.prof.designedCarries : 0) : (p.prof ? p.prof.carries : 1)) * (rz && p.prof ? p.prof.rzRush : 1));
      let roll = rng.next() * w.reduce((a, b) => a + b, 0);
      for (let i = 0; i < options.length; i += 1) { roll -= w[i]; if (roll <= 0) return options[i]; }
      return options[0];
    }
    const roll = rng.next();
    if (roll < R.leadRbCarryShare) return chart.get('RB', d.starter);
    if (roll < R.leadRbCarryShare + R.secondRbCarryShare) return chart.get('RB', d.second);
    if (roll < R.leadRbCarryShare + R.secondRbCarryShare + R.thirdRbCarryShare) return chart.get('RB', d.third);
    return chart.getGroup('RB', d.fourth);
  }
  function fumbleResult(base, carrier, tackler, rng, defenseChart) {
    const R = T.rushing;
    const skillAdjustment = (tackler.ratings.hitPower - carrier.ratings.carrying) / R.carryingEffectDivisor;
    let fumbleChance = (R.fumbleLostPerPlay / R.fumbleRecoveryOffense) * R.fumbleEligibleMultiplier + skillAdjustment;
    if (REAL && defenseChart && defenseChart.unit) fumbleChance *= defenseChart.unit.fumMult;
    if (!rng.chance(fumbleChance)) return base;
    const lost = !rng.chance(R.fumbleRecoveryOffense);
    return Object.assign({}, base, { type: 'fumble', isTurnover: lost, desc: `${carrier.lastName} fumbles${lost ? ', defense recovers' : ', offense recovers'}` });
  }
  function resolveRun(offense, defense, context, rng) {
    const R = T.rushing;
    const rusher = chooseRusher(offense, rng, context);
    const blockers = [offense.get('LT'), offense.get('LG'), offense.get('C'), offense.get('RG'), offense.get('RT')];
    const front = [defense.get('EDGE', 0), defense.get('EDGE', 1), defense.get('DT', 0), defense.get('LB', 0)];
    const redZonePenalty = context.yardLine >= T.scoring.redZoneLine ? R.redZoneYardsPenalty * (REAL && offense.unit ? offense.unit.rzPen : 1) : 0;
    let matchup = (average(blockers, 'runBlock') - average(front, 'runDefense') + rusher.ratings.vision - T.roster.starterMean) / R.ratingEffectDivisor - redZonePenalty;
    if (REAL) matchup += (rusher.prof ? rusher.prof.ypcOff : 0) + (defense.unit ? defense.unit.runOff : 0);
    let yards = Math.round(clamp(rng.gauss(R.yardsMean + matchup, R.yardsSd), R.minimumYards, R.maximumNormalYards));
    if (rng.chance(R.breakawayChance + Math.max(0, rusher.ratings.speed - T.roster.starterMean) / R.carryingEffectDivisor)) {
      const tail = -R.breakawayScale * Math.log(1 - rng.next());
      yards = Math.round(clamp(R.breakawayMin + tail, R.breakawayMin, R.breakawayMax));
    }
    yards = Math.min(yards, T.football.fieldLength - context.yardLine);
    const tackler = defense.getGroup('DB', rng.int(0, 1));
    const base = Object.assign(resultBase(rng), {
      yards, type: 'run',
      isTouchdown: context.yardLine + yards >= T.football.fieldLength,
      isFirstDown: yards >= context.toGo
    });
    base.outOfBounds = rng.chance(R.outOfBoundsChance);
    base.players = { rusher: rusher.id, tackler: tackler.id };
    base.desc = `${rusher.lastName} runs for ${yards} yards`;
    return fumbleResult(base, rusher, tackler, rng, defense);
  }
  function routeKind(intent) {
    if (intent.playType === 'screen') return 'screen';
    if (intent.playType === 'shortPass' || intent.playType === 'playAction') return 'short';
    if (intent.playType === 'deepPass') return 'deep';
    return 'medium';
  }
  function chooseReceiver(receivers, rng, context) {
    const P = T.passing;
    let weights;
    if (REAL) {
      // Target share from real targets per game. Inside the red zone it leans toward players who score.
      const rz = context.yardLine >= T.scoring.redZoneLine;
      weights = receivers.map(r => r.prof ? r.prof.targets * (rz ? r.prof.rzBias : 1) : 0.5);
    } else {
      const depthWeights = [P.leadingTargetWeight, P.secondTargetWeight, P.thirdTargetWeight, P.otherTargetWeight, P.otherTargetWeight];
      weights = receivers.map((r, i) => ((depthWeights[i] ?? P.targetWeightFloor) + r.overall / P.receiverOverallScale) * (P.rotationExposure[i] ?? 0));
    }
    const total = weights.reduce((s, v) => s + v, 0);
    let roll = rng.next() * total;
    for (let i = 0; i < receivers.length; i += 1) { roll -= weights[i] ?? 0; if (roll <= 0) return receivers[i]; }
    return receivers[receivers.length - 1];
  }
  function resolvePass(offense, defense, intent, context, isHomeOffense, rng) {
    const P = T.passing, c = C();
    const qb = offense.get('QB');
    const blockers = [offense.get('LT'), offense.get('LG'), offense.get('C'), offense.get('RG'), offense.get('RT')];
    const rushers = [defense.get('EDGE', 0), defense.get('EDGE', 1), defense.get('DT', 0), defense.get('DT', 1)];
    const protection = average(blockers, 'passBlock'), passRush = average(rushers, 'passRush');
    const sackAdjustment = (passRush - protection) / P.ratingEffectDivisor;
    // The original computes pocket pressure here; it has no effect on the result, so it is omitted.
    if (rng.chance(clamp(P.sackRatePerDropback + sackAdjustment, 0, c.conservativeThreshold))) {
      const yards = Math.round(clamp(rng.gauss(P.sackYardsMean, P.sackYardsSd), P.minimumLoss, 0));
      const sacker = rng.pick(rushers);
      return Object.assign(resultBase(rng), { yards, type: 'sack', isFirstDown: false, players: { passer: qb.id, sacker: sacker.id }, desc: `${qb.lastName} sacked for ${Math.abs(yards)} yards` });
    }
    if (intent.greenLightScramble && qb.ratings.speed >= P.scrambleSpeedThreshold && rng.chance(P.scrambleRate)) {
      const yards = Math.round(clamp(rng.gauss(P.scrambleYardsMean, P.scrambleYardsSd), 0, P.maximumScramble));
      const cappedYards = Math.min(yards, T.football.fieldLength - context.yardLine);
      const tackler = defense.getGroup('DB', 0);
      const base = Object.assign(resultBase(rng), { yards: cappedYards, type: 'scramble', isTouchdown: context.yardLine + cappedYards >= T.football.fieldLength, isFirstDown: cappedYards >= context.toGo });
      base.outOfBounds = rng.chance(T.rushing.outOfBoundsChance);
      base.players = { rusher: qb.id, tackler: tackler.id };
      base.desc = `${qb.lastName} scrambles for ${cappedYards} yards`;
      return fumbleResult(base, qb, tackler, rng, defense);
    }
    const receivers = receivingOptions(offense);
    const selected = chooseReceiver(receivers, rng, context);
    const receiverIndex = receivers.indexOf(selected);
    const receiver = receiverIndex >= 5
      ? Object.assign({}, selected, { ratings: receivers[Math.min(receiverIndex - 3, 4)].ratings, overall: receivers[Math.min(receiverIndex - 3, 4)].overall })
      : selected;
    const d = T.roster.depth;
    const defenders = [defense.get('CB', d.starter), defense.get('CB', d.second), defense.get('CB', d.third), defense.get('LB', d.starter), defense.get('S', d.starter), defense.get('CB', d.third), defense.get('LB', d.second), defense.get('S', d.second)];
    const defender = defenders[receiverIndex] ?? defenders[0];
    const kind = routeKind(intent);
    const coverage = (defender.ratings.manCoverage + defender.ratings.zoneCoverage) / c.shortThirdDown;
    const receiverSkill = (receiver.ratings.catching + receiver.ratings.routeRunning + receiver.ratings.separation) / P.receiverSkillTerms;
    let ratingAdjustment = (qb.ratings.throwAccuracy + receiverSkill - coverage - T.roster.starterMean) / P.ratingEffectDivisor;
    if (REAL) ratingAdjustment += (qb.prof ? qb.prof.compOff + (context.yardLine >= T.scoring.redZoneLine ? qb.prof.rzComp || 0 : 0) : 0) + (selected.prof ? selected.prof.catchOff : 0) + (defense.unit ? defense.unit.compOff : 0);
    const W = context.weather, WT = T.weather;
    const coldPenalty = W.tempF < WT.extremeCold ? P.extremeColdCompletionPenalty : W.tempF < WT.snowTemperature ? P.coldCompletionPenalty : 0;
    const weatherPenalty = W.windMph * P.windCompletionPenaltyPerMph + (W.precip === 'rain' ? P.rainCompletionPenalty : 0) + (W.precip === 'snow' ? P.snowCompletionPenalty : 0) + coldPenalty - (W.indoor ? P.indoorCompletionBonus : 0);
    const forcedPenalty = intent.forceBall ? P.forcedCompletionPenalty : 0;
    let interceptionChance = P.intPerAttempt + (intent.forceBall ? P.forcedIntBonus : 0);
    if (REAL) interceptionChance *= (qb.prof ? qb.prof.intMult : 1) * (defense.unit ? defense.unit.intMult : 1);
    const offenseDifference = isHomeOffense ? context.homeScore - context.awayScore : context.awayScore - context.homeScore;
    const late = context.quarter === T.football.downs && context.clock <= T.clock.lateGameSeconds;
    const oneScoreComeback = late && offenseDifference < 0 && offenseDifference >= -c.urgencyCloseDeficit;
    const twoScoreComeback = late && offenseDifference < -c.urgencyCloseDeficit && offenseDifference >= -P.comebackMaximumDeficit;
    const comebackBoost = oneScoreComeback ? P.lateComebackCompletionBoost : twoScoreComeback ? P.lateTwoScoreCompletionBoost : 0;
    const redZoneCompletionPenalty = context.yardLine >= T.scoring.redZoneLine ? P.redZoneCompletionPenalty * (REAL && offense.unit ? offense.unit.rzPen : 1) : 0;
    if (rng.chance(interceptionChance)) {
      return Object.assign(resultBase(rng), { yards: 0, type: 'int', isTurnover: true, players: { passer: qb.id, receiver: receiver.id, tackler: defender.id }, desc: `${qb.lastName} intercepted targeting ${receiver.lastName}` });
    }
    const homeBoost = isHomeOffense && !context.neutral ? P.homeRatingBoost / P.ratingEffectDivisor : 0;
    const completionChance = clamp(P.routeCompletion[kind] + ratingAdjustment + homeBoost + comebackBoost - weatherPenalty - forcedPenalty - redZoneCompletionPenalty, 0, 1);
    if (!rng.chance(completionChance)) {
      return Object.assign(resultBase(rng), { yards: 0, type: 'incomplete', outOfBounds: true, players: { passer: qb.id, receiver: receiver.id, tackler: defender.id }, desc: `Incomplete to ${receiver.lastName}` });
    }
    let yMean = P.routeYardsMean[kind], ySd = P.routeYardsSd[kind];
    if (REAL) { const m = (qb.prof ? qb.prof.ypcMult : 1) * (selected.prof ? selected.prof.yprMult : 1) * (defense.unit ? defense.unit.passYdsMult : 1); yMean *= m; ySd *= m; }
    let yards = Math.min(Math.round(clamp(rng.gauss(yMean, ySd), P.routeMinimumYards, P.routeMaximumYards)), T.football.fieldLength - context.yardLine);
    const weatherTouchdownAdjustment = W.indoor ? P.indoorLongTouchdownBonus : -W.windMph * P.longTouchdownWindPenaltyPerMph;
    if (context.yardLine < T.scoring.redZoneLine && rng.chance(P.longTouchdownChancePerCompletion + weatherTouchdownAdjustment)) yards = T.football.fieldLength - context.yardLine;
    const base = Object.assign(resultBase(rng), { yards, type: 'pass', isTouchdown: context.yardLine + yards >= T.football.fieldLength, isFirstDown: yards >= context.toGo });
    base.outOfBounds = rng.chance(P.outOfBoundsChance);
    base.players = { passer: qb.id, receiver: receiver.id, tackler: defender.id };
    base.desc = `${qb.lastName} complete to ${receiver.lastName} for ${yards} yards`;
    return fumbleResult(base, receiver, defender, rng, defense);
  }
  function resolvePlay(offense, defense, intent, context, isHomeOffense, rng) {
    const penalty = penaltyResult(context, rng, isHomeOffense);
    if (penalty !== null) return penalty;
    if (intent.playType === 'insideRun' || intent.playType === 'outsideRun' || intent.playType === 'draw') return resolveRun(offense, defense, context, rng);
    return resolvePass(offense, defense, intent, context, isHomeOffense, rng);
  }

  /* ---------- stats.ts ---------- */
  function createTeamGameStats(teamId) {
    return { teamId, points: 0, totalPlays: 0, totalYards: 0, netPassingYards: 0, grossPassingYards: 0, passAttempts: 0, completions: 0, passingTouchdowns: 0, interceptions: 0, rushAttempts: 0, rushingYards: 0, rushingTouchdowns: 0, defensiveTouchdowns: 0, sacksAllowed: 0, sackYardsLost: 0, firstDowns: 0, passingFirstDowns: 0, rushingFirstDowns: 0, penaltyFirstDowns: 0, thirdDownAttempts: 0, thirdDownConversions: 0, fourthDownAttempts: 0, fourthDownConversions: 0, redZoneTrips: 0, redZoneTouchdowns: 0, penalties: 0, penaltyYards: 0, turnovers: 0, fumblesLost: 0, punts: 0, puntYards: 0, fieldGoalsAttempted: 0, fieldGoalsMade: 0, possessionSeconds: 0 };
  }
  function playerLine(book, id) {
    let line = book.players.get(id);
    if (line === undefined) {
      line = { playerId: id, passAttempts: 0, completions: 0, passingYards: 0, passingTouchdowns: 0, interceptions: 0, rushAttempts: 0, rushingYards: 0, rushingTouchdowns: 0, targets: 0, receptions: 0, receivingYards: 0, receivingTouchdowns: 0, tackles: 0, sacks: 0, fumblesLost: 0 };
      book.players.set(id, line);
    }
    return line;
  }
  function addFirstDown(stats, result) {
    if (!result.isFirstDown) return;
    stats.firstDowns += 1;
    if (result.type === 'penalty') stats.penaltyFirstDowns += 1;
    else if (result.type === 'pass') stats.passingFirstDowns += 1;
    else stats.rushingFirstDowns += 1;
  }
  function recordScrimmagePlay(book, offense, defense, before, result) {
    if (result.type === 'penalty') {
      const pen = result.penalty;
      if (pen !== undefined) { const t = pen.onOffense ? offense : defense; t.penalties += 1; t.penaltyYards += Math.abs(pen.yards); addFirstDown(offense, result); }
      return;
    }
    offense.totalPlays += 1;
    if (before.down === C().lateQuarter) offense.thirdDownAttempts += 1;
    if (before.down === T.football.downs) offense.fourthDownAttempts += 1;
    if (result.isFirstDown && before.down === C().lateQuarter) offense.thirdDownConversions += 1;
    if (result.isFirstDown && before.down === T.football.downs) offense.fourthDownConversions += 1;
    addFirstDown(offense, result);
    const pl = result.players;
    const passer = pl.passer === undefined ? undefined : playerLine(book, pl.passer);
    const rusher = pl.rusher === undefined ? undefined : playerLine(book, pl.rusher);
    const receiver = pl.receiver === undefined ? undefined : playerLine(book, pl.receiver);
    const sacker = pl.sacker === undefined ? undefined : playerLine(book, pl.sacker);
    const tackler = pl.tackler === undefined ? undefined : playerLine(book, pl.tackler);
    if (tackler !== undefined) tackler.tackles += 1;
    if (result.type === 'pass' || result.type === 'incomplete' || result.type === 'int') {
      offense.passAttempts += 1;
      if (passer) passer.passAttempts += 1;
      if (receiver) receiver.targets += 1;
      if (result.type === 'pass') {
        offense.completions += 1; offense.grossPassingYards += result.yards; offense.netPassingYards += result.yards;
        if (passer) { passer.completions += 1; passer.passingYards += result.yards; }
        if (receiver) { receiver.receptions += 1; receiver.receivingYards += result.yards; }
      }
      if (result.type === 'int') { offense.interceptions += 1; offense.turnovers += 1; if (passer) passer.interceptions += 1; }
    } else if (result.type === 'sack') {
      offense.sacksAllowed += 1; offense.sackYardsLost += Math.abs(result.yards); offense.netPassingYards += result.yards;
      if (sacker) sacker.sacks += 1;
    } else if (result.type === 'fumble' && passer !== undefined && receiver !== undefined) {
      offense.passAttempts += 1; offense.completions += 1; offense.grossPassingYards += result.yards; offense.netPassingYards += result.yards;
      passer.passAttempts += 1; passer.completions += 1; passer.passingYards += result.yards;
      receiver.targets += 1; receiver.receptions += 1; receiver.receivingYards += result.yards;
      if (result.isTurnover) { offense.fumblesLost += 1; offense.turnovers += 1; receiver.fumblesLost += 1; }
    } else if (result.type === 'run' || result.type === 'scramble' || result.type === 'fumble' || result.type === 'kneel') {
      offense.rushAttempts += 1; offense.rushingYards += result.yards;
      if (rusher) { rusher.rushAttempts += 1; rusher.rushingYards += result.yards; }
      if (result.type === 'fumble' && result.isTurnover) { offense.fumblesLost += 1; offense.turnovers += 1; if (rusher) rusher.fumblesLost += 1; if (receiver) receiver.fumblesLost += 1; }
    }
    if (result.isTouchdown) {
      if (result.type === 'pass' || (result.type === 'fumble' && passer !== undefined)) {
        offense.passingTouchdowns += 1; if (passer) passer.passingTouchdowns += 1; if (receiver) receiver.receivingTouchdowns += 1;
      } else { offense.rushingTouchdowns += 1; if (rusher) rusher.rushingTouchdowns += 1; }
    }
    offense.totalYards = offense.netPassingYards + offense.rushingYards;
  }

  /* ---------- gameEngine.ts ---------- */
  const sideTeam = (rt, s) => (s === 'home' ? rt.home : rt.away);
  const sideChart = (rt, s) => (s === 'home' ? rt.homeChart : rt.awayChart);
  const sideStats = (rt, s) => (s === 'home' ? rt.stats.home : rt.stats.away);
  function scoreDifference(rt, s) { return s === 'home' ? rt.context.homeScore - rt.context.awayScore : rt.context.awayScore - rt.context.homeScore; }
  function setScore(rt, s, pts) { if (s === 'home') rt.context.homeScore += pts; else rt.context.awayScore += pts; sideStats(rt, s).points += pts; }

  // Drive log (game mode only; it reads state and never draws from the RNG).
  function startDrive(rt, side) {
    if (!rt.log) return;
    rt.drive = { side, start: rt.context.yardLine, quarter: rt.context.quarter, clock0: rt.context.clock, plays: 0, yards: 0, secs: 0, result: null, detail: '', play: null };
  }
  // Ends drive d (the one that was on the field when the play began). A drive that ran no plays and
  // ended only because time ran out is dropped.
  function endDrive(rt, d, result, detail, play) {
    if (!rt.log || !d || d.result) return;
    if ((result === 'END' || result === 'HALF') && d.plays === 0) { d.result = 'NONE'; return; }
    d.result = result; d.detail = detail || ''; d.play = play || d.play;
    d.endQuarter = Math.min(rt.context.quarter, d.quarter === rt.context.quarter ? d.quarter : rt.context.quarter);
    d.score = [rt.context.homeScore, rt.context.awayScore];
    rt.log.push(d);
  }
  // After a play: a drive still open but no longer on the field lost its possession to halftime.
  function closeOrphan(rt, d) { if (d && !d.result && rt.drive !== d) endDrive(rt, d, 'HALF'); }

  function resetSeries(rt, side, yardLine) {
    rt.context.possession = side; rt.context.yardLine = yardLine; rt.context.down = 1;
    rt.context.toGo = Math.min(T.football.firstDownYards, T.football.fieldLength - yardLine);
    rt.driveReachedRedZone = yardLine >= T.scoring.redZoneLine;
    if (rt.driveReachedRedZone) sideStats(rt, side).redZoneTrips += 1;
    startDrive(rt, side);
  }
  function overtimePossessionEnded(rt, side) {
    if (!rt.overtime || rt.customOT) return;
    rt.overtimePossessions.add(side);
    if (rt.overtimePossessions.size >= T.football.overtimePossessionsRequired && rt.context.homeScore !== rt.context.awayScore) rt.finished = true;
  }
  function changePossession(rt, yardLine) {
    const prior = rt.context.possession;
    overtimePossessionEnded(rt, prior);
    if (rt.finished) return;
    resetSeries(rt, otherSide(prior), clamp(yardLine, 0, T.football.fieldLength));
  }
  function kickoff(rt, receivingSide) { resetSeries(rt, receivingSide, T.football.kickoffSpot); }
  function transitionPeriod(rt) {
    if (rt.context.quarter >= T.football.downs) return;
    rt.context.quarter += 1;
    rt.context.clock = T.football.quarterSeconds;
    rt.context.isTwoMinute = false;
    if (rt.context.quarter === C().lateQuarter) {
      rt.context.timeoutsHome = T.football.startingTimeouts;
      rt.context.timeoutsAway = T.football.startingTimeouts;
      rt.halfEndQuarter = 2;
      kickoff(rt, otherSide(rt.firstHalfReceiver));
    }
  }
  function consumeClock(rt, requested, offense) {
    const used = Math.min(rt.context.clock, Math.max(0, Math.round(requested)));
    rt.context.clock -= used;
    sideStats(rt, offense).possessionSeconds += used;
    if (rt.drive && !rt.drive.result) rt.drive.secs += used;
    const warningQuarter = rt.context.quarter === T.football.firstHalfFinalQuarter || rt.context.quarter === T.football.downs;
    rt.context.isTwoMinute = warningQuarter && rt.context.clock <= T.football.twoMinuteSeconds;
    if (rt.context.clock === 0 && !rt.overtime) transitionPeriod(rt);
  }
  function runoffFor(rt, result, intent, offense) {
    if (result.type === 'penalty' || result.type === 'incomplete' || result.outOfBounds) return 0;
    const c = C();
    let runoff = intent.drainClock ? T.clock.drainClockRunoff : intent.tempo >= c.turboTempo ? T.clock.hurryUpRunoff : intent.tempo > c.riskScale * c.neutral ? T.clock.mediumRunoff : T.clock.normalRunoff;
    if (rt.overtime && rt.context.homeScore === rt.context.awayScore) runoff = T.clock.hurryUpRunoff;
    const defense = otherSide(offense);
    if (rt.context.isTwoMinute && scoreDifference(rt, defense) < 0) {
      const key = defense === 'home' ? 'timeoutsHome' : 'timeoutsAway';
      if (rt.context[key] > 0) { rt.context[key] -= 1; runoff = Math.max(0, runoff - T.clock.timeoutRunoffSaved); }
    }
    return Math.max(0, runoff * (1 + rt.context.tempoEnvironment));
  }
  function updateRedZone(rt, side, beforeYardLine) {
    if (!rt.driveReachedRedZone && beforeYardLine < T.scoring.redZoneLine && rt.context.yardLine >= T.scoring.redZoneLine && rt.context.yardLine < T.football.fieldLength) {
      rt.driveReachedRedZone = true;
      sideStats(rt, side).redZoneTrips += 1;
    }
  }
  function shouldTryTwo(rt, side) {
    const difference = Math.abs(scoreDifference(rt, side));
    return rt.rng.chance(T.kicking.twoPointTryBase)
      || (rt.context.quarter === T.football.downs && T.kicking.twoPointNeedScores.some(n => n === difference) && rt.rng.chance(T.kicking.twoPointTryLate));
  }
  function touchdown(rt, side, play, d) {
    setScore(rt, side, T.football.touchdownPoints);
    if (rt.driveReachedRedZone) sideStats(rt, side).redZoneTouchdowns += 1;
    let after = '';
    if (shouldTryTwo(rt, side)) {
      if (rt.rng.chance(T.kicking.twoPointRate)) { setScore(rt, side, T.football.twoPointPoints); after = '2PT'; } else after = '2PT_FAIL';
    } else if (rt.rng.chance(T.kicking.extraPointRate)) { setScore(rt, side, T.football.extraPointPoints); } else after = 'XP_MISS';
    endDrive(rt, d, 'TD', after, play);
    overtimePossessionEnded(rt, side);
    if (!rt.finished) kickoff(rt, otherSide(side));
  }
  function returnTouchdown(rt, scoringSide, play, d) {
    const scoredOn = otherSide(scoringSide);
    setScore(rt, scoringSide, T.football.touchdownPoints);
    sideStats(rt, scoringSide).defensiveTouchdowns += 1;
    if (rt.rng.chance(T.kicking.extraPointRate)) setScore(rt, scoringSide, T.football.extraPointPoints);
    endDrive(rt, d, play.type === 'int' ? 'INT_TD' : 'FUM_TD', '', play);
    if (rt.overtime && !rt.customOT && rt.context.homeScore !== rt.context.awayScore) { rt.finished = true; return; }
    overtimePossessionEnded(rt, scoredOn);
    if (!rt.finished) kickoff(rt, scoredOn);
  }
  function safety(rt, offense, play, d) {
    const defense = otherSide(offense);
    setScore(rt, defense, T.football.safetyPoints);
    endDrive(rt, d, 'SAFETY', '', play);
    overtimePossessionEnded(rt, offense);
    if (!rt.finished) kickoff(rt, defense);
  }
  function applyScrimmage(rt, result, intent) {
    const side = rt.context.possession, defense = otherSide(side), d = rt.drive;
    const before = Object.assign({}, rt.context, { weather: Object.assign({}, rt.context.weather) });
    applyScrimmageInner(rt, result, intent, side, defense, d, before);
    closeOrphan(rt, d);
  }
  function applyScrimmageInner(rt, result, intent, side, defense, d, before) {
    recordScrimmagePlay(rt.stats, sideStats(rt, side), sideStats(rt, defense), before, result);
    rt.snaps += 1;
    if (d && !d.result && result.type !== 'penalty') { d.plays += 1; d.yards += result.yards; }
    if (rt.log) rt.lastPlay = result;
    const runoff = runoffFor(rt, result, intent, side);
    consumeClock(rt, result.clockUsed + runoff, side);
    if (result.type === 'penalty') {
      rt.context.yardLine = clamp(rt.context.yardLine + result.yards, 0, T.football.fieldLength);
      rt.context.toGo = Math.max(1, rt.context.toGo - result.yards);
      if (result.isFirstDown) { rt.context.down = 1; rt.context.toGo = Math.min(T.football.firstDownYards, T.football.fieldLength - rt.context.yardLine); }
      updateRedZone(rt, side, before.yardLine);
      return;
    }
    rt.context.yardLine = clamp(rt.context.yardLine + result.yards, 0, T.football.fieldLength);
    rt.context.toGo -= result.yards;
    updateRedZone(rt, side, before.yardLine);
    if ((before.yardLine <= T.football.firstDownYards && result.yards < 0 && rt.rng.chance(T.scoring.safetyPerOffensivePlay)) || before.yardLine + result.yards <= 0) { safety(rt, side, result, d); return; }
    if (result.isTouchdown || rt.context.yardLine >= T.football.fieldLength) { touchdown(rt, side, result, d); return; }
    if (result.isTurnover) {
      let returnChance = result.type === 'int' ? T.scoring.interceptionReturnTouchdown : T.scoring.fumbleReturnTouchdown;
      if (rt.real) { const u = sideChart(rt, defense).unit; if (u) returnChance *= u.retMult; }
      if (rt.rng.chance(returnChance)) { returnTouchdown(rt, defense, result, d); return; }
      endDrive(rt, d, result.type === 'int' ? 'INT' : 'FUMBLE', '', result);
      changePossession(rt, T.football.fieldLength - rt.context.yardLine);
      return;
    }
    if (result.isFirstDown || rt.context.toGo <= 0) { rt.context.down = 1; rt.context.toGo = Math.min(T.football.firstDownYards, T.football.fieldLength - rt.context.yardLine); return; }
    rt.context.down += 1;
    if (rt.context.down > T.football.downs) { endDrive(rt, d, 'DOWNS'); changePossession(rt, T.football.fieldLength - rt.context.yardLine); }
  }
  function fieldGoalRate(distance, kicker, weather) {
    const K = T.kicking;
    const bucketIndex = K.distanceBuckets.findIndex(limit => distance < limit);
    const rateIndex = bucketIndex < 0 ? K.distanceRates.length - 1 : bucketIndex;
    const rating = (kicker.ratings.kickAccuracy - T.roster.starterMean) / K.ratingEffectDivisor;
    const weatherPenalty = weather.indoor ? 0 : weather.windMph * K.windPenaltyPerMph;
    return clamp(K.distanceRates[rateIndex] + rating - weatherPenalty, K.minAttemptRate, K.maxAttemptRate);
  }
  const maxFieldGoalDistance = kicker => T.kicking.baseMaxDistance + Math.round((kicker.ratings.kickPower - T.kicking.powerBaseline) / T.kicking.powerDistanceDivisor);
  function attemptFieldGoal(rt, side) {
    const kicker = sideChart(rt, side).get('K'), d = rt.drive;
    const distance = T.football.fieldLength - rt.context.yardLine + T.football.endZoneAndHoldYards;
    const made = rt.rng.chance(fieldGoalRate(distance, kicker, rt.context.weather));
    const st = sideStats(rt, side);
    st.fieldGoalsAttempted += 1; if (made) st.fieldGoalsMade += 1;
    consumeClock(rt, T.clock.fieldGoalSeconds, side);
    if (made) {
      setScore(rt, side, T.football.fieldGoalPoints);
      endDrive(rt, d, 'FG', String(distance));
      overtimePossessionEnded(rt, side);
      if (!rt.finished) kickoff(rt, otherSide(side));
    } else {
      endDrive(rt, d, 'MISSED_FG', String(distance));
      changePossession(rt, T.football.fieldLength - rt.context.yardLine);
    }
    closeOrphan(rt, d);
  }
  function punt(rt, side) {
    const K = T.kicking;
    const punter = sideChart(rt, side).get('P'), d = rt.drive;
    const ratingBonus = (punter.ratings.kickPower - T.roster.starterMean) / T.football.overtimePossessionsRequired;
    const gross = Math.round(clamp(rt.rng.gauss(K.puntMean + ratingBonus, K.puntSd), K.puntMin, K.puntMax));
    const st = sideStats(rt, side); st.punts += 1; st.puntYards += gross;
    consumeClock(rt, T.clock.puntSeconds, side);
    endDrive(rt, d, 'PUNT');
    const landing = rt.context.yardLine + gross;
    if (landing >= K.touchbackThreshold) { changePossession(rt, T.football.puntTouchbackSpot); return; }
    const returnYards = rt.rng.chance(K.fairCatchChance) ? 0 : Math.round(clamp(rt.rng.gauss(K.puntReturnMean, K.puntReturnSd), K.puntReturnMin, K.puntReturnMax));
    changePossession(rt, clamp(T.football.fieldLength - landing + returnYards, 0, T.football.fieldLength));
  }
  function goForIt(rt, side) {
    const K = T.kicking, team = sideTeam(rt, side);
    const short = rt.context.toGo <= K.goForItShort, field = rt.context.yardLine >= K.goForItFieldMin;
    const deficit = -scoreDifference(rt, side);
    const lateNeed = (rt.context.quarter === T.football.downs && rt.context.clock <= T.clock.lateGameSeconds && deficit > T.football.fieldGoalPoints)
      || (rt.customOT && rt.overtime && deficit > T.football.fieldGoalPoints);
    return lateNeed || (short && field && rt.rng.chance(K.goForItBase + team.scheme.aggressiveness * K.goForItAggression));
  }
  function handleFourthDown(rt) {
    const K = T.kicking, side = rt.context.possession, team = sideTeam(rt, side), chart = sideChart(rt, side), kicker = chart.get('K');
    const distance = T.football.fieldLength - rt.context.yardLine + T.football.endZoneAndHoldYards;
    const q4late = rt.context.quarter === T.football.downs && rt.context.clock <= T.clock.lateGameSeconds;
    const tyingFieldGoal = q4late && scoreDifference(rt, side) === -T.football.fieldGoalPoints && distance <= maxFieldGoalDistance(kicker);
    const deficit = -scoreDifference(rt, side);
    const strategicFieldGoal = rt.context.quarter === T.football.downs && rt.context.clock >= K.strategicFieldGoalMinClock && rt.context.clock <= K.strategicFieldGoalMaxClock
      && deficit > T.football.fieldGoalPoints && deficit <= K.strategicFieldGoalMaxDeficit && rt.context.toGo > K.strategicFieldGoalMinToGo && distance <= maxFieldGoalDistance(kicker);
    if (!tyingFieldGoal && !strategicFieldGoal && goForIt(rt, side)) {
      const intent = selectPlay(team.scheme, rt.context, side === 'home', rt.rng);
      const result = resolvePlay(chart, sideChart(rt, otherSide(side)), intent, rt.context, side === 'home', rt.rng);
      applyScrimmage(rt, result, intent);
    } else if (distance <= maxFieldGoalDistance(kicker)) attemptFieldGoal(rt, side);
    else punt(rt, side);
  }
  function shouldAttemptLateFieldGoal(rt, side) {
    const K = T.kicking, difference = scoreDifference(rt, side);
    if (rt.overtime) {
      if (rt.customOT) return false;
      if (rt.overtimePossessions.size < T.football.overtimePossessionsRequired || difference !== 0 || rt.context.clock > K.overtimeLateKickClock) return false;
    } else {
      if (rt.context.quarter !== T.football.downs) return false;
      const kickClock = difference === 0 ? K.tiedLateKickClock : difference === -T.football.fieldGoalPoints ? K.lateKickClock : K.shortDeficitLateKickClock;
      if (rt.context.clock > kickClock) return false;
    }
    if (difference > 0 || difference < -T.football.fieldGoalPoints) return false;
    const distance = T.football.fieldLength - rt.context.yardLine + T.football.endZoneAndHoldYards;
    return distance <= maxFieldGoalDistance(sideChart(rt, side).get('K'));
  }
  function attemptLateFieldGoal(rt, side) {
    const drain = Math.max(0, rt.context.clock - T.kicking.lateKickRemainingClock);
    if (drain > 0) consumeClock(rt, drain, side);
    attemptFieldGoal(rt, side);
  }
  function kneelResult(rt) {
    const qb = sideChart(rt, rt.context.possession).get('QB');
    return { yards: -1, clockUsed: T.clock.snapToWhistleMin, type: 'kneel', isTurnover: false, isTouchdown: false, isFirstDown: false, outOfBounds: false, players: { rusher: qb.id }, desc: `${qb.lastName} kneels` };
  }
  function canKneel(rt, side) {
    const opp = side === 'home' ? rt.context.timeoutsAway : rt.context.timeoutsHome;
    return rt.context.quarter === T.football.downs && scoreDifference(rt, side) > 0 && rt.context.clock <= T.clock.kneelWindow && opp === 0;
  }
  function step(rt) {
    const side = rt.context.possession;
    if (shouldAttemptLateFieldGoal(rt, side)) attemptLateFieldGoal(rt, side);
    else if (canKneel(rt, side)) {
      const intent = { playType: 'insideRun', riskTolerance: 0, tempo: 0, forceBall: false, drainClock: true, greenLightScramble: false, maxReads: 1 };
      applyScrimmage(rt, kneelResult(rt), intent);
    } else if (rt.context.down === T.football.downs) handleFourthDown(rt);
    else {
      const team = sideTeam(rt, side);
      const intent = selectPlay(team.scheme, rt.context, side === 'home', rt.rng);
      const result = resolvePlay(sideChart(rt, side), sideChart(rt, otherSide(side)), intent, rt.context, side === 'home', rt.rng);
      applyScrimmage(rt, result, intent);
    }
  }
  function runCurrentPeriod(rt) {
    while (rt.context.clock > 0 && !rt.finished && rt.snaps < T.season.maximumGameSnaps) step(rt);
  }

  const NEUTRAL_WEATHER = { tempF: 65, windMph: 0, precip: 'none', indoor: false };
  /**
   * opts.real: this game's rules (real-stat modifiers, neutral field, no weather, no pace roll,
   * drive log, custom overtime). Without it, identical to the original simulateGame.
   */
  function createGame(home, away, players, weather, rng, opts) {
    const o = opts || {};
    REAL = !!o.real;
    const firstHalfReceiver = rng.chance(C().neutral) ? 'home' : 'away';
    const context = {
      homeScore: 0, awayScore: 0, quarter: 1, clock: T.football.quarterSeconds, down: 1, toGo: T.football.firstDownYards,
      yardLine: T.football.kickoffSpot, possession: firstHalfReceiver, weather: o.real ? NEUTRAL_WEATHER : weather,
      tempoEnvironment: o.real ? (o.tempo || 0) : rng.fork('scoring-environment').gauss(0, T.scoring.gameScriptTempoSd),
      crowdFactor: o.real ? 0 : T.homeField.crowdFactor, neutral: !!o.real,
      isTwoMinute: false, timeoutsHome: T.football.startingTimeouts, timeoutsAway: T.football.startingTimeouts
    };
    const byId = new Map(players.map(p => [p.id, p]));
    const rt = {
      context, home, away, real: !!o.real,
      homeChart: buildDepthChart(home, players), awayChart: buildDepthChart(away, players),
      stats: { home: createTeamGameStats(home.id), away: createTeamGameStats(away.id), players: new Map() },
      byId, rng, firstHalfReceiver, driveReachedRedZone: false, overtimePossessions: new Set(), overtime: false, customOT: !!o.real,
      finished: false, snaps: 0, log: o.log ? [] : null, drive: null, lastPlay: null
    };
    if (rt.log) startDrive(rt, firstHalfReceiver);
    return rt;
  }
  // Plays out the current quarter and stops at its end. Returns true while regulation continues.
  function playQuarter(rt) {
    REAL = rt.real;
    const q = rt.context.quarter;
    while (rt.context.quarter === q && rt.context.clock > 0 && !rt.finished && rt.snaps < T.season.maximumGameSnaps) step(rt);
    if (q === T.football.downs || rt.context.clock === 0) {
      if (q === T.football.downs) endDrive(rt, rt.drive, 'END');
      return false;
    }
    return true;
  }
  // This game's overtime: each side gets one possession from its own 30. Returns the two drives.
  function playOvertimePeriod(rt, first) {
    REAL = rt.real;
    rt.overtime = true;
    rt.context.quarter = T.football.downs + 1;
    rt.context.clock = T.football.quarterSeconds;
    rt.context.isTwoMinute = false;
    rt.context.timeoutsHome = T.football.startingTimeouts; rt.context.timeoutsAway = T.football.startingTimeouts;
    const out = [];
    for (const side of [first, otherSide(first)]) {
      rt.drive = null;
      kickoff(rt, side);
      const d = rt.drive, before = rt.log ? rt.log.length : 0;
      let guard = 0;
      while (rt.log && d && !d.result && guard++ < 200 && rt.context.clock > 0) step(rt);
      endDrive(rt, d, 'END');
      out.push(d);
    }
    return out;
  }
  // The original's whole-game loop, for equivalence testing and for pre-game odds.
  function simulateGame(home, away, players, weather, rng, opts) {
    const rt = createGame(home, away, players, weather, rng, opts);
    while (rt.context.quarter <= T.football.downs && rt.context.clock > 0 && !rt.finished) runCurrentPeriod(rt);
    if (rt.context.homeScore === rt.context.awayScore && !rt.customOT) {
      rt.overtime = true;
      rt.context.quarter = T.football.downs + 1;
      rt.context.clock = T.football.overtimeSeconds;
      rt.context.isTwoMinute = false;
      rt.context.timeoutsHome = T.football.startingTimeouts; rt.context.timeoutsAway = T.football.startingTimeouts;
      kickoff(rt, rng.chance(C().neutral) ? 'home' : 'away');
      runCurrentPeriod(rt);
    }
    return rt;
  }
  return { T, mulberry32, createGame, playQuarter, playOvertimePeriod, simulateGame, playerLine };
})();
if (typeof module !== 'undefined') module.exports = ENGINE;
