// Downloads Madden NFL 26 ratings (the Week 18 update: the end of the 2025 regular season, the
// same season as the player file) from EA's public ratings feed, the one behind
// ea.com/games/madden-nfl/ratings, into madden26-week18.json. Each player: EA id, name, Madden
// position, EA team id, overall and every attribute. Run: node madden-fetch.js
'use strict';
const fs = require('fs');
const path = require('path');

const ITERATION = process.argv[2] || '19-week-18';
const BASE = `https://drop-api.ea.com/rating/madden-nfl?locale=en&iteration=${ITERATION}`;
const POSITIONS = ['QB', 'HB', 'FB', 'WR', 'TE', 'LT', 'LG', 'C', 'RG', 'RT', 'LEDG', 'REDG', 'DT', 'SAM', 'MIKE', 'WILL', 'CB', 'FS', 'SS', 'K', 'P', 'LS'];
const PAGE = 100;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(query) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${BASE}&${query}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt >= 4) throw new Error(`${query}: ${e.message}`);
      await sleep(1000 * attempt);
    }
  }
}
async function all(query) {
  const out = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = await get(`${query}&limit=${PAGE}&offset=${offset}`);
    out.push(...page.items);
    await sleep(150);
    if (out.length >= page.totalItems || !page.items.length) return { items: out, total: page.totalItems };
  }
}

(async () => {
  const players = new Map();
  for (const pos of POSITIONS) {
    const { items } = await all(`position=${pos}`);
    for (const it of items) {
      const stats = {};
      for (const [k, v] of Object.entries(it.stats || {})) if (typeof v.value === 'number') stats[k] = v.value;
      players.set(it.id, { id: it.id, first: it.firstName, last: it.lastName, pos, team: null, age: it.age, height: it.height, weight: it.weight, ovr: it.overallRating, stats });
    }
    console.log(pos, items.length);
  }
  const { totalItems: total } = await get('limit=1&offset=0');
  // Teams: EA's team ids, read off the team filter (the records themselves carry no team).
  for (let team = 1; team <= 40; team++) {
    const { items } = await all(`team=${team}`);
    if (!items.length) continue;
    for (const it of items) if (players.has(it.id)) players.get(it.id).team = team;
  }
  const list = [...players.values()];
  if (list.length !== total) console.warn(`warning: ${list.length} players by position, feed total ${total}`);
  const file = path.join(__dirname, `madden26-${ITERATION.replace(/^\d+-/, '')}.json`);
  fs.writeFileSync(file, JSON.stringify({ source: 'EA Madden NFL 26 ratings feed (drop-api.ea.com/rating/madden-nfl)', iteration: ITERATION, fetched: new Date().toISOString(), players: list }));
  console.log(`${list.length} players (${list.filter(p => p.team).length} on a team) -> ${path.basename(file)}`);
})().catch(e => { console.error(e.message); process.exit(1); });
