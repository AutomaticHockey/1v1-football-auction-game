// Fairness + realism on random auction rosters: the new engine vs the old drive model's strength index.
const fs = require('fs');
const ENGINE = require('./engine.js'), SIMKIT = require('./adapter.js');
const data = JSON.parse(fs.readFileSync(require('path').join(__dirname, '..', 'nfl_auction_players.json'), 'utf8'));
const by = {}; for (const p of data.players) { p.short = p.name.split(' ').pop(); (by[p.pos] = by[p.pos] || []).push(p); }
SIMKIT.init(by);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
// old drive model strength m (spec formula, FLEX folded in)
function oldM(L, D) {
  const s = (p, k) => p.stats[k] || 0, fx = L.FLEX, rb = fx.pos === 'RB';
  const td = (s(L.QB, 'pass_td_g') + s(L.RB, 'td_g') + s(L.WR, 'rec_td_g') + (rb ? s(fx, 'td_g') : s(fx, 'rec_td_g'))) / 2.6;
  const yd = (s(L.QB, 'pass_yds_g') + s(L.QB, 'rush_yds_g') + s(L.RB, 'rush_yds_g') + s(L.WR, 'rec_yds_g') * 0.5 + (rb ? s(fx, 'rush_yds_g') : s(fx, 'rec_yds_g') * 0.5)) / 330;
  return clamp(0.55 * td + 0.45 * yd, 0.65, 1.45) * clamp(0.6 * s(D, 'pts_allowed_g') / 22 + 0.4 * s(D, 'yds_allowed_g') / 330, 0.75, 1.25);
}
const rr = () => { const wr = pick(by.WR); let fx; do { fx = pick(by.RB.concat(by.WR)); } while (fx === wr); let rb; do { rb = pick(by.RB); } while (rb === fx); return { QB: pick(by.QB), RB: rb, WR: wr, FLEX: fx, DEF: pick(by.DEF) }; };
const N = Number(process.argv[2] || 3000);
let better = [0, 0], clear = [0, 0], ties = 0, pts = [], margins = [], shut = 0, t0 = Date.now();
for (let n = 0; n < N; n++) {
  const L0 = rr(), L1 = rr();
  const m0 = oldM(L0, L1.DEF), m1 = oldM(L1, L0.DEF);
  const A = SIMKIT.buildSide(0, L0), B = SIMKIT.buildSide(1, L1);
  const rt = ENGINE.simulateGame(A.team, B.team, A.players.concat(B.players), null, ENGINE.mulberry32((Math.random() * 2 ** 32) >>> 0), { real: true, tempo: SIMKIT.K.tempo });
  const s0 = rt.context.homeScore, s1 = rt.context.awayScore;
  pts.push(s0, s1); margins.push(Math.abs(s0 - s1)); if (!s0) shut++; if (!s1) shut++;
  if (s0 === s1) { ties++; continue; }
  const fav = m0 >= m1 ? 0 : 1, won = (s0 > s1 ? 0 : 1) === fav;
  better[0]++; if (won) better[1]++;
  if (Math.max(m0, m1) / Math.min(m0, m1) > 1.25) { clear[0]++; if (won) clear[1]++; }
}
const mean = pts.reduce((a, b) => a + b, 0) / pts.length, sd = Math.sqrt(pts.reduce((a, b) => a + (b - mean) ** 2, 0) / pts.length);
console.log(JSON.stringify({
  games: N, betterRosterWins: +(100 * better[1] / better[0]).toFixed(1), clearlyBetterWins: +(100 * clear[1] / clear[0]).toFixed(1), clearlyBetterGames: clear[0],
  meanPts: +mean.toFixed(1), teamScoreSd: +sd.toFixed(1), meanAbsMargin: +(margins.reduce((a, b) => a + b, 0) / N).toFixed(1),
  tiedAfterRegulationPct: +(100 * ties / N).toFixed(1), shutoutPct: +(100 * shut / pts.length).toFixed(1), msPerGame: +((Date.now() - t0) / N).toFixed(2)
}));
