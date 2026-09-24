// Copies the player file into index.html, so the game runs when the page is opened
// straight from disk (file://), e.g. on a Chromebook, with no server and no website.
// Run it again after changing the player file:  node engine-tools/embed-players.js
'use strict';
const fs = require('fs'), path = require('path');

const root = path.join(__dirname, '..');
const page = path.join(root, 'index.html');
// Same order the page tries when it is served.
const src = ['players.json', 'nfl_auction_players.json'].map(f => path.join(root, f)).find(f => fs.existsSync(f));
if (!src) throw new Error('No players.json or nfl_auction_players.json next to index.html.');

const data = JSON.parse(fs.readFileSync(src, 'utf8'));
if (!data || !Array.isArray(data.players)) throw new Error(`${path.basename(src)} has no "players" array.`);
// "<" only appears inside JSON strings, where < is the same character; this keeps "</script>" out of the page.
const json = JSON.stringify(data).replace(/</g, '\\u003c');

const html = fs.readFileSync(page, 'utf8');
const block = /(<script type="application\/json" id="players-data">)[\s\S]*?(<\/script>)/;
if (!block.test(html)) throw new Error('index.html has no players-data block.');
fs.writeFileSync(page, html.replace(block, (m, open, close) => open + json + close));
console.log(`Embedded ${data.players.length} players from ${path.basename(src)} (${Math.round(json.length / 1024)} KB).`);
