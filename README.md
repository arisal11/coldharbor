# Cold Harbor

A multiplayer [Severance](https://en.wikipedia.org/wiki/Severance_(TV_series))-inspired
**macrodata refinement** game. Find the "scary" cluster of numbers (they grow,
shake, spin, flicker…), box-select them, and drag them into a bin to refine them.

It's a **shared, global effort**: everyone online works toward refining
**500,000 macrodata** across five bins (100,000 each). Every refinement — from
any player — is saved to Postgres and broadcast live, so the bins at the bottom
show the group's global progress filling in real time.

## Stack

- **Node + Express** — serves the static client and the HTTP server
- **`ws`** — WebSockets for real-time sync across sessions
- **Postgres** (`pg`) — persistent, shared progress

## Run

Requires Node 18+ and a running Postgres.

```bash
createdb coldharbor   # once
npm install
npm start
```

Then open **http://localhost:3000**. Open it in a second tab/browser to see the
live multiplayer sync — refine in one and watch the other update.

By default the server connects to the local `coldharbor` database; in
production set `DATABASE_URL` (e.g. an AWS RDS connection string). To reset the
global goal: `psql -d coldharbor -c "UPDATE bins SET refined = 0;"`

## Play

- **Find the cluster** — hover the grid; the target numbers react. Every 15s they
  also act up on their own. Arrow keys pan the larger-than-screen grid.
- **Refine** — draw a box over the cluster, then drag the selection into a bin
  (or press **Enter**). Correct clusters fly into the box; its flaps open and close.
- **Reveal (testing)** — click the logo to highlight the current cluster + temper.

## Tuning

`server.js` has the goal constants at the top (`GOAL`, `BIN_COUNT`, `MAX_REFINE`).
