// Calibrates the grade hooks (SIMKIT.K.grade) and reports what they do to winning.
// 1) ref: an all-average game's per-player rates, what the engine's league-average player does
//    (K.grade.ref; a grade there gets no edge).
// 2) Each real player (and defense) on an otherwise average team against an average team: his
//    simulated rate beside his grade (grades.mjs). slope 1 and bias 0 mean the sim plays him at
//    his grade. The gains in K.grade are fitted to that.
// 3) Winning: at each slot the best player against the worst (by the stat the auction cards lead
//    with), everything else equal; and a star FLEX against an empty one.
// Usage: node calibrate.js [games per player, default 200] [--wins-only] [--no-wins]
//   GRADE='{...}' and BALANCE='{...}' try other K.grade and K.balance values without a rebuild.
const fs = require('fs');
const path = require('path');
const ENGINE = require('./engine.js');
const SIMKIT = require('./simkit.js');
const N = Number(process.argv[2] || 200);
const ONLY_WINS = process.argv.includes('--wins-only'), NO_WINS = process.argv.includes('--no-wins');
const OPTS = { neutral: true, usage: true };
// GRADE='{"run":0.8,"ref":{"ypc":4.3}}' tries other K.grade values without a rebuild.
if (process.env.GRADE) { const o = JSON.parse(process.env.GRADE); Object.assign(SIMKIT.K.grade.ref, o.ref || {}); delete o.ref; Object.assign(SIMKIT.K.grade, o); }
// BALANCE='{"QB":0.6}' likewise for K.balance.
if (process.env.BALANCE) Object.assign(SIMKIT.K.balance, JSON.parse(process.env.BALANCE));
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'nfl_auction_players.json'), 'utf8'));
const byPos = {};
for (const p of data.players) { p.short = p.name.split(' ').slice(-1)[0]; (byPos[p.pos] = byPos[p.pos] || []).push(p); }
let seed = 1;

// Totals for side A's slots and both teams over `games` games (sides alternate home and away).
function play(lineA, lineB, games, emptyAs = 'average') {
  const A = SIMKIT.buildSide(0, lineA, { emptyAs }), B = SIMKIT.buildSide(1, lineB, { emptyAs });
  const players = A.players.concat(B.players), sum = {};
  const add = (k, v) => { sum[k] = (sum[k] || 0) + v; };
  for (let g = 0; g < games; g++) {
    const flip = g % 2 === 1;
    const rt = ENGINE.simulateGame(flip ? B.team : A.team, flip ? A.team : B.team, players, ENGINE.mulberry32(seed++), OPTS);
    const sa = flip ? rt.stats.away : rt.stats.home, sb = flip ? rt.stats.home : rt.stats.away;
    const a = flip ? rt.context.awayScore : rt.context.homeScore, b = flip ? rt.context.homeScore : rt.context.awayScore;
    add('win', a > b ? 1 : a === b ? 0.5 : 0); add('margin', a - b);
    for (const [id, line] of rt.stats.players) {
      const slot = A.slotOf.get(id);
      if (slot && slot !== 'DEF') for (const k of Object.keys(line)) if (typeof line[k] === 'number') add(slot + '.' + k, line[k]);
    }
    add('b.totalYards', sb.totalYards); add('b.points', b); add('b.turnovers', sb.turnovers);
  }
  return k => sum[k] || 0;
}
function fit(pairs) {
  const n = pairs.length, mx = pairs.reduce((a, p) => a + p[0], 0) / n, my = pairs.reduce((a, p) => a + p[1], 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of pairs) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
  return { grade: mx, sim: my, bias: 100 * (my - mx) / mx, slope: sxy / sxx, corr: sxy / Math.sqrt(sxx * syy) };
}
const t0 = Date.now();

if (!ONLY_WINS) {
  // 1. ref
  const base = play({}, {}, Math.max(2000, N * 10));
  const games = Math.max(2000, N * 10);
  const ref = {
    ypc: base('RB.rushingYards') / base('RB.rushAttempts'),
    rbYpr: base('RB.receivingYards') / base('RB.receptions'),
    wrCatch: base('WR.receptions') / base('WR.targets'),
    wrYpr: base('WR.receivingYards') / base('WR.receptions'),
    cmp: base('QB.completions') / base('QB.passAttempts'),
    qbYds: base('QB.passingYards') / games,
    int: base('QB.interceptions') / games,
    defYds: base('b.totalYards') / games,
    take: base('b.turnovers') / games,
  };
  console.log('REF (all-average game; K.grade.ref):', JSON.stringify(Object.fromEntries(Object.entries(ref).map(([k, v]) => [k, +v.toFixed(3)]))));
  console.log('K.grade.ref now:', JSON.stringify(SIMKIT.K.grade.ref));

  // 2. every real player at his grade, at full strength (balance 1: the gains are fitted there)
  const G = SIMKIT.grades, balance = Object.assign({}, SIMKIT.K.balance);
  for (const k of Object.keys(SIMKIT.K.balance)) SIMKIT.K.balance[k] = 1;
  const rows = {};
  const put = (key, grade, sim) => { (rows[key] = rows[key] || []).push([grade, sim]); };
  for (const p of byPos.RB || []) {
    const r = play({ RB: p }, {}, N), g = G.players[p.id];
    put('RB yds/carry', g.ypc, r('RB.rushingYards') / Math.max(1, r('RB.rushAttempts')));
    put('RB yds/catch', g.ypr, r('RB.receivingYards') / Math.max(1, r('RB.receptions')));
  }
  for (const p of byPos.WR || []) {
    const r = play({ WR: p }, {}, N), g = G.players[p.id];
    put('WR catch rate', g.catch, r('WR.receptions') / Math.max(1, r('WR.targets')));
    put('WR yds/catch', g.ypr, r('WR.receivingYards') / Math.max(1, r('WR.receptions')));
  }
  for (const p of byPos.QB || []) {
    const r = play({ QB: p }, {}, N), g = G.players[p.id];
    put('QB cmp rate', g.cmp, r('QB.completions') / Math.max(1, r('QB.passAttempts')));
    put('QB pass yds/g', g.yds, r('QB.passingYards') / N);
    put('QB INT/g', g.int, r('QB.interceptions') / N);
  }
  for (const p of byPos.DEF || []) {
    const r = play({ DEF: p }, {}, N), g = G.defenses[p.team];
    put('DEF yds allowed/g', g.yds, r('b.totalYards') / N);
    put('DEF pts allowed/g', g.pts, r('b.points') / N);
    put('DEF takeaways/g', g.take, r('b.turnovers') / N);
  }
  Object.assign(SIMKIT.K.balance, balance);
  console.log(`\nGRADES (each real player on an otherwise average team, ${N} games, balance 1): slope 1 = the sim plays him at his grade`);
  for (const [key, pairs] of Object.entries(rows)) {
    const f = fit(pairs);
    console.log(`  ${key.padEnd(18)} grade ${f.grade.toFixed(3).padStart(8)}  sim ${f.sim.toFixed(3).padStart(8)}  bias ${(f.bias >= 0 ? '+' : '') + f.bias.toFixed(1)}%`.padEnd(70) + `slope ${f.slope.toFixed(2)}  corr ${f.corr.toFixed(2)}`);
  }
}

if (!NO_WINS) {
  // 3. winning
  const W = Math.max(2000, N * 10);
  const key = { QB: 'pass_yds_g', RB: 'rush_yds_g', WR: 'rec_yds_g', DEF: 'pts_allowed_g' };
  const sorted = pos => byPos[pos].slice().sort((a, b) => (pos === 'DEF' ? a.stats[key[pos]] - b.stats[key[pos]] : b.stats[key[pos]] - a.stats[key[pos]]));
  const line = (label, r) => console.log(`  ${label.padEnd(58)} wins ${(100 * r('win') / W).toFixed(1)}%  margin ${(r('margin') / W >= 0 ? '+' : '') + (r('margin') / W).toFixed(1)}`);
  console.log(`\nWINNING (${W} games each; everything else league average; balance ${JSON.stringify(SIMKIT.K.balance)})`);
  for (const pos of ['QB', 'RB', 'WR', 'DEF']) {
    const s = sorted(pos), best = s[0], worst = s[s.length - 1];
    line(`${pos}: ${best.name} vs ${worst.name}`, play({ [pos]: best }, { [pos]: worst }, W));
  }
  const find = n => data.players.find(p => p.name === n);
  const core = { QB: find('Jared Goff'), RB: find('Bijan Robinson'), WR: find('Garrett Wilson'), DEF: find('Seahawks Defense') };
  line('FLEX: Puka Nacua vs empty (same QB, RB, WR, DEF)', play(Object.assign({ FLEX: find('Puka Nacua') }, core), Object.assign({ FLEX: null }, core), W, 'empty'));
  line('FLEX: Jahmyr Gibbs vs empty (same QB, RB, WR, DEF)', play(Object.assign({ FLEX: find('Jahmyr Gibbs') }, core), Object.assign({ FLEX: null }, core), W, 'empty'));
}
console.log(`(${((Date.now() - t0) / 1000).toFixed(1)} s)`);
