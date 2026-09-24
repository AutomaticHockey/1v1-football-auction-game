export type RNG = {
  next(): number
  int(min: number, max: number): number
  pick<T>(arr: readonly T[]): T
  chance(p: number): boolean
  gauss(mean: number, sd: number): number
  fork(label: string): RNG
}

export function mulberry32(seed: number): RNG {
  const rootSeed = seed >>> 0
  let a = rootSeed
  const next = () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    int(min, max) {
      if (max < min) throw new RangeError('max must be greater than or equal to min')
      return Math.floor(next() * (max - min + 1)) + min
    },
    pick<T>(arr: readonly T[]): T {
      if (arr.length === 0) throw new RangeError('cannot pick from an empty array')
      return arr[Math.floor(next() * arr.length)] as T
    },
    chance(p) {
      return next() < Math.max(0, Math.min(1, p))
    },
    gauss(mean, sd) {
      let u = 0
      let v = 0
      while (u === 0) u = next()
      while (v === 0) v = next()
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    },
    fork(label) {
      let hash = 2166136261 ^ rootSeed
      for (let index = 0; index < label.length; index += 1) {
        hash ^= label.charCodeAt(index)
        hash = Math.imul(hash, 16777619)
      }
      return mulberry32(hash >>> 0)
    },
  }
}
