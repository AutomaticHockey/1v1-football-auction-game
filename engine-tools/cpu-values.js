// What each player is worth to the CPU bidder, measured by the game's own sim: points of margin a
// game that a team gains with him in a slot over the same team with that slot empty (the empty
// slot's fill-in). Everything else on both teams is the league-average starter, with the game's
// fill-ins. Skill players are measured at their position's slot and at FLEX (a back in FLEX next
// to a back, or a receiver next to a receiver, is worth a little less). Defenses at DEF.
// Writes cpu-values.json, which build.mjs puts into simkit.js (SIMKIT.value). Rerun after anything
// that changes how players play (ratings, grades, balance, fill-ins), then build.
//   node cpu-values.js [games per measurement, default 3000]   (uses every core)
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { fork } = require('child_process');

const GAMES = Number(process.argv[2] || 3000);
const OUT = path.join(__dirname, 'cpu-values.json');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'nfl_auction_players.json'), 'utf8'));
// Every measurement: [key, slot, player]. key: the player's id, or the defense's team.
const jobs = [];
for (const p of data.players) {
  if (p.pos === 'DEF') jobs.push([p.team, 'DEF', p]);
  else {
    jobs.push([p.id, p.pos, p]);
    if (['RB', 'WR', 'TE'].includes(p.pos)) jobs.push([p.id, 'FLEX', p]);
  }
}

// One measurement: the margin of {slot: player} over {slot: empty}, sides alternating home and away.
function measure(ENGINE, SIMKIT, slot, player, games, seed) {
  player.short = player.name.split(' ').pop();
  const A = SIMKIT.buildSide(0, { [slot]: player }, { emptyAs: 'average' });
  const B = SIMKIT.buildSide(1, {}, { emptyAs: 'average', emptySlots: [slot] });
  const players = A.players.concat(B.players);
  let margin = 0;
  for (let g = 0; g < games; g++) {
    const flip = g % 2 === 1;
    const rt = ENGINE.simulateGame(flip ? B.team : A.team, flip ? A.team : B.team, players, ENGINE.mulberry32(seed + g), { neutral: true, usage: true });
    margin += flip ? rt.context.awayScore - rt.context.homeScore : rt.context.homeScore - rt.context.awayScore;
  }
  return margin / games;
}

if (process.argv[2] === '--worker') {
  // Worker: measure its share of the jobs and send them back.
  const ENGINE = require('./engine.js'), SIMKIT = require('./simkit.js');
  const [, , , shard, shards, games] = process.argv;
  const out = [];
  jobs.forEach((job, i) => {
    if (i % Number(shards) !== Number(shard)) return;
    out.push([i, measure(ENGINE, SIMKIT, job[1], job[2], Number(games), 1000003 * (i + 1))]);
  });
  process.send(out);
} else {
  const shards = Math.max(1, os.cpus().length);
  const t0 = Date.now();
  let done = 0;
  const results = new Array(jobs.length);
  for (let s = 0; s < shards; s++) {
    const child = fork(__filename, ['--worker', String(s), String(shards), String(GAMES)]);
    child.on('message', (rows) => {
      for (const [i, v] of rows) results[i] = v;
      if (++done === shards) finish();
    });
  }
  function finish() {
    const round2 = (x) => Math.round(x * 100) / 100;
    const out = { games: GAMES, measured: new Date().toISOString().slice(0, 10), players: {}, defenses: {} };
    jobs.forEach(([key, slot, p], i) => {
      if (slot === 'DEF') out.defenses[key] = round2(results[i]);
      else {
        const v = out.players[key] = out.players[key] || [null, null];
        v[slot === 'FLEX' ? 1 : 0] = round2(results[i]);
      }
    });
    fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
    const byPos = {};
    for (const p of data.players) {
      const v = p.pos === 'DEF' ? out.defenses[p.team] : out.players[p.id][0];
      (byPos[p.pos] = byPos[p.pos] || []).push([v, p.name]);
    }
    for (const [pos, list] of Object.entries(byPos)) {
      list.sort((a, b) => b[0] - a[0]);
      console.log(`${pos}: ${list[0][1]} ${list[0][0]} .. median ${list[Math.floor(list.length / 2)][0]} .. ${list[list.length - 1][1]} ${list[list.length - 1][0]}`);
    }
    console.log(`${jobs.length} measurements x ${GAMES} games in ${((Date.now() - t0) / 1000).toFixed(0)} s -> cpu-values.json`);
  }
}
