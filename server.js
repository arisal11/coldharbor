// ===== Cold Harbor — multiplayer refinement server =====
// Express serves the static client, `ws` syncs a shared, persistent goal:
// refine 500,000 macrodata across five bins (100,000 each). Every refine —
// from anyone — hits Postgres and is broadcast live to all connected refiners.

const path = require('path');
const http = require('http');
const express = require('express');
const { WebSocketServer } = require('ws');
const { Pool } = require('pg');

const GOAL = 500000;
const BIN_COUNT = 5;
const BIN_TARGET = GOAL / BIN_COUNT; // 100,000 per bin
const MAX_REFINE = 64;               // per-event sanity clamp

// ---------- database ----------
// Locally this uses your default Postgres (createdb coldharbor); in production
// set DATABASE_URL to a hosted Postgres (Neon, RDS, ...). Hosted providers
// require TLS, which local Postgres doesn't use, so enable ssl only for URLs
// (with an sslmode=disable escape hatch).
const pool = new Pool(
    process.env.DATABASE_URL
        ? {
              connectionString: process.env.DATABASE_URL,
              ssl: process.env.DATABASE_URL.includes('sslmode=disable')
                  ? false
                  : { rejectUnauthorized: false },
          }
        : { database: 'coldharbor' }
);

async function initDb() {
    await pool.query(`CREATE TABLE IF NOT EXISTS bins (
        idx INTEGER PRIMARY KEY,
        refined INTEGER NOT NULL DEFAULT 0
    )`);
    for (let i = 0; i < BIN_COUNT; i++) {
        await pool.query(
            'INSERT INTO bins (idx, refined) VALUES ($1, 0) ON CONFLICT (idx) DO NOTHING',
            [i]
        );
    }
}

async function snapshot() {
    const { rows } = await pool.query('SELECT idx, refined FROM bins ORDER BY idx');
    const bins = rows.map((r) => ({
        idx: r.idx,
        refined: r.refined,
        pct: Math.min(100, (r.refined / BIN_TARGET) * 100),
    }));
    const total = rows.reduce((sum, r) => sum + r.refined, 0);
    return { goal: GOAL, binTarget: BIN_TARGET, total, bins };
}

// ---------- http + static client ----------
const app = express();
app.use(express.static(path.join(__dirname, 'public')));
const server = http.createServer(app);

// ---------- realtime ----------
const wss = new WebSocketServer({ server });

function broadcast(obj) {
    const msg = JSON.stringify(obj);
    for (const client of wss.clients) {
        if (client.readyState === 1) client.send(msg);
    }
}

wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    // attach the message handler BEFORE any await, or refines that arrive
    // while the initial snapshot is being fetched would be silently dropped
    ws.on('message', async (data) => {
        let msg;
        try { msg = JSON.parse(data); } catch { return; }

        if (msg.type === 'refine') {
            const bin = Number(msg.bin);
            let count = Number(msg.count);
            if (!Number.isInteger(bin) || bin < 0 || bin >= BIN_COUNT) return;
            if (!Number.isFinite(count) || count <= 0) return;
            count = Math.min(Math.floor(count), MAX_REFINE);

            try {
                // atomic, capped increment — safe under concurrent writes
                await pool.query(
                    'UPDATE bins SET refined = LEAST(refined + $1, $2) WHERE idx = $3',
                    [count, BIN_TARGET, bin]
                );
                broadcast({ type: 'refined', ...(await snapshot()) });
            } catch (err) {
                console.error('refine failed:', err.message);
            }
        }
    });

    // initial shared state for the new client
    snapshot()
        .then((s) => {
            if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'state', ...s }));
        })
        .catch((err) => console.error('snapshot failed:', err.message));
});

// drop dead connections
const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
        if (ws.isAlive === false) { ws.terminate(); continue; }
        ws.isAlive = false;
        ws.ping();
    }
}, 30000);
wss.on('close', () => clearInterval(heartbeat));

const PORT = process.env.PORT || 3000;
initDb()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Cold Harbor server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Could not initialize Postgres:', err.message);
        console.error('Is Postgres running, and does the "coldharbor" database exist? (createdb coldharbor)');
        process.exit(1);
    });
