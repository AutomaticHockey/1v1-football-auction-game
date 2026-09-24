/* =====================================================================
   SIMKIT: builds each side's engine roster. Nothing here touches a play;
   it only says who is on the field and how good they are.
   - Our auctioned players carry their Madden NFL 26 ratings (the Week 18
     update: the end of the 2025 regular season), placed on Cornerstone's
     scale by percentile (engine-tools/ratings.mts).
   - A DEF pick brings that team's real defense: its best 4 edge rushers,
     4 interior linemen, 4 linebackers, 5 corners and 4 safeties.
   - Everyone else (the line, the kickers, the other backs, receivers and
     tight ends) is filler: Cornerstone's league-average player at that depth
     slot. An empty slot at kickoff gets a backup-level player.
   - Who gets the ball (usage): our players' real 2025 targets and carries a
     game; filler splits what a real team has left by the engine's own
     depth-rank shares. The engine's usage hooks weigh the allocation by it.
   - How well (grades): each real player's and defense's grade (grades.mjs:
     70% 2025 production, 30% Madden) becomes his edges on the plays he is in
     (K.grade). Filler has none, so it plays exactly as the engine rates it.
   - Balance (K.balance): how much of the gap between real players counts at
     each slot. It scales a player's edges and his ratings' distance from the
     league-average starter alike, so the grade's mix holds.
   - Fill-ins (K.fill): every backup beside the real players, and whoever an
     empty slot gets, plays below the worst real player at his position and
     ranks behind every real player (opts.fillers 'engine' turns this off).
   ===================================================================== */
const SIMKIT = (() => {
  const DATA = /*@@RATINGS@@*/null;
  const K = {
    // The volume a team has for its players. Measured in an all-average game (check.js): 32.7 targets
    // and 22.5 backs' carries a team-game. FITTED to 33.6 and 21.5 so our players' simulated volume
    // lands on their real volume (the engine's per-game form evens a lead player's share out a little).
    teamTargets: 33.6,
    teamBackCarries: 21.5,
    rbCatchRate: 0.78,      // backs' real targets are not in the player file: receptions over this
    targetPower: 1.0,       // exponent on volume (1: real volume as is; check.js reads slope 0.98 targets, 1.01 carries)
    carryPower: 1.0,
    // The league's targeted throws by route and designed runs by kind, in an all-average game (measured).
    routeMix: { screen: 0.199, short: 0.454, medium: 0.215, deep: 0.131 },
    runMix: { inside: 0.354, outside: 0.441, draw: 0.121, power: 0.084 },
    // Grades to edges: edge = gain x (grade - ref), or (grade / ref)^gain for a factor. FITTED
    // together (calibrate.js, at balance 1) so that a real player on an otherwise average team
    // plays at his grade: slope 1, no bias. A grade at ref gets no edge, so he plays to his ratings
    // alone. (calibrate.js also prints what an all-average game's players do, for comparison.)
    grade: {
      ref: { ypc: 4.3, rbYpr: 7.217, wrCatch: 0.619, wrYpr: 12.587, teCatch: 0.692, teYpr: 11.25, cmp: 0.617, qbYds: 246, int: 0.78, defYds: 326, take: 1.481 },
      run: 0.92,          // yards a carry per yard of graded yards per carry over ref
      runBreakaway: 0.8,  // CHOSEN: the share of it that comes through breakaway runs (game.ts), the rest on every carry
      catch: 0.9,         // completion chance per point of graded catch rate over ref
      catchYards: 1.11,   // exponent on a receiver's graded yards per catch over ref
      rbCatchYards: 0.9,  // the same for a back
      teCatchYards: 0.83, // and a tight end
      qbCatch: 0.73,      // completion chance per point of graded completion rate over ref
      qbYards: 0.85,      // exponent on graded yards a completion (yards a game over completion rate) over ref
      qbInt: 1.1,         // exponent on graded interceptions a game over ref
      defCatch: 0.24, defYards: 0.8, defRun: 3.2,   // defense: per unit of graded yards allowed over ref
      defInt: 1.6         // exponent on graded takeaways over ref (interceptions carry them all)
    },
    // CHOSEN (by win rates, calibrate.js): 1 plays every real player at his grade. Below 1 narrows
    // the gap between players at that slot, above 1 widens it. FLEX takes its player's position's.
    // Set so the best against the worst at a slot, all else equal (the game's fill-ins), wins about:
    // QB 78%, DEF 72%, RB, WR and TE 60%. A star FLEX against an empty one wins 61-69%.
    balance: { QB: 0.67, RB: 1.0, WR: 0.43, TE: 0.69, DEF: 0.56 },
    // CHOSEN: a fill-in's edges are, part by part, the worst real player's at his position (as
    // played), less this share of the real players' spread in that part.
    fill: { margin: 0.25 }
  };
  const num = (v, fb) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
  const toRatings = list => { const r = {}; DATA.keys.forEach((k, i) => { r[k] = list[i]; }); return r; };
  const filler = slot => { const f = DATA.filler[slot]; return { overall: f[0], ratings: toRatings(f.slice(1)) }; };
  const rated = id => { const p = DATA.players[id]; return p ? { pos: p[0], madden: p[1], overall: p[2], ratings: toRatings(p.slice(3)) } : null; };
  // A real player's or defense's edges from his grade: { run, breakaway, catch, yards, int }, neutral
  // 0, 0, 0, 1, 1, scaled by the slot's balance (additive edges times it, factors to its power).
  function edgeFor(pos, g) {
    const e = rawEdge(pos, g), b = K.balance[pos];
    if (!e || b === 1) return e;
    return { run: b * e.run, breakaway: b * e.breakaway, catch: b * e.catch, yards: Math.pow(e.yards, b), int: Math.pow(e.int, b) };
  }
  // A real player's ratings (and overall) at the slot's balance: his distance from `base` scaled.
  function balanced(r, base, pos) {
    const b = K.balance[pos];
    if (b === 1) return r;
    const ratings = {};
    for (const k of Object.keys(r.ratings)) ratings[k] = Math.max(0, Math.min(100, base.ratings[k] + b * (r.ratings[k] - base.ratings[k])));
    return Object.assign({}, r, { overall: base.overall + b * (r.overall - base.overall), ratings });
  }
  // The fill-ins' floor at a position: each edge part at the worst real player's, less K.fill.margin
  // of the spread (a factor's in log terms), and an overall below every real player's as played.
  function floorFor(pos) {
    const real = Object.keys(DATA.players).filter(id => DATA.players[id][0] === pos && DATA.grades.players[id]);
    if (!real.length) return null;
    const m = K.fill.margin, edges = real.map(id => edgeFor(pos, DATA.grades.players[id]));
    const worst = (part, dir, log) => {
      const v = edges.map(e => (log ? Math.log(e[part]) : e[part])), lo = Math.min(...v), hi = Math.max(...v);
      const x = dir < 0 ? lo - m * (hi - lo) : hi + m * (hi - lo);
      return log ? Math.exp(x) : x;
    };
    const base = filler(pos + '0');
    return {
      edge: { run: worst('run', -1), breakaway: worst('breakaway', -1), catch: worst('catch', -1), yards: worst('yards', -1, true), int: worst('int', 1, true) },
      overall: Math.min(...real.map(id => balanced(rated(id), base, pos).overall)),
    };
  }
  function rawEdge(pos, g) {
    const G = K.grade, R = G.ref, e = { run: 0, breakaway: 0, catch: 0, yards: 1, int: 1 };
    if (!g) return null;
    if (pos === 'RB') {
      const ypc = G.run * (g.ypc - R.ypc);
      e.breakaway = G.runBreakaway * ypc; e.run = ypc - e.breakaway;
      e.yards = Math.pow(g.ypr / R.rbYpr, G.rbCatchYards);
    }
    if (pos === 'WR') { e.catch = G.catch * (g.catch - R.wrCatch); e.yards = Math.pow(g.ypr / R.wrYpr, G.catchYards); }
    if (pos === 'TE') { e.catch = G.catch * (g.catch - R.teCatch); e.yards = Math.pow(g.ypr / R.teYpr, G.teCatchYards); }
    if (pos === 'QB') {
      e.catch = G.qbCatch * (g.cmp - R.cmp);
      e.yards = Math.pow((g.yds / R.qbYds) / (g.cmp / R.cmp), G.qbYards);
      e.int = Math.pow(g.int / R.int, G.qbInt);
    }
    if (pos === 'DEF') {
      const over = g.yds / R.defYds - 1;
      e.catch = G.defCatch * over; e.yards = Math.pow(1 + over, G.defYards); e.run = G.defRun * over;
      e.int = Math.pow(g.take / R.take, G.defInt);
    }
    return e;
  }

  // Depth fielded per group, and the backup-level player an empty slot gets.
  const DEPTH = { QB: 2, RB: 4, WR: 5, TE: 3 };
  const EMPTY = { QB: ['QB', 'QB1'], RB: ['RB', 'RB2'], WR: ['WR', 'WR3'], TE: ['TE', 'TE1'], FLEX: ['WR', 'WR4'] };
  const AVERAGE = { QB: ['QB', 'QB0'], RB: ['RB', 'RB0'], WR: ['WR', 'WR0'], TE: ['TE', 'TE0'], FLEX: ['WR', 'WR1'] };
  const fillName = (pos, role) => (pos === 'TE' ? (role ? 'TE' + (role + 1) : 'TE') : pos + (role + 1));
  const DEFENSE = [['EDGE', 4], ['DT', 4], ['LB', 4], ['CB', 5], ['S', 4]];
  const BACKUP_DEFENSE = { EDGE: [2, 3, 3, 3], DT: [2, 3, 3, 3], LB: [2, 3, 3, 3], CB: [2, 3, 4, 4, 4], S: [2, 3, 3, 3] };

  /**
   * lineup: { QB, RB, WR, TE, FLEX, DEF } of player-file entries (or null for an empty slot); each
   * offensive entry carries `short`, the name the play-by-play uses. Returns { team, players, slotOf }:
   * slotOf maps an engine id to our slot key ('QB', 'FLEX', ...); the whole defense maps to 'DEF'.
   * opts.emptyAs 'average': an empty slot gets the league-average starter instead (for engine-tools checks).
   * opts.fillers 'engine': fill-ins play exactly as the engine rates them (the baseline check).
   */
  function buildSide(side, lineup, opts) {
    const average = opts && opts.emptyAs === 'average', graded = !(opts && opts.fillers === 'engine');
    const floors = {};
    const floor = pos => (pos in floors ? floors[pos] : (floors[pos] = floorFor(pos)));
    const teamId = side === 0 ? 1 : 2, base = teamId * 1000;
    let n = 0;
    const players = [], slotOf = new Map();
    const add = (position, r, name, slot, team, usage, edge, unit) => {
      const id = base + (n += 1);
      players.push({ id, teamId, firstName: '', lastName: name, position, ratings: r.ratings, overall: r.overall, weeksInjured: 0, retiredYear: null, team: team || '', usage: usage || null, edge: edge || null, unit: unit || null });
      if (slot) slotOf.set(id, slot);
    };
    const L = lineup || {};
    const groups = { QB: [], RB: [], WR: [], TE: [] };
    for (const slot of ['QB', 'RB', 'WR', 'TE', 'FLEX']) {
      const p = L[slot], r = p && rated(p.id);
      if (r) groups[r.pos].push({ r: balanced(r, filler(r.pos + '0'), r.pos), name: p.short || p.name, slot, team: p.team, usage: realUsage(p, r.pos), edge: edgeFor(r.pos, DATA.grades.players[p.id]) });
      else { const [pos, fill] = average ? AVERAGE[slot] : EMPTY[slot]; groups[pos].push({ r: filler(fill), name: slot, slot, role: Number(fill.slice(pos.length)), fillIn: !average }); }
    }
    for (const pos of Object.keys(DEPTH)) {
      while (groups[pos].length < DEPTH[pos]) { const role = groups[pos].length; groups[pos].push({ r: filler(pos + role), name: fillName(pos, role), slot: null, role, fillIn: true }); }
    }
    // Fill-ins below the worst real player: his floor's edges, and behind every real player on the
    // depth chart (equal overalls keep the fill-ins' own order, by id).
    for (const pos of Object.keys(DEPTH)) {
      for (const e of groups[pos]) {
        const f = e.fillIn && graded && floor(pos);
        if (f) { e.edge = f.edge; e.r = Object.assign({}, e.r, { overall: Math.min(e.r.overall, f.overall - 1) }); }
      }
    }
    fillUsage(groups);
    for (const pos of Object.keys(DEPTH)) for (const e of groups[pos]) add(pos, e.r, e.name, e.slot, e.team, e.usage, e.edge);
    for (const pos of ['LT', 'LG', 'C', 'RG', 'RT']) add(pos, filler(pos + '0'), pos, null);
    add('K', filler('K0'), 'K', null);
    add('P', filler('P0'), 'P', null);

    const unit = L.DEF && DATA.defenses[L.DEF.team];
    if (unit) {
      const edge = edgeFor('DEF', DATA.grades.defenses[L.DEF.team]), rank = {};
      for (const d of unit) {
        // Each defender against the league-average player at his position and depth.
        const at = rank[d[0]] = (rank[d[0]] === undefined ? 0 : rank[d[0]] + 1);
        const base = filler(d[0] + Math.min(at, BACKUP_DEFENSE[d[0]].length - 1));
        add(d[0], balanced({ overall: d[3], ratings: toRatings(d.slice(4)) }, base, 'DEF'), d[1], 'DEF', L.DEF.team, null, null, edge);
      }
    } else {
      for (const [pos, count] of DEFENSE) for (let i = 0; i < count; i += 1) add(pos, filler(pos + (average ? Math.min(i, 3) : BACKUP_DEFENSE[pos][i])), 'DEF', 'DEF', 'DEF');
    }
    return { team: { id: teamId, roster: players.map(p => p.id), scheme: Object.assign({}, DATA.coach) }, players, slotOf };
  }

  /* ---------- usage ---------- */
  function realUsage(p, pos) {
    const s = p.stats || {}, t = s.totals || {}, games = Math.max(1, num(p.games, 17));
    if (pos === 'RB') return { targets: num(s.rec_g, 0) / K.rbCatchRate, carries: num(t.carries, NaN) / games || num(s.rush_yds_g, 0) / Math.max(2.5, num(s.ypc, 4.3)) };
    if (pos === 'WR' || pos === 'TE') return { targets: num(s.tgt_g, 0), carries: 0 };
    return null;
  }
  // Filler takes what a real team has left, split by the league's share for its depth role.
  function fillUsage(groups) {
    const U = engine().TUNING.usage;
    const groupShare = g => { const i = U.targetGroups.indexOf(g); return Object.keys(K.routeMix).reduce((a, kind) => a + K.routeMix[kind] * U.targetGroupShare[kind][i], 0); };
    const rank = (list, role) => list[Math.min(role, list.length - 1)];
    const skill = [].concat(groups.RB, groups.WR, groups.TE);
    const spread = (field, total, floor, weightOf) => {
      const used = skill.reduce((a, e) => a + (e.usage ? e.usage[field] : 0), 0);
      const open = skill.filter(e => !e.usage), w = open.map(weightOf), sum = w.reduce((a, b) => a + b, 0);
      open.forEach((e, i) => { e.fill = e.fill || {}; e.fill[field] = sum > 0 ? Math.max(floor, total - used) * w[i] / sum : 0; });
    };
    const pos = e => (groups.RB.includes(e) ? 'RB' : groups.WR.includes(e) ? 'WR' : 'TE');
    spread('targets', K.teamTargets, K.teamTargets * 0.15, e => groupShare(pos(e)) * rank(U.targetRankShare[pos(e)], e.role));
    spread('carries', K.teamBackCarries, 1.5, e => (pos(e) === 'RB' ? rank(U.backCarryShare, e.role) : 0));
    for (const e of skill) {
      const u = e.usage || e.fill;
      e.usage = { targets: Math.pow(u.targets || 0, K.targetPower), carries: Math.pow(u.carries || 0, K.carryPower), own: !e.fill };
    }
  }
  // The engine (defined before SIMKIT in the page, required in node). Its usage hooks read the mixes in K.
  const engine = () => (typeof ENGINE !== 'undefined' ? ENGINE : require('./engine.js'));
  const configure = () => engine().configure({ routeMix: K.routeMix, runMix: K.runMix });
  configure();

  /** A player's ratings summary for display: { madden, overall } (Madden's overall, and the engine's). */
  function info(id) { const r = rated(id); return r ? { madden: r.madden, overall: r.overall } : null; }
  /** A team defense's starters: [{ pos, name, madden, overall }]. */
  function defense(team) { return (DATA.defenses[team] || []).map(d => ({ pos: d[0], name: d[1], madden: d[2], overall: d[3] })); }
  return { K, configure, buildSide, info, defense, grades: DATA.grades, source: DATA.source };
})();
if (typeof module !== 'undefined') module.exports = SIMKIT;
