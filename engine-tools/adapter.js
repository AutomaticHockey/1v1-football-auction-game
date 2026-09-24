/* =====================================================================
   SIMKIT: turns our five real players per side into an engine roster.
   Everyone we don't have (line, kicker, WR3, TE2, backup backs, the rest of
   the defense) is a league-average filler rated 80, the engine's starter mean.
   Our players steer the engine through modifiers built from their real stats;
   a league-average player gets no modifier at all. K holds the calibrated gains (fit 2026-09-18 against all 174 players; see the calibration table).
   ===================================================================== */
const SIMKIT = (() => {
  const K = {
    qbComp: 0.8,      // share of a QB's completion-% edge he carries on his own
    qbEff: 0.5,       // split of a QB's yards edge between yards per completion (this) and volume (1 - this)
    qbVolume: 1.0,    // gain on the pass-rate shift from the volume part
    rbYpc: 1.2,       // share of a back's yards-per-carry edge
    recCatch: 0.6,    // share of a receiver's catch-rate edge
    recYpr: 1.15,      // exponent on a receiver's yards-per-catch ratio
    rz: 2,          // exponent on red-zone (touchdown) bias
    defSack: 1.0,     // gain on pass rush from sacks per game
    defPassYds: 1.0,  // exponent on yards allowed for pass yards
    defRun: 1.0,      // gain on rush yards per carry from yards allowed
    defComp: 0.08,    // completion-% gain from points allowed
    defTake: 1.0,     // exponent on takeaway rates
    passBase: 0.63,   // neutral pass rate; the engine's own 0.5732 throws ~29 times, real teams ~34
    engYpc: 11.5,     // the engine's average yards per completion (measured); receivers' real yards per catch scale against it
    qbTd: 2,        // gain on a QB's red-zone completion edge from his TD rate
    qbYds: 1,       // global scale on QB yards per completion
    compBase: -0.008,    // completion offset for every pass (filler receivers catch a little too often otherwise)
    sackBase: 81,     // average defense's pass rush rating (the engine's starter mean is 80)
    tempo: -0.04,       // fixed shared pace shift (the engine's own game-script lever), same for both teams
    rzPen: 0,       // scale on the engine's red-zone penalties (an all-average roster converts less than a real mixed one)
    qbRun: 4.2,       // QB yards per designed carry (lower = more designed runs)
    rzRun: 0.12,      // how much more teams run inside the 20
    teamTargets: 34,  // a real team's targets per game; our receivers keep their real volume, filler splits the rest
    teamCarries: 25,  // a real team's carries per game (backs + QB designed runs)
    rbTgt: 1.0,       // multiplier on backs' target weight
    rbCatch: 0.08,     // completion bonus on passes to backs (short, safe throws)
    retTd: 0.6        // scale on return-touchdown chance
  };
  let lg = null;
  const num = (v, fb) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
  const sv = (p, k, fb) => num(p && p.stats ? p.stats[k] : undefined, fb);
  const tot = (p, k) => (p && p.stats && p.stats.totals ? num(p.stats.totals[k], NaN) : NaN);
  const clampv = (v, a, b) => Math.max(a, Math.min(b, v));
  const mean = (arr, f) => { const v = arr.map(f).filter(Number.isFinite); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN; };
  const gp = p => Math.max(1, num(p.games, 17));

  // Per-player derived rates, with fallbacks when a field is missing.
  const qbRushTdG = p => { const t = tot(p, 'rush_td'); return Number.isFinite(t) ? t / gp(p) : 0.15; };
  const rbCarries = p => { const t = tot(p, 'carries'); return Number.isFinite(t) && t > 0 ? t / gp(p) : sv(p, 'rush_yds_g', 50) / Math.max(2.5, sv(p, 'ypc', 4.3)); };
  const rbRushTdPerCar = p => { const t = tot(p, 'rush_td'), c = tot(p, 'carries'); return Number.isFinite(t) && c > 0 ? t / c : sv(p, 'td_g', 0.4) * 0.8 / Math.max(1, rbCarries(p)); };
  const rbRecYpr = p => { const y = tot(p, 'rec_yds'), r = tot(p, 'rec'); return Number.isFinite(y) && r > 0 ? y / r : Math.max(1, sv(p, 'scrim_yds_g', 60) - sv(p, 'rush_yds_g', 50)) / Math.max(0.5, sv(p, 'rec_g', 2)); };
  const rbRecTdPerRec = p => { const t = tot(p, 'rec_td'), r = tot(p, 'rec'); return Number.isFinite(t) && r > 0 ? t / r : 0.03; };
  const catchRate = p => sv(p, 'rec_g', 4) / Math.max(0.5, sv(p, 'tgt_g', 6.5));
  const tdPerTgt = p => sv(p, 'rec_td_g', 0.3) / Math.max(0.5, sv(p, 'tgt_g', 6.5));
  const defRate = (p, key, fb) => { const t = tot(p, key); return Number.isFinite(t) ? t / gp(p) : fb; };

  function init(byPos) {
    const Q = byPos.QB || [], R = byPos.RB || [], W = byPos.WR || [], TE = byPos.TE && byPos.TE.length ? byPos.TE : W, D = byPos.DEF || [];
    lg = {
      qbYds: mean(Q, p => sv(p, 'pass_yds_g', NaN)) || 220, qbTd: mean(Q, p => sv(p, 'pass_td_g', NaN)) || 1.5, qbCmp: mean(Q, p => sv(p, 'cmp_pct', NaN)) || 65, qbInt: mean(Q, p => sv(p, 'int_g', NaN)) || 0.65,
      rbYpc: mean(R, p => sv(p, 'ypc', NaN)) || 4.3, rbCar: mean(R, rbCarries) || 12.5, rbTdCar: mean(R, rbRushTdPerCar) || 0.033,
      rbRec: mean(R, p => sv(p, 'rec_g', NaN)) || 2.3, rbYpr: mean(R, rbRecYpr) || 7.4, rbTdRec: mean(R, rbRecTdPerRec) || 0.035,
      wrTgt: mean(W, p => sv(p, 'tgt_g', NaN)) || 6.6, wrCatch: mean(W, catchRate) || 0.636, wrYpr: mean(W, p => sv(p, 'ypr', NaN)) || 13.3, wrTdTgt: mean(W, tdPerTgt) || 0.053,
      teTgt: mean(TE, p => sv(p, 'tgt_g', NaN)) || 5, teCatch: mean(TE, catchRate) || 0.7, teYpr: mean(TE, p => sv(p, 'ypr', NaN)) || 10.5, teTdTgt: mean(TE, tdPerTgt) || 0.05,
      dPts: mean(D, p => sv(p, 'pts_allowed_g', NaN)) || 23, dYds: mean(D, p => sv(p, 'yds_allowed_g', NaN)) || 340, dSacks: mean(D, p => sv(p, 'sacks_g', NaN)) || 2.35,
      dInt: mean(D, p => defRate(p, 'int', NaN)) || 0.7, dFum: mean(D, p => defRate(p, 'fum_rec', NaN)) || 0.45, dTd: mean(D, p => sv(p, 'def_td', NaN)) || 0.9
    };
    return lg;
  }
  const RB_CATCH = 0.78;

  /* ---------- profiles (what the engine reads) ---------- */
  function qbProf(p) {
    const cmp = sv(p, 'cmp_pct', lg.qbCmp), ydsRel = sv(p, 'pass_yds_g', lg.qbYds) / lg.qbYds, cmpRel = cmp / lg.qbCmp;
    const effRel = clampv(ydsRel / cmpRel, 0.5, 1.8);
    const volRel = Math.pow(effRel, 1 - K.qbEff);
    const rush = sv(p, 'rush_yds_g', 10), mobile = rush >= 15;
    return {
      compOff: K.compBase + K.qbComp * (cmp - lg.qbCmp) / 100,
      ypcMult: K.qbYds * Math.pow(effRel, K.qbEff),
      volRel,
      intMult: clampv((sv(p, 'int_g', lg.qbInt) / lg.qbInt) / volRel, 0.3, 3),
      rzComp: clampv(K.qbTd * 0.12 * ((sv(p, 'pass_td_g', lg.qbTd) / sv(p, 'pass_yds_g', lg.qbYds)) / (lg.qbTd / lg.qbYds) - 1), -0.2, 0.2),
      designedCarries: Math.max(0, (rush - (mobile ? 7 : 0)) / K.qbRun),
      mobile,
      rzRush: clampv(Math.pow((qbRushTdG(p) + 0.02) / (lg.rbTdCar * Math.max(0.5, rush / 5.2) + 0.02), K.rz), 0.3, 3),
      targets: 0, catchOff: 0, yprMult: 1, rzBias: 1, carries: 0, ypcOff: 0
    };
  }
  function rbProf(p) {
    return {
      carries: rbCarries(p), ypcOff: K.rbYpc * (sv(p, 'ypc', lg.rbYpc) - lg.rbYpc),
      rzRush: clampv(Math.pow(rbRushTdPerCar(p) / lg.rbTdCar, K.rz), 0.3, 3),
      targets: K.rbTgt * sv(p, 'rec_g', lg.rbRec) / RB_CATCH, catchOff: K.rbCatch, yprMult: clampv(Math.pow(rbRecYpr(p) / K.engYpc, K.recYpr), 0.35, 2),
      rzBias: clampv(Math.pow((rbRecTdPerRec(p) + 0.01) / (lg.rbTdRec + 0.01), K.rz), 0.3, 3)
    };
  }
  function recProf(p) {
    const te = p.pos === 'TE', lc = te ? lg.teCatch : lg.wrCatch, ly = te ? lg.teYpr : lg.wrYpr, lt = te ? lg.teTdTgt : lg.wrTdTgt;
    return {
      targets: sv(p, 'tgt_g', te ? lg.teTgt : lg.wrTgt), catchOff: K.recCatch * (catchRate(p) - lc),
      yprMult: clampv(Math.pow(sv(p, 'ypr', ly) / K.engYpc, K.recYpr), 0.5, 2),
      rzBias: clampv(Math.pow((tdPerTgt(p) + 0.005) / (lt + 0.005), K.rz), 0.3, 3),
      carries: 0.3, ypcOff: 0, rzRush: 1
    };
  }
  function defUnit(p) {
    const q = sv(p, 'yds_allowed_g', lg.dYds) / lg.dYds, pts = sv(p, 'pts_allowed_g', lg.dPts) / lg.dPts;
    const tk = sv(p, 'takeaways_g', lg.dInt + lg.dFum), intG = defRate(p, 'int', tk * 0.6), fumG = defRate(p, 'fum_rec', tk * 0.4);
    return {
      passRush: clampv(K.sackBase + 550 * 0.0602 * K.defSack * (sv(p, 'sacks_g', lg.dSacks) / lg.dSacks - 1), 50, 99),
      passYdsMult: Math.pow(q, K.defPassYds), runOff: K.defRun * (q - 1) * lg.rbYpc, compOff: K.defComp * (pts - 1),
      intMult: clampv(Math.pow((intG + 0.05) / (lg.dInt + 0.05), K.defTake), 0.3, 3),
      fumMult: clampv(Math.pow((fumG + 0.05) / (lg.dFum + 0.05), K.defTake), 0.3, 3),
      retMult: K.retTd * clampv((sv(p, 'def_td', lg.dTd) + 1) / (lg.dTd + 1), 0.3, 3)
    };
  }
  const AVG_UNIT = { passRush: 80, passYdsMult: 1, runOff: 0, compOff: 0, intMult: 1, fumMult: 1, retMult: 1 };
  const avgUnit = () => Object.assign({}, AVG_UNIT, { retMult: K.retTd, passRush: K.sackBase });

  /* ---------- engine roster ---------- */
  const RKEYS = ['speed', 'agility', 'strength', 'stamina', 'throwPower', 'throwAccuracy', 'throwOnRun', 'carrying', 'breakTackle', 'vision', 'catching', 'routeRunning', 'catchInTraffic', 'separation', 'runBlock', 'passBlock', 'passRush', 'runDefense', 'blockShedding', 'manCoverage', 'zoneCoverage', 'tackling', 'hitPower', 'kickPower', 'kickAccuracy', 'awareness', 'playRecognition', 'poise', 'processing', 'consistency', 'aggression', 'injuryProne'];
  const ratings = over => { const r = {}; for (const k of RKEYS) r[k] = 80; return Object.assign(r, over || {}); };
  // Filler by depth role: FILL.WR[1] is the WR2 role, FILL.WR[2] WR3, and so on.
  const FILL = {
    WR: [null, { targets: 6.0, ypr: 11.5 }, { targets: 5.0, ypr: 10.8 }, { targets: 1.8, ypr: 10.0 }],
    TE: [{ targets: 6.0, ypr: 9.6 }, { targets: 1.5, ypr: 8.5 }],
    RB: [null, { carries: 8.5, targets: 2.5, ypr: 6.5 }, { carries: 2.5, targets: 0.4, ypr: 6.0 }]
  };
  const baseProf = o => { const p = Object.assign({ targets: 0, catchOff: 0, yprMult: 1, rzBias: 1, carries: 0, ypcOff: 0, rzRush: 1, designedCarries: 0 }, o); if (o && o.ypr) p.yprMult = Math.pow(o.ypr / K.engYpc, K.recYpr); return p; };

  /**
   * lineup: { QB, RB, WR, FLEX, DEF } of real player objects (or null for an empty slot).
   * Returns { team, players, slotOf } where slotOf maps engine id -> our slot key ('QB', 'FLEX', ...).
   */
  function buildSide(side, lineup, seedName) {
    const base = side === 0 ? 1000 : 2000;
    let n = 0;
    const players = [], slotOf = new Map();
    const add = (position, overall, prof, name, slot, over) => {
      const id = base + (n += 1);
      players.push({ id, lastName: name, position, ratings: ratings(over), overall, weeksInjured: 0, prof: baseProf(prof) });
      if (slot) slotOf.set(id, slot);
      return id;
    };
    const L = lineup || {};
    const qb = L.QB ? qbProf(L.QB) : baseProf({ compOff: K.compBase - 0.03, ypcMult: 0.85, volRel: 0.95, intMult: 1.3, rzComp: -0.03, designedCarries: 0.5, mobile: false, rzRush: 1 });
    add('QB', 90, qb, L.QB ? L.QB.short : 'QB', 'QB', { speed: qb.mobile ? 85 : 70 });
    add('QB', 60, baseProf({}), 'QB2', null);
    // Backs: ours, FLEX if a back, then filler, ordered by carries.
    const backs = [];
    backs.push(L.RB ? { prof: rbProf(L.RB), name: L.RB.short, slot: 'RB' } : { prof: baseProf({ carries: 10, targets: 2.5, ypcOff: -0.4, ypr: 6.5 }), name: 'RB', slot: 'RB' });
    if (L.FLEX && L.FLEX.pos === 'RB') backs.push({ prof: rbProf(L.FLEX), name: L.FLEX.short, slot: 'FLEX' });
    while (backs.length < 3) { const f = FILL.RB[backs.length]; backs.push({ prof: baseProf(Object.assign({}, f, { targets: f.targets * K.rbTgt, catchOff: K.rbCatch })), name: 'RB' + (backs.length + 1), slot: null }); }
    backs.forEach(b => add('RB', 60 + Math.min(35, b.prof.carries), b.prof, b.name, b.slot));
    // Receivers: ours plus filler, ordered by targets.
    const wrs = [];
    wrs.push(L.WR ? { prof: recProf(L.WR), name: L.WR.short, slot: 'WR' } : { prof: baseProf({ targets: 5, catchOff: -0.03, ypr: 11.5 }), name: 'WR', slot: 'WR' });
    if (L.FLEX && L.FLEX.pos === 'WR') wrs.push({ prof: recProf(L.FLEX), name: L.FLEX.short, slot: 'FLEX' });
    while (wrs.length < 4) { const f = FILL.WR[wrs.length]; wrs.push({ prof: baseProf(f), name: 'WR' + (wrs.length + 1), slot: null }); }
    wrs.forEach(w => add('WR', 60 + Math.min(35, w.prof.targets), w.prof, w.name, w.slot));
    const tes = [];
    if (L.FLEX && L.FLEX.pos === 'TE') tes.push({ prof: recProf(L.FLEX), name: L.FLEX.short, slot: 'FLEX' });
    while (tes.length < 2) { const f = FILL.TE[tes.length]; tes.push({ prof: baseProf(f), name: tes.length ? 'TE2' : 'TE', slot: null }); }
    tes.forEach(t => add('TE', 60 + Math.min(35, t.prof.targets), t.prof, t.name, t.slot));
    // Empty FLEX: a replacement receiver.
    if (L.FLEX === null || L.FLEX === undefined) { /* filler already covers the snaps */ }
    // Our players keep their real volume; filler splits what a real team has left over.
    const ours = players.filter(p => slotOf.has(p.id)), filler = players.filter(p => !slotOf.has(p.id) && p.position !== 'QB');
    const share = (field, total, floor) => {
      const used = ours.reduce((a, p) => a + (field === 'carries' && p.position === 'QB' ? 0 : p.prof[field]), 0) + (field === 'carries' ? qb.designedCarries : 0);
      const base = filler.reduce((a, p) => a + p.prof[field], 0);
      if (base <= 0) return;
      const k = Math.max(floor, total - used) / base;
      for (const p of filler) p.prof[field] *= k;
    };
    share('targets', K.teamTargets, K.teamTargets * 0.2);
    share('carries', K.teamCarries, 2);
    for (const pos of ['LT', 'LG', 'C', 'RG', 'RT']) add(pos, 80, baseProf({}), pos, null);
    const unit = L.DEF ? defUnit(L.DEF) : Object.assign(avgUnit(), { passYdsMult: 1.06, runOff: 0.25, compOff: 0.01 });
    const dname = L.DEF ? L.DEF.team : 'DEF';
    for (const [pos, count] of [['EDGE', 2], ['DT', 2], ['LB', 3], ['CB', 3], ['S', 2]]) {
      for (let i = 0; i < count; i += 1) add(pos, 80 - i, baseProf({}), dname, 'DEF', (pos === 'EDGE' || pos === 'DT') ? { passRush: unit.passRush } : {});
    }
    add('K', 80, baseProf({}), 'K', null); add('P', 80, baseProf({}), 'P', null);
    const scheme = {
      aggressiveness: 0.5,
      passBias: clampv(K.passBase + K.qbVolume * K.passBase * ((qb.volRel || 1) - 1), 0.4, 0.8),
      tempo: 0.5, riskTolerance: 0.5, trustInQB: qb.mobile ? 0.6 : 0.5
    };
    scheme.rzRun = K.rzRun;
    unit.rzPen = K.rzPen;   // the unit rides on this side's chart; the engine reads it when this side has the ball
    return { team: { id: side === 0 ? 1 : 2, roster: players.map(p => p.id), scheme, unit }, players, slotOf };
  }
  return { K, init, buildSide, lg: () => lg, qbProf, rbProf, recProf, defUnit };
})();
if (typeof module !== 'undefined') module.exports = SIMKIT;
