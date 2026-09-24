import { TUNING } from './tuning'

/**
 * NFLVERSE S2-S3. A real distribution stored as quantiles on `TUNING.distributions.p`: the value at
 * probability `u`, interpolated linearly between grid points. The engine passes u = rng.next() and
 * rounds the result to the yard, which returns the integer the data had. Pure: no draw happens here.
 */
export function quantileAt(values: readonly number[], u: number): number {
  const grid = TUNING.distributions.p
  for (let index = 1; index < grid.length; index += 1) {
    const high = grid[index] as number
    if (u <= high) {
      const low = grid[index - 1] as number
      const t = high === low ? 0 : (u - low) / (high - low)
      const from = values[index - 1] as number
      return from + t * ((values[index] as number) - from)
    }
  }
  return values[values.length - 1] as number
}

/** The cell of `limits` (each an inclusive upper bound) that `value` falls in; past the last, the last. */
export function cellOf(limits: readonly number[], value: number): number {
  const index = limits.findIndex((limit) => value <= limit)
  return index < 0 ? limits.length - 1 : index
}
