// The game's hooks into Cornerstone's play engine: who gets the ball, nothing else. build.mjs
// patches the two allocation sites (targets, backs' carries) to consult HOOKS.game. While it is
// null (every call without opts.neutral) the patched code runs exactly the original, so the
// engine is Cornerstone's, draw for draw. game.ts sets it for the length of a game call; the
// engine is synchronous, so calls never interleave.
export const HOOKS: { game: any } = { game: null }
