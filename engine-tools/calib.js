// Calibration: each real player on an otherwise league-average team vs a league-average opponent.
// Compares his simulated per-game line with his real one. Usage: node calib.js [games] [K overrides json]
const fs = require('fs');
const path = require('path');
const ENGINE = require('./engine.js');
const SIMKIT = require('./adapter.js');
const N = Number(process.argv[2] || 150);
if (process.argv[3]) Object.assign(SIMKIT.K, JSON.parse(process.argv[3]));
const data = JSON.parse(fs.readFileSync(require('path').join(__dirname, '..', 'nfl_auction_players.json'), 'utf8'));
const byPos = {};
for (const p of data.players) { p.short = p.name.split(' ').slice(-1)[0]; (byPos[p.pos] = byPos[p.pos] || []).push(p); }
const lg = SIMKIT.init(byPos);
const avg = {
  QB: { pos: 'QB', short: 'avgQB', games: 17, stats: { pass_yds_g: lg.qbYds, cmp_pct: lg.qbCmp, int_g: lg.qbInt, rush_yds_g: 15.4, totals: { rush_td: 0.184 * 17 } } },
  RB: { pos: 'RB', short: 'avgRB', games: 17, stats: { rush_yds_g: lg.rbYpc * lg.rbCar, ypc: lg.rbYpc, td_g: 0.51, scrim_yds_g: lg.rbYpc * lg.rbCar + lg.rbRec * lg.rbYpr, rec_g: lg.rbRec, totals: { carries: lg.rbCar * 17, rush_td: lg.rbTdCar * lg.rbCar * 17, rec: lg.rbRec * 17, rec_yds: lg.rbRec * lg.rbYpr * 17, rec_td: lg.rbTdRec * lg.rbRec * 17 } } },
  WR: { pos: 'WR', short: 'avgWR', games: 17, stats: { rec_yds_g: lg.wrTgt * lg.wrCatch * lg.wrYpr, rec_g: lg.wrTgt * lg.wrCatch, rec_td_g: lg.wrTdTgt * lg.wrTgt, ypr: lg.wrYpr, tgt_g: lg.wrTgt } },
  DEF: { pos: 'DEF', team: 'AVG', games: 17, stats: { pts_allowed_g: lg.dPts, yds_allowed_g: lg.dYds, sacks_g: lg.dSacks, takeaways_g: lg.dInt + lg.dFum, def_td: lg.dTd, totals: { int: lg.dInt * 17, fum_rec: lg.dFum * 17 } } }
};
const avgLineup = () => ({ QB: avg.QB, RB: avg.RB, WR: avg.WR, FLEX: avg.WR, DEF: avg.DEF });

let seedBase = 1;
function play(lineA, lineB, games) {
  const acc = { a: [], b: [], sa: null, sb: null };
  const A = SIMKIT.buildSide(0, lineA), B = SIMKIT.buildSide(1, lineB);
  const players = A.players.concat(B.players);
  const sum = {};
  const add = (k, v) => { sum[k] = (sum[k] || 0) + v; };
  let ptsA = 0, ptsB = 0, wins = 0, decided = 0;
  for (let g = 0; g < games; g++) {
    const flip = g % 2 === 1;
    const rt = ENGINE.simulateGame(flip ? B.team : A.team, flip ? A.team : B.team, players, null, ENGINE.mulberry32(seedBase++), { real: true, tempo: SIMKIT.K.tempo });
    const sa = flip ? rt.stats.away : rt.stats.home, sb = flip ? rt.stats.home : rt.stats.away;
    const pa = flip ? rt.context.awayScore : rt.context.homeScore, pb = flip ? rt.context.homeScore : rt.context.awayScore;
    ptsA += pa; ptsB += pb; if (pa !== pb) { decided++; if (pa > pb) wins++; }
    for (const [id, line] of rt.stats.players) {
      const slot = A.slotOf.get(id); if (!slot) continue;
      for (const k of ['passAttempts', 'completions', 'passingYards', 'passingTouchdowns', 'interceptions', 'rushAttempts', 'rushingYards', 'rushingTouchdowns', 'targets', 'receptions', 'receivingYards', 'receivingTouchdowns', 'sacks']) add(slot + '.' + k, line[k]);
    }
    add('opp.points', pb); add('opp.yards', sb.totalYards); add('opp.sacks', sb.sacksAllowed); add('opp.turnovers', sb.turnovers); add('def.td', sa.defensiveTouchdowns);
    add('team.passAtt', sa.passAttempts); add('team.cmp', sa.completions); add('team.grossPass', sa.grossPassingYards); add('team.rushYds', sa.rushingYards); add('team.rushAtt', sa.rushAttempts); add('team.plays', sa.totalPlays);
  }
  const per = k => (sum[k] || 0) / games;
  return { per, ptsA: ptsA / games, ptsB: ptsB / games, winA: decided ? wins / decided : 0.5 };
}

function stats(pairs) {
  const n = pairs.length, mx = pairs.reduce((a, p) => a + p[0], 0) / n, my = pairs.reduce((a, p) => a + p[1], 0) / n;
  let sxy = 0, sxx = 0, syy = 0, ape = 0;
  for (const [x, y] of pairs) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; ape += Math.abs(y - x) / Math.max(0.05, Math.abs(x)); }
  return { real: +mx.toFixed(2), sim: +my.toFixed(2), bias: +(100 * (my - mx) / mx).toFixed(1) + '%', slope: +(sxy / sxx).toFixed(2), corr: +(sxy / Math.sqrt(sxx * syy)).toFixed(2), mape: +(100 * ape / n).toFixed(1) + '%' };
}

const out = {};
const t0 = Date.now();
// Baseline: average vs average
const base = play(avgLineup(), avgLineup(), N * 4);
out.baseline = { ptsPerTeam: +base.ptsA.toFixed(2), passAtt: +base.per('team.passAtt').toFixed(1), rushAtt: +base.per('team.rushAtt').toFixed(1), plays: +base.per('team.plays').toFixed(1), ypc: +(base.per('team.grossPass') / base.per('team.cmp')).toFixed(2), cmpPct: +(100 * base.per('team.cmp') / base.per('team.passAtt')).toFixed(1), rushYpc: +(base.per('team.rushYds') / base.per('team.rushAtt')).toFixed(2), wrTargets: +base.per('WR.targets').toFixed(2), rbCarries: +base.per('RB.rushAttempts').toFixed(2) };
const rows = { QB: {}, RB: {}, WR: {}, DEF: {} };
const collect = (pos, key, realFn, simFn) => { (rows[pos][key] = rows[pos][key] || []); return (p, r) => rows[pos][key].push([realFn(p), simFn(r)]); };
const QBc = [collect('QB', 'pass_yds_g', p => p.stats.pass_yds_g, r => r.per('QB.passingYards')), collect('QB', 'pass_td_g', p => p.stats.pass_td_g, r => r.per('QB.passingTouchdowns')), collect('QB', 'int_g', p => p.stats.int_g, r => r.per('QB.interceptions')), collect('QB', 'cmp_pct', p => p.stats.cmp_pct, r => 100 * r.per('QB.completions') / Math.max(1, r.per('QB.passAttempts'))), collect('QB', 'rush_yds_g', p => p.stats.rush_yds_g, r => r.per('QB.rushingYards'))];
const RBc = [collect('RB', 'rush_yds_g', p => p.stats.rush_yds_g, r => r.per('RB.rushingYards')), collect('RB', 'ypc', p => p.stats.ypc, r => r.per('RB.rushingYards') / Math.max(0.1, r.per('RB.rushAttempts'))), collect('RB', 'td_g', p => p.stats.td_g, r => r.per('RB.rushingTouchdowns') + r.per('RB.receivingTouchdowns')), collect('RB', 'rec_g', p => p.stats.rec_g, r => r.per('RB.receptions')), collect('RB', 'scrim_yds_g', p => p.stats.scrim_yds_g, r => r.per('RB.rushingYards') + r.per('RB.receivingYards'))];
const WRc = [collect('WR', 'rec_yds_g', p => p.stats.rec_yds_g, r => r.per('WR.receivingYards')), collect('WR', 'rec_g', p => p.stats.rec_g, r => r.per('WR.receptions')), collect('WR', 'rec_td_g', p => p.stats.rec_td_g, r => r.per('WR.receivingTouchdowns')), collect('WR', 'ypr', p => p.stats.ypr, r => r.per('WR.receivingYards') / Math.max(0.1, r.per('WR.receptions'))), collect('WR', 'tgt_g', p => p.stats.tgt_g, r => r.per('WR.targets'))];
const DEFc = [collect('DEF', 'pts_allowed_g', p => p.stats.pts_allowed_g, r => r.per('opp.points')), collect('DEF', 'yds_allowed_g', p => p.stats.yds_allowed_g, r => r.per('opp.yards')), collect('DEF', 'sacks_g', p => p.stats.sacks_g, r => r.per('opp.sacks')), collect('DEF', 'takeaways_g', p => p.stats.takeaways_g, r => r.per('opp.turnovers')), collect('DEF', 'def_td(season)', p => p.stats.def_td, r => r.per('def.td') * 17)];
const perPlayer = [];
for (const p of byPos.QB) { const r = play(Object.assign(avgLineup(), { QB: p }), avgLineup(), N); QBc.forEach(f => f(p, r)); perPlayer.push(['QB', p.name, p.stats.pass_yds_g, +r.per('QB.passingYards').toFixed(1), p.stats.int_g, +r.per('QB.interceptions').toFixed(2)]); }
for (const p of byPos.RB) { const r = play(Object.assign(avgLineup(), { RB: p }), avgLineup(), N); RBc.forEach(f => f(p, r)); }
for (const p of byPos.WR) { const r = play(Object.assign(avgLineup(), { WR: p }), avgLineup(), N); WRc.forEach(f => f(p, r)); perPlayer.push(['WR', p.name, p.stats.tgt_g, +r.per('WR.targets').toFixed(1), p.stats.rec_yds_g, +r.per('WR.receivingYards').toFixed(1)]); }
for (const p of byPos.DEF) { const r = play(avgLineup(), Object.assign(avgLineup(), { DEF: p }), N); DEFc.forEach(f => f(p, { per: k => k.startsWith('opp.') ? r.per(k.replace('opp.', 'self.')) : 0 })); }
// DEF needs the defense's own view: re-run with the defense on side A.
rows.DEF = {};
const DEFc2 = [collect('DEF', 'pts_allowed_g', p => p.stats.pts_allowed_g, r => r.per('opp.points')), collect('DEF', 'yds_allowed_g', p => p.stats.yds_allowed_g, r => r.per('opp.yards')), collect('DEF', 'sacks_g', p => p.stats.sacks_g, r => r.per('opp.sacks')), collect('DEF', 'takeaways_g', p => p.stats.takeaways_g, r => r.per('opp.turnovers')), collect('DEF', 'def_td(season)', p => p.stats.def_td, r => r.per('def.td') * 17)];
for (const p of byPos.DEF) { const r = play(Object.assign(avgLineup(), { DEF: p }), avgLineup(), N); DEFc2.forEach(f => f(p, r)); }
for (const pos of Object.keys(rows)) { out[pos] = {}; for (const k of Object.keys(rows[pos])) out[pos][k] = stats(rows[pos][k]); }
out.seconds = (Date.now() - t0) / 1000;
if (process.env.SHOW_PLAYERS) out.players = perPlayer.filter(r => /Chase|Egbuka|Stafford|Allen|Nacua|Smith-Njigba/.test(r[1]));
console.log(JSON.stringify(out, null, 1));
