// Pull exactly the TUNING values the engine files reference, verbatim, as JSON.
import { readFileSync, writeFileSync } from 'node:fs'
import { TUNING } from 'file:///D:/NFL%20game%20test/src/core/tuning.ts'

const root = 'D:/NFL game test/src/core/'
const files = ['playEngine.ts', 'gameEngine.ts', 'coachAI.ts', 'depthChart.ts']
const refs = new Set<string>()
for (const f of files) {
  const src = readFileSync(root + f, 'utf8')
  for (const m of src.matchAll(/TUNING\.([a-zA-Z]+)\.([a-zA-Z]+)/g)) refs.add(`${m[1]}.${m[2]}`)
}
// used by our adapter / neutral coach
for (const extra of ['coach.passPlayShare', 'roster.replacementRating']) refs.add(extra)

const out: Record<string, Record<string, unknown>> = {}
for (const ref of [...refs].sort()) {
  const [section, key] = ref.split('.') as [string, string]
  const value = (TUNING as any)[section]?.[key]
  if (value === undefined) throw new Error(`missing ${ref}`)
  ;(out[section] ??= {})[key] = value
}
const json = JSON.stringify(out)
writeFileSync(process.argv[2]!, json)
console.log('sections', Object.keys(out).join(','), 'keys', refs.size, 'bytes', json.length)
