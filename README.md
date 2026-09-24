# Auction Block

A 1v1 NFL auction game in a single HTML file. Two GMs bid on real 2025 players for six slots
(QB, RB, WR, TE, FLEX, DEF), then the rosters play a full game snap by snap, revealed a quarter at a time.

## Play

- **On one device:** open `index.html` in a browser. It works straight from disk, offline, and the
  player list is built in.
- **Online with a friend:** both open the page, one picks *Host online* and shares the code, the
  other picks *Join online*. Online play needs internet access to cdn.jsdelivr.net and 0.peerjs.com.
  Served from a website (e.g. Netlify), the host also gets an invite link.

## The simulation

Games run the Cornerstone play-by-play engine, compiled from its own TypeScript source, with every
player rated from Madden NFL 26 (the end of the 2025 season) on the engine's scale; tight ends, for
now, from their 2025 production. Each player gets the ball as often as he did in 2025 and plays mostly
to his 2025 production: his grade is 70% his real line, 30% his Madden rating, and a great back shows
it in breakaway runs. A DEF pick is that team's real defense. QB and DEF swing games the most; a star
RB, WR, TE or FLEX is worth about a 60% win on his own. `engine-tools/` rebuilds and checks
all of it; see [engine-tools/README.md](engine-tools/README.md).

## Files

| Path | What it is |
|---|---|
| `index.html` | The whole game: page, engine, ratings, and a built-in copy of the player file. |
| `nfl_auction_players.json` | 2025 player stats (nflverse). Rebuild the page's copy with `node engine-tools/embed-players.js`. |
| `engine-tools/` | Engine build, Madden ratings, equivalence and accuracy checks. |
