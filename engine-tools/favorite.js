// The engine's own favorite: estimate each matchup's win probability from many sims, then report
// how often the favorite wins (E[max(p, 1-p)]) and the share of lopsided matchups.
const fs = require('fs');
const ENGINE = require('./engine.js'), SIMKIT = require('./adapter.js');
const data = JSON.parse(fs.readFileSync(require('path').join(__dirname, '..', 'nfl_auction_players.json'), 'utf8'));
const by = {}; for (const p of data.players) { p.short = p.name.split(' ').pop(); (by[p.pos] = by[p.pos] || []).push(p); }
SIMKIT.init(by);
const luck = Number(process.argv[2] || 1), PAIRS = Number(process.argv[3] || 250), SIMS = Number(process.argv[4] || 300);
let seed = 12345; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = a => a[Math.floor(rnd() * a.length)];
const rr = () => { const wr = pick(by.WR); let fx; do { fx = pick(by.RB.concat(by.WR)); } while (fx === wr); let rb; do { rb = pick(by.RB); } while (rb === fx); return { QB: pick(by.QB), RB: rb, WR: wr, FLEX: fx, DEF: pick(by.DEF) }; };
let favSum = 0, over70 = 0, over80 = 0, pts = [], s = 1;
for (let n = 0; n < PAIRS; n++) {
  const A = SIMKIT.buildSide(0, rr()), B = SIMKIT.buildSide(1, rr()), pl = A.players.concat(B.players);
  let w = 0, d = 0;
  for (let g = 0; g < SIMS; g++) {
    const rt = ENGINE.simulateGame(A.team, B.team, pl, null, ENGINE.mulberry32(s++), { real: true, tempo: SIMKIT.K.tempo, luck });
    const a = rt.context.homeScore, b = rt.context.awayScore; if (g < 20) pts.push(a, b);
    if (a !== b) { d++; if (a > b) w++; }
  }
  const p = w / d, f = Math.max(p, 1 - p); favSum += f; if (f >= 0.7) over70++; if (f >= 0.8) over80++;
}
const mean = pts.reduce((a, b) => a + b, 0) / pts.length;
console.log(JSON.stringify({ luck, favoriteWins: +(100 * favSum / PAIRS).toFixed(1), matchupsWith70pctFavorite: +(100 * over70 / PAIRS).toFixed(0), with80pct: +(100 * over80 / PAIRS).toFixed(0), meanPts: +mean.toFixed(1) }));
