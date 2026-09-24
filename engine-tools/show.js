const o = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8'));
console.log('baseline', JSON.stringify(o.baseline));
for (const pos of ['QB', 'RB', 'WR', 'DEF']) for (const [k, v] of Object.entries(o[pos])) console.log(pos.padEnd(4), k.padEnd(16), 'real', String(v.real).padEnd(7), 'sim', String(v.sim).padEnd(7), 'bias', v.bias.padEnd(7), 'slope', String(v.slope).padEnd(5), 'corr', v.corr, 'mape', v.mape);
