// How decisive the sim is: for random drafted matchups, estimate each side's win probability from
// many sims and report how often the favorite wins (E[max(p, 1-p)]) and the share of lopsided matchups.
// Usage: node favorite.js [matchups] [sims per matchup]
const fs = require('fs'), path = require('path');
const ENGINE = require('./engine.js'), SIMKIT = require('./simkit.js');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'nfl_auction_players.json'), 'utf8'));
const by = {}; for (const p of data.players) { p.short = p.name.split(' ').pop(); (by[p.pos] = by[p.pos] || []).push(p); }
const PAIRS = Number(process.argv[2] || 200), SIMS = Number(process.argv[3] || 300);
let s0 = 12345; const rnd = () => { s0 = (s0 * 1103515245 + 12345) & 0x7fffffff; return s0 / 0x7fffffff; };
const pick = a => a[Math.floor(rnd() * a.length)];
const draft = () => { const wr = pick(by.WR), te = pick(by.TE); let fx; do { fx = pick(by.RB.concat(by.WR, by.TE)); } while (fx === wr || fx === te); let rb; do { rb = pick(by.RB); } while (rb === fx); return { QB: pick(by.QB), RB: rb, WR: wr, TE: te, FLEX: fx, DEF: pick(by.DEF) }; };
let fav = 0, over70 = 0, over80 = 0, seed = 1, pts = [];
for (let n = 0; n < PAIRS; n++) {
  const A = SIMKIT.buildSide(0, draft()), B = SIMKIT.buildSide(1, draft()), pl = A.players.concat(B.players);
  let w = 0;
  for (let g = 0; g < SIMS; g++) {
    const flip = g % 2 === 1;
    const rt = ENGINE.simulateGame(flip ? B.team : A.team, flip ? A.team : B.team, pl, ENGINE.mulberry32(seed++), { neutral: true, usage: !process.argv.includes('--no-usage') });
    const a = flip ? rt.context.awayScore : rt.context.homeScore, b = flip ? rt.context.homeScore : rt.context.awayScore;
    w += a > b ? 1 : a === b ? 0.5 : 0; if (g < 10) pts.push(a, b);
  }
  const p = w / SIMS, f = Math.max(p, 1 - p); fav += f; if (f >= 0.7) over70++; if (f >= 0.8) over80++;
}
const mean = pts.reduce((a, b) => a + b, 0) / pts.length;
console.log(JSON.stringify({ favoriteWins: +(100 * fav / PAIRS).toFixed(1) + '%', matchupsWith70pctFavorite: Math.round(100 * over70 / PAIRS) + '%', with80pct: Math.round(100 * over80 / PAIRS) + '%', meanPoints: +mean.toFixed(1) }));
