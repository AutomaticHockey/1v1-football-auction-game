// Puts engine.js and simkit.js (from build.mjs) into ../index.html, between the @@ENGINE markers.
// The first run replaces the hand-ported ENGINE and SIMKIT blocks that came before the markers.
//   node embed-engine.js
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const page = path.join(__dirname, '..', 'index.html');
const BEGIN = '/* @@ENGINE-BEGIN@@: engine-tools/embed-engine.js writes everything down to the end marker (engine.js, then simkit.js). */';
const END = '/* @@ENGINE-END@@ */';
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8').replace(/\r\n/g, '\n').trimEnd();
const code = [read('engine.js'), read('simkit.js')].join('\n');
if (/<\/script|<!--/i.test(code)) throw new Error('the engine code contains "</script" or "<!--", which would break the page');

const lines = fs.readFileSync(page, 'utf8').split('\n');
let from = lines.findIndex(l => l.startsWith('/* @@ENGINE-BEGIN@@'));
let to = lines.findIndex(l => l.startsWith(END));
if (from < 0) {
  // First run: from the PLAY-BY-PLAY ENGINE banner down to the REVEAL: THE GAME banner.
  const engine = lines.findIndex(l => l.trim() === 'PLAY-BY-PLAY ENGINE');
  const reveal = lines.findIndex(l => l.trim() === 'REVEAL: THE GAME');
  if (engine < 1 || reveal < engine) throw new Error('could not find the engine blocks in index.html');
  from = engine - 1;
  to = reveal - 2;
  while (to > from && lines[to].trim() === '') to--;
}
if (from < 0 || to < from) throw new Error('could not find the @@ENGINE markers in index.html');
const out = lines.slice(0, from).concat([BEGIN, code, END], lines.slice(to + 1)).join('\n');

// The page's main script must still parse.
const script = out.match(/<script>\n([\s\S]*?)<\/script>/);
if (!script) throw new Error('no main <script> in index.html');
new vm.Script(script[1], { filename: 'index.html' });
fs.writeFileSync(page, out);
console.log(`index.html: engine block ${Math.round(code.length / 1024)} KB (lines ${from + 1}-${from + code.split('\n').length + 2}); page ${Math.round(out.length / 1024)} KB`);
