// How well Madden ratings plus Cornerstone's engine reproduce real 2025 stats. Nothing is tuned here.
// 1) Baseline: a league-average lineup against another, as team box-score averages beside
//    Cornerstone's acceptance bands (tuning.ts acceptance, copied below).
// 2) Every real player on an otherwise league-average team against a league-average opponent:
//    his simulated per-game line beside his real 2025 line. Each defense the same way.
// Usage: node check.js [games per player] [names regex to list] [--no-usage]
const fs = require('fs');
const path = require('path');
const ENGINE = require('./engine.js');
const SIMKIT = require('./simkit.js');
const N = Number(process.argv[2] || 200);
const LIST = process.argv[3] && process.argv[3] !== '--no-usage' ? new RegExp(process.argv[3]) : null;
const OPTS = { neutral: true, usage: !process.argv.includes('--no-usage') };
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'nfl_auction_players.json'), 'utf8'));
const byPos = {};
for (const p of data.players) { p.short = p.name.split(' ').slice(-1)[0]; (byPos[p.pos] = byPos[p.pos] || []).push(p); }

const LINE = ['passAttempts', 'completions', 'passingYards', 'passingTouchdowns', 'interceptions', 'rushAttempts', 'rushingYards', 'rushingTouchdowns', 'targets', 'receptions', 'receivingYards', 'receivingTouchdowns'];
const TEAM = ['points', 'totalPlays', 'passAttempts', 'completions', 'netPassingYards', 'rushAttempts', 'rushingYards', 'passingTouchdowns', 'rushingTouchdowns', 'sacksAllowed', 'interceptions', 'turnovers', 'firstDowns', 'thirdDownAttempts', 'thirdDownConversions', 'redZoneTrips', 'redZoneTouchdowns', 'penalties', 'punts', 'fieldGoalsAttempted', 'fieldGoalsMade', 'defensiveTouchdowns', 'totalYards'];
let seed = 1;
// fillers 'engine': the baseline's fill-ins play as the engine rates them (no floor), so it reads the engine.
function play(lineA, lineB, games, recorder, fillers) {
  const A = SIMKIT.buildSide(0, lineA, { emptyAs: 'average', fillers }), B = SIMKIT.buildSide(1, lineB, { emptyAs: 'average', fillers });
  const players = A.players.concat(B.players), sum = {};
  const add = (k, v) => { sum[k] = (sum[k] || 0) + v; };
  for (let g = 0; g < games; g++) {
    const flip = g % 2 === 1;
    const rt = ENGINE.simulateGame(flip ? B.team : A.team, flip ? A.team : B.team, players, ENGINE.mulberry32(seed++), Object.assign({ recorder }, OPTS));
    const sa = flip ? rt.stats.away : rt.stats.home, sb = flip ? rt.stats.home : rt.stats.away;
    for (const [id, line] of rt.stats.players) { const slot = A.slotOf.get(id); if (slot && slot !== 'DEF') for (const k of LINE) add(slot + '.' + k, line[k]); }
    for (const k of TEAM) { add('a.' + k, sa[k]); add('b.' + k, sb[k]); }
    for (const p of A.players) { const l = rt.stats.players.get(p.id); if (l) { add('a.targets', l.targets); if (p.position === 'RB') add('a.backCarries', l.rushAttempts); } }
  }
  return k => (sum[k] || 0) / games;
}
function fit(pairs) {
  const n = pairs.length, mx = pairs.reduce((a, p) => a + p[0], 0) / n, my = pairs.reduce((a, p) => a + p[1], 0) / n;
  let sxy = 0, sxx = 0, syy = 0, ape = 0;
  for (const [x, y] of pairs) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; ape += Math.abs(y - x) / Math.max(0.05, Math.abs(x)); }
  return { real: mx, sim: my, bias: 100 * (my - mx) / mx, slope: sxy / sxx, corr: sxy / Math.sqrt(sxx * syy), mape: 100 * ape / n };
}
const t0 = Date.now();

// 1. Baseline, with a recorder for the league's route and run mixes (the usage hooks' CONFIG).
const routes = { screen: 0, short: 0, medium: 0, deep: 0 }, runs = { inside: 0, outside: 0, draw: 0, power: 0 };
const KIND = { screen: 'screen', shortPass: 'short', playAction: 'short', mediumPass: 'medium', deepPass: 'deep' };
const T = ENGINE.TUNING;
const rec = { record(e) {
  if (e.kind !== 'snap') return;
  const r = e.result;
  if (r.players.receiver !== undefined && KIND[e.playType]) routes[KIND[e.playType]]++;
  if (r.type === 'run' || r.type === 'fumble' && r.players.rusher !== undefined && r.players.receiver === undefined) {
    const at = e.at, power = (at.down >= T.football.downs - 1 && at.toGo <= T.rushing.shortYardageToGo) || at.yardLine >= T.football.fieldLength - T.usage.goalLineYards;
    runs[power ? 'power' : e.playType === 'draw' ? 'draw' : e.playType === 'outsideRun' ? 'outside' : 'inside']++;
  }
} };
const B = play({}, {}, Math.max(1000, N * 5), rec, 'engine');
const share = o => { const t = Object.values(o).reduce((a, b) => a + b, 0); return JSON.stringify(Object.fromEntries(Object.entries(o).map(([k, v]) => [k, +(v / t).toFixed(3)]))); };
const tm = k => (B('a.' + k) + B('b.' + k)) / 2;
const dropbacks = tm('passAttempts') + tm('sacksAllowed');
const band = (label, v, lo, hi, digits = 3) => console.log(`  ${label.padEnd(22)} ${v.toFixed(digits).padStart(7)}  ${v >= lo && v <= hi ? 'in ' : 'OUT'} [${lo}, ${hi}]`);
console.log(`BASELINE (league-average lineups, neutral field, usage ${OPTS.usage ? 'on' : 'off'}), against Cornerstone acceptance bands`);
band('Points per team', tm('points'), 22.0, 23.5, 2);
band('Completion %', tm('completions') / tm('passAttempts'), 0.622, 0.662);
band('Net yards / dropback', tm('netPassingYards') / dropbacks, 5.8, 6.7, 2);
band('Yards per carry', tm('rushingYards') / tm('rushAttempts'), 3.978, 4.628, 2);
band('Sack rate', tm('sacksAllowed') / dropbacks, 0.0589, 0.0709);
band('INT per attempt', tm('interceptions') / tm('passAttempts'), 0.0175, 0.0285, 4);
band('Turnovers per team', tm('turnovers'), 1.07, 1.57, 2);
band('3rd down %', tm('thirdDownConversions') / tm('thirdDownAttempts'), 0.3568, 0.4318);
band('Red zone TD %', tm('redZoneTouchdowns') / tm('redZoneTrips'), 0.506, 0.616);
band('Pass play share', dropbacks / (dropbacks + tm('rushAttempts')), 0.544, 0.614);
band('First downs', tm('firstDowns'), 18, 22, 1);
band('Punts', tm('punts'), 3.12, 4.52, 2);
console.log(`  plays ${tm('totalPlays').toFixed(1)}, pass att ${tm('passAttempts').toFixed(1)}, rush att ${tm('rushAttempts').toFixed(1)}, pass TD ${tm('passingTouchdowns').toFixed(2)}, rush TD ${tm('rushingTouchdowns').toFixed(2)}, FG ${tm('fieldGoalsAttempted').toFixed(2)} att ${(100 * tm('fieldGoalsMade') / tm('fieldGoalsAttempted')).toFixed(1)}%`);
console.log(`  measured for SIMKIT.K: teamTargets ${B('a.targets').toFixed(1)}, teamBackCarries ${B('a.backCarries').toFixed(1)}, routeMix ${share(routes)}, runMix ${share(runs)}`);

// 2. Every real player.
const rows = {}, listed = [];
const col = (pos, key, realFn, simFn) => (p, r) => { (rows[pos + ' ' + key] = rows[pos + ' ' + key] || []).push([realFn(p), simFn(r)]); };
const g = p => Math.max(1, p.games);
const COLS = {
  QB: [col('QB', 'pass yds/g', p => p.stats.pass_yds_g, r => r('QB.passingYards')), col('QB', 'pass TD/g', p => p.stats.pass_td_g, r => r('QB.passingTouchdowns')),
    col('QB', 'INT/g', p => p.stats.int_g, r => r('QB.interceptions')), col('QB', 'cmp %', p => p.stats.cmp_pct, r => 100 * r('QB.completions') / Math.max(1, r('QB.passAttempts'))),
    col('QB', 'rush yds/g', p => p.stats.rush_yds_g, r => r('QB.rushingYards')), col('QB', 'rush TD/g', p => (p.stats.totals.rush_td || 0) / g(p), r => r('QB.rushingTouchdowns'))],
  RB: [col('RB', 'carries/g', p => p.stats.totals.carries / g(p), r => r('RB.rushAttempts')), col('RB', 'rush yds/g', p => p.stats.rush_yds_g, r => r('RB.rushingYards')),
    col('RB', 'yds/carry', p => p.stats.ypc, r => r('RB.rushingYards') / Math.max(0.1, r('RB.rushAttempts'))), col('RB', 'rush TD/g', p => p.stats.totals.rush_td / g(p), r => r('RB.rushingTouchdowns')),
    col('RB', 'rec/g', p => p.stats.rec_g, r => r('RB.receptions')), col('RB', 'rec yds/g', p => p.stats.totals.rec_yds / g(p), r => r('RB.receivingYards'))],
  WR: [col('WR', 'targets/g', p => p.stats.tgt_g, r => r('WR.targets')), col('WR', 'rec/g', p => p.stats.rec_g, r => r('WR.receptions')),
    col('WR', 'rec yds/g', p => p.stats.rec_yds_g, r => r('WR.receivingYards')), col('WR', 'yds/catch', p => p.stats.ypr, r => r('WR.receivingYards') / Math.max(0.1, r('WR.receptions'))),
    col('WR', 'rec TD/g', p => p.stats.rec_td_g, r => r('WR.receivingTouchdowns'))],
  TE: [col('TE', 'targets/g', p => p.stats.tgt_g, r => r('TE.targets')), col('TE', 'rec/g', p => p.stats.rec_g, r => r('TE.receptions')),
    col('TE', 'rec yds/g', p => p.stats.rec_yds_g, r => r('TE.receivingYards')), col('TE', 'yds/catch', p => p.stats.ypr, r => r('TE.receivingYards') / Math.max(0.1, r('TE.receptions'))),
    col('TE', 'rec TD/g', p => p.stats.rec_td_g, r => r('TE.receivingTouchdowns'))],
  DEF: [col('DEF', 'pts allowed/g', p => p.stats.pts_allowed_g, r => r('b.points')), col('DEF', 'yds allowed/g', p => p.stats.yds_allowed_g, r => r('b.totalYards')),
    col('DEF', 'sacks/g', p => p.stats.sacks_g, r => r('b.sacksAllowed')), col('DEF', 'takeaways/g', p => p.stats.takeaways_g, r => r('b.turnovers')),
    col('DEF', 'def TD/season', p => p.stats.def_td, r => r('a.defensiveTouchdowns') * 17)],
};
const SHOW = { QB: ['pass_yds_g', 'QB.passingYards'], RB: ['rush_yds_g', 'RB.rushingYards'], WR: ['rec_yds_g', 'WR.receivingYards'], TE: ['rec_yds_g', 'TE.receivingYards'] };
for (const pos of ['QB', 'RB', 'WR', 'TE', 'DEF']) {
  for (const p of byPos[pos] || []) {
    const r = play({ [pos === 'DEF' ? 'DEF' : pos]: p }, {}, N);
    COLS[pos].forEach(f => f(p, r));
    if (LIST && LIST.test(p.name) && SHOW[pos]) { const i = SIMKIT.info(p.id); listed.push(`${pos} ${p.name.padEnd(22)} Madden ${i.madden} -> ${i.overall} | ${SHOW[pos][0]} real ${p.stats[SHOW[pos][0]]} sim ${r(SHOW[pos][1]).toFixed(1)}`); }
  }
}
console.log(`\nPLAYERS (each on an otherwise average team; ${N} games each): real 2025 average, simulated average,`);
console.log('bias = simulated vs real on average; slope = how much of the gap between players the sim reproduces (1 = all)');
for (const [key, pairs] of Object.entries(rows)) {
  const f = fit(pairs);
  console.log(`  ${key.padEnd(20)} real ${f.real.toFixed(2).padStart(7)}  sim ${f.sim.toFixed(2).padStart(7)}  bias ${(f.bias >= 0 ? '+' : '') + f.bias.toFixed(1)}%`.padEnd(64) + `slope ${f.slope.toFixed(2)}  corr ${f.corr.toFixed(2)}`);
}
for (const l of listed) console.log('  ' + l);
console.log(`(${((Date.now() - t0) / 1000).toFixed(1)} s)`);
