// Builds the game's two engine scripts:
//   engine.js  ENGINE: Cornerstone's engine compiled from its own TypeScript (the snapshot in
//              cornerstone/, with patches.mjs applied) plus this game's driver (game.ts).
//   simkit.js  SIMKIT: the roster builder, with ratings.json (Madden ratings on the engine's scale).
// Uses the esbuild in the Cornerstone repo's node_modules; writes only here.
//   node build.mjs          (then node embed-engine.js to put both into ../index.html)
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { applyPatches } from './patches.mjs'
import { computeGrades } from './grades.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
// esbuild from the Cornerstone repo ($CORNERSTONE, else D:/NFL game test), or from ESBUILD_FROM's package.json.
const esbuild = createRequire(process.env.ESBUILD_FROM || path.join(process.env.CORNERSTONE || 'D:/NFL game test', 'package.json'))('esbuild')
const core = path.join(here, 'cornerstone')

// 1. The full TUNING object, evaluated from the snapshot.
function loadTuning() {
  const { outputFiles } = esbuild.buildSync({ entryPoints: [path.join(core, 'tuning.ts')], bundle: true, format: 'cjs', platform: 'node', write: false })
  const module = { exports: {} }
  new Function('module', 'exports', outputFiles[0].text)(module, module.exports)
  return module.exports.TUNING
}
const TUNING = loadTuning()

// 2. Bundle. `sections` null = the whole TUNING (first pass); otherwise only those sections.
async function bundle(sections) {
  const plugin = {
    name: 'cornerstone',
    setup(build) {
      build.onResolve({ filter: /^game:hooks$/ }, () => ({ path: path.join(here, 'hooks.ts') }))
      // depth chart -> generate.ts for one function; the stub avoids the draft and progression tables.
      build.onResolve({ filter: /^\.\/generate$/ }, (args) => (args.importer.startsWith(core) ? { path: path.join(here, 'stubs', 'generate.ts') } : undefined))
      build.onLoad({ filter: /[\\/]cornerstone[\\/][A-Za-z]+\.ts$/ }, (args) => {
        const file = path.basename(args.path)
        if (file === 'tuning.ts' && sections) {
          const pruned = Object.fromEntries(sections.map((s) => [s, TUNING[s]]))
          return { contents: `export const TUNING = ${JSON.stringify(pruned)}\n`, loader: 'ts' }
        }
        return { contents: applyPatches(file, readFileSync(args.path, 'utf8')), loader: 'ts' }
      })
    },
  }
  const result = await esbuild.build({
    entryPoints: [path.join(here, 'game.ts')],
    bundle: true,
    format: 'iife',
    globalName: 'ENGINE',
    target: 'es2020',
    platform: 'neutral',
    charset: 'utf8',
    legalComments: 'none',
    write: false,
    plugins: [plugin],
    define: { __DEVELOPMENT_TRAIT_MEAN__: JSON.stringify(TUNING.progression.developmentTrait.mean) },
  })
  return result.outputFiles[0].text
}

// Which TUNING sections the compiled engine reads. Every use must be `TUNING.section`.
function usedSections(js) {
  const names = new Set()
  for (const m of js.matchAll(/\bTUNING\.([A-Za-z]+)/g)) names.add(m[1])
  const bare = [...js.matchAll(/\bTUNING\b(?!\.)/g)].length
  return { names: [...names].sort(), bare }
}

const first = await bundle(null)
const { names, bare } = usedSections(first)
// The declaration, its export, and nothing else.
if (bare > 3) throw new Error(`TUNING is used ${bare} times without a section name; pruning is unsafe`)
for (const s of names) if (!(s in TUNING)) throw new Error(`unknown TUNING section ${s}`)

// JSON must carry every value exactly (no functions, undefined, NaN or Infinity).
function exact(value, where) {
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error(`${where} is ${value}`)
  if (value === undefined || typeof value === 'function') throw new Error(`${where} is not JSON`)
  if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) exact(v, `${where}.${k}`)
}
for (const s of names) exact(TUNING[s], `TUNING.${s}`)

const js = await bundle(names)
const again = usedSections(js)
if (again.names.join() !== names.join()) throw new Error('pruned build reads different TUNING sections')

const commit = readFileSync(path.join(core, 'SOURCE.txt'), 'utf8').match(/commit (\w{7})/)[1]
const header = `/* ENGINE: Cornerstone (D:\\NFL game test, src/core @ ${commit}) compiled with this game's driver. Built by engine-tools/build.mjs; do not edit here. */\n`
const engine = header + js + 'if (typeof module !== "undefined") module.exports = ENGINE;\n'
writeFileSync(path.join(here, 'engine.js'), engine)
console.log(`engine.js ${Math.round(engine.length / 1024)} KB; TUNING sections: ${names.join(', ')}`)

// 3. simkit.js: SIMKIT with the ratings packed as arrays in ratings.json's key order, and every
// player's and defense's grade (grades.mjs, from the player file and the ratings).
const R = JSON.parse(readFileSync(path.join(here, 'ratings.json'), 'utf8'))
const grades = computeGrades(JSON.parse(readFileSync(path.join(here, '..', 'nfl_auction_players.json'), 'utf8')), R)
if (R.unmatched.length) console.warn(`players with no Madden match (they play as a league-average starter): ${R.unmatched.join('; ')}`)
if (R.production && R.production.length) console.log(`rated from 2025 production, not Madden (ratings-production.mts): ${R.production.length} (${[...new Set(R.production.map((s) => s.split(' ')[0]))].join(', ')})`)
const one = (x) => Math.round(x * 10) / 10
const data = {
  source: R.source,
  keys: R.keys,
  // The league's neutral coach: every tendency at the midpoint, passing at the league's rate.
  coach: { aggressiveness: TUNING.coach.neutral, passBias: TUNING.coach.passPlayShare, tempo: TUNING.coach.neutral, riskTolerance: TUNING.coach.neutral, trustInQB: TUNING.coach.neutral },
  filler: Object.fromEntries(Object.entries(R.filler).map(([slot, f]) => [slot, [one(f.overall), ...f.ratings.map(one)]])),
  players: Object.fromEntries(Object.entries(R.players).map(([id, p]) => [id, [p.pos, p.madden, p.overall, ...p.ratings]])),
  defenses: Object.fromEntries(Object.entries(R.defenses).map(([team, unit]) => [team, unit.map((d) => [d.pos, d.name, d.madden, d.overall, ...d.ratings])])),
  grades: { players: grades.players, defenses: grades.defenses },
}
const simkitSrc = readFileSync(path.join(here, 'simkit.src.js'), 'utf8')
if (!simkitSrc.includes('/*@@RATINGS@@*/null')) throw new Error('simkit.src.js has no ratings placeholder')
const simkit = '/* SIMKIT: built by engine-tools/build.mjs from simkit.src.js and ratings.json; do not edit here. */\n'
  + simkitSrc.replace('/*@@RATINGS@@*/null', () => JSON.stringify(data))
writeFileSync(path.join(here, 'simkit.js'), simkit)
console.log(`simkit.js ${Math.round(simkit.length / 1024)} KB: ${Object.keys(data.players).length} players, ${Object.keys(data.defenses).length} defenses`)
