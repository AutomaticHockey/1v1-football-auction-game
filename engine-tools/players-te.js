// Adds the tight ends to the player file (../nfl_auction_players.json): the top 24 by 2025
// regular-season receiving yards with at least the file's min_games, from nflverse's season stats,
// each built exactly like the file's receivers (the check below rebuilds every WR and must match).
// Replaces any TEs already there; the TE block goes after the WRs, and TE takes the WRs' categories.
//   curl -L -o stats_player_reg_2025.csv https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_reg_2025.csv
//   node players-te.js stats_player_reg_2025.csv && node embed-players.js
'use strict';
const fs = require('fs');
const path = require('path');

const COUNT = 24;
const FILE = path.join(__dirname, '..', 'nfl_auction_players.json');
const csvPath = process.argv[2];
if (!csvPath) { console.error('usage: node players-te.js <stats_player_reg_2025.csv>'); process.exit(1); }

// nflverse's CSV: no quoted commas in the columns we read, but parse quotes anyway.
function parseCsv(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    const cells = [];
    let cell = '', quoted = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (quoted) { if (c === '"' && line[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') quoted = false; else cell += c; }
      else if (c === '"') quoted = true;
      else if (c === ',') { cells.push(cell); cell = ''; }
      else cell += c;
    }
    cells.push(cell);
    rows.push(cells);
  }
  const [head, ...body] = rows;
  return body.map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
// Python's round(x, d), which built the file: the double's exact value, ties to even (0.625 -> 0.62).
function round(x, d) {
  if (x === 0) return 0;
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, Math.abs(x));
  const hi = view.getUint32(0), exp = (hi >>> 20) & 0x7ff;
  let mant = (BigInt(hi & 0xfffff) << 32n) | BigInt(view.getUint32(4)), e = -1074;
  if (exp) { mant |= 1n << 52n; e = exp - 1075; }
  const [num, den] = e >= 0 ? [mant << BigInt(e), 1n] : [mant, 1n << BigInt(-e)];
  const scaled = num * 10n ** BigInt(d);
  let q = scaled / den;
  const r2 = 2n * (scaled % den);
  if (r2 > den || (r2 === den && q % 2n === 1n)) q += 1n;
  return Math.sign(x) * Number(q) / 10 ** d;
}

// The file as Python's json.dump(indent=1) writes it: a per-game stat is a float ("65.0"), non-ASCII
// is escaped. write() checks it reproduces the file it read before changing anything.
function pyJson(value, indent = '', key = null, inStats = false) {
  const next = indent + ' ';
  if (Array.isArray(value)) return value.length ? `[\n${value.map(v => next + pyJson(v, next)).join(',\n')}\n${indent}]` : '[]';
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (!entries.length) return '{}';
    return `{\n${entries.map(([k, v]) => `${next}${JSON.stringify(k)}: ${pyJson(v, next, k, key === 'stats' || (inStats && k !== 'totals' && key !== 'totals'))}`).join(',\n')}\n${indent}}`;
  }
  if (typeof value === 'number') return inStats && key !== 'def_td' && Number.isInteger(value) ? value.toFixed(1) : String(value);
  if (typeof value === 'string') return JSON.stringify(value).replace(/[\u007f-\uffff]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
  return JSON.stringify(value);
}

// A receiver's entry, as the file has them.
function receiver(r, pos) {
  const games = Number(r.games), tgt = Number(r.targets), rec = Number(r.receptions), yds = Number(r.receiving_yards), td = Number(r.receiving_tds);
  return {
    id: r.player_id, name: r.player_display_name, pos, team: r.recent_team, games, headshot: r.headshot_url,
    stats: {
      rec_yds_g: round(yds / games, 1), rec_g: round(rec / games, 1), rec_td_g: round(td / games, 2), ypr: round(yds / Math.max(1, rec), 2), tgt_g: round(tgt / games, 1),
      totals: { tgt, rec, rec_yds: yds, rec_td: td },
    },
  };
}

const text = fs.readFileSync(FILE, 'utf8');
const file = JSON.parse(text);
if (pyJson(file) !== text) throw new Error('could not reproduce the player file\'s own formatting; not writing it');
const rows = parseCsv(fs.readFileSync(csvPath, 'utf8')).filter(r => r.season === String(file.season) && r.season_type === 'REG');
const byId = new Map(rows.map(r => [r.player_id, r]));

// The check: every WR in the file rebuilds from this CSV exactly.
for (const p of file.players.filter(q => q.pos === 'WR')) {
  const r = byId.get(p.id);
  if (!r || JSON.stringify(receiver(r, 'WR')) !== JSON.stringify(p)) throw new Error(`${p.name} does not rebuild from this CSV; is it the same nflverse release?`);
}

const tes = rows.filter(r => r.position === 'TE' && Number(r.games) >= file.min_games)
  .sort((a, b) => Number(b.receiving_yards) - Number(a.receiving_yards) || a.player_id.localeCompare(b.player_id))
  .slice(0, COUNT).map(r => receiver(r, 'TE'));
const rest = file.players.filter(p => p.pos !== 'TE');
const afterWr = rest.map(p => p.pos).lastIndexOf('WR') + 1;
file.players = rest.slice(0, afterWr).concat(tes, rest.slice(afterWr));
file.categories = Object.fromEntries(Object.entries(file.categories).filter(([k]) => k !== 'TE').flatMap(([k, v]) => (k === 'WR' ? [[k, v], ['TE', v]] : [[k, v]])));
fs.writeFileSync(FILE, pyJson(file));
console.log(`${tes.length} TEs: ${tes.map(t => `${t.name} ${t.stats.totals.rec_yds}`).join(', ')}`);
