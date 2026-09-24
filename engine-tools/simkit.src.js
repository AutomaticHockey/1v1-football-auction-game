/* =====================================================================
   SIMKIT: builds each side's engine roster. Nothing here touches a play;
   it only says who is on the field and how good they are.
   - Our auctioned players carry their Madden NFL 26 ratings (the Week 18
     update: the end of the 2025 regular season), placed on Cornerstone's
     scale by percentile (engine-tools/ratings.ts).
   - A DEF pick brings that team's real defense: its best 4 edge rushers,
     4 interior linemen, 4 linebackers, 5 corners and 4 safeties.
   - Everyone else (the line, the kickers, the other backs, receivers and
     tight ends) is filler: Cornerstone's league-average player at that depth
     slot. An empty slot at kickoff gets a backup-level player.
   - Who gets the ball (usage): our players' real 2025 targets and carries a
     game; filler splits what a real team has left by the engine's own
     depth-rank shares. The engine's usage hooks weigh the allocation by it.
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
    runMix: { inside: 0.354, outside: 0.441, draw: 0.121, power: 0.084 }
  };
  const num = (v, fb) => { const n = Number(v); return Number.isFinite(n) ? n : fb; };
  const toRatings = list => { const r = {}; DATA.keys.forEach((k, i) => { r[k] = list[i]; }); return r; };
  const filler = slot => { const f = DATA.filler[slot]; return { overall: f[0], ratings: toRatings(f.slice(1)) }; };
  const rated = id => { const p = DATA.players[id]; return p ? { pos: p[0], madden: p[1], overall: p[2], ratings: toRatings(p.slice(3)) } : null; };

  // Depth fielded per group, and the backup-level player an empty slot gets.
  const DEPTH = { QB: 2, RB: 4, WR: 5, TE: 3 };
  const EMPTY = { QB: ['QB', 'QB1'], RB: ['RB', 'RB2'], WR: ['WR', 'WR3'], FLEX: ['WR', 'WR4'] };
  const AVERAGE = { QB: ['QB', 'QB0'], RB: ['RB', 'RB0'], WR: ['WR', 'WR0'], FLEX: ['WR', 'WR1'] };
  const fillName = (pos, role) => (pos === 'TE' ? (role ? 'TE' + (role + 1) : 'TE') : pos + (role + 1));
  const DEFENSE = [['EDGE', 4], ['DT', 4], ['LB', 4], ['CB', 5], ['S', 4]];
  const BACKUP_DEFENSE = { EDGE: [2, 3, 3, 3], DT: [2, 3, 3, 3], LB: [2, 3, 3, 3], CB: [2, 3, 4, 4, 4], S: [2, 3, 3, 3] };

  /**
   * lineup: { QB, RB, WR, FLEX, DEF } of player-file entries (or null for an empty slot); each
   * offensive entry carries `short`, the name the play-by-play uses. Returns { team, players, slotOf }:
   * slotOf maps an engine id to our slot key ('QB', 'FLEX', ...); the whole defense maps to 'DEF'.
   * opts.emptyAs 'average': an empty slot gets the league-average starter instead (for engine-tools checks).
   */
  function buildSide(side, lineup, opts) {
    const average = opts && opts.emptyAs === 'average';
    const teamId = side === 0 ? 1 : 2, base = teamId * 1000;
    let n = 0;
    const players = [], slotOf = new Map();
    const add = (position, r, name, slot, team, usage) => {
      const id = base + (n += 1);
      players.push({ id, teamId, firstName: '', lastName: name, position, ratings: r.ratings, overall: r.overall, weeksInjured: 0, retiredYear: null, team: team || '', usage: usage || null });
      if (slot) slotOf.set(id, slot);
    };
    const L = lineup || {};
    const groups = { QB: [], RB: [], WR: [], TE: [] };
    for (const slot of ['QB', 'RB', 'WR', 'FLEX']) {
      const p = L[slot], r = p && rated(p.id);
      if (r) groups[r.pos].push({ r, name: p.short || p.name, slot, team: p.team, usage: realUsage(p, r.pos) });
      else { const [pos, fill] = average ? AVERAGE[slot] : EMPTY[slot]; groups[pos].push({ r: filler(fill), name: slot, slot, role: Number(fill.slice(pos.length)) }); }
    }
    for (const pos of Object.keys(DEPTH)) {
      while (groups[pos].length < DEPTH[pos]) { const role = groups[pos].length; groups[pos].push({ r: filler(pos + role), name: fillName(pos, role), slot: null, role }); }
    }
    fillUsage(groups);
    for (const pos of Object.keys(DEPTH)) for (const e of groups[pos]) add(pos, e.r, e.name, e.slot, e.team, e.usage);
    for (const pos of ['LT', 'LG', 'C', 'RG', 'RT']) add(pos, filler(pos + '0'), pos, null);
    add('K', filler('K0'), 'K', null);
    add('P', filler('P0'), 'P', null);

    const unit = L.DEF && DATA.defenses[L.DEF.team];
    if (unit) {
      for (const d of unit) add(d[0], { overall: d[3], ratings: toRatings(d.slice(4)) }, d[1], 'DEF', L.DEF.team);
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
      e.usage = { targets: Math.pow(u.targets || 0, K.targetPower), carries: Math.pow(u.carries || 0, K.carryPower) };
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
  return { K, configure, buildSide, info, defense, source: DATA.source };
})();
if (typeof module !== 'undefined') module.exports = SIMKIT;
