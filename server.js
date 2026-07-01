// ===== Cold Harbor — multiplayer refinement server =====
// Express serves the static client, `ws` syncs a shared, persistent goal:
// refine 500,000 macrodata across five bins (100,000 each). Every refine —
// from anyone — hits SQLite and is broadcast live to all connected refiners.

const path = require('path');
const http = require('http');
const express = require('express');
const { WebSocketServer } = require('ws');
const { DatabaseSync } = require('node:sqlite');

const GOAL = 500000;
const BIN_COUNT = 5;
const BIN_TARGET = GOAL / BIN_COUNT; // 100,000 per bin
const MAX_REFINE = 64;               // per-event sanity clamp

// ---------- database ----------
const db = new DatabaseSync(path.join(__dirname, 'coldharbor.db'));
db.exec(`CREATE TABLE IF NOT EXISTS bins (
    idx INTEGER PRIMARY KEY,
    refined INTEGER NOT NULL DEFAULT 0
);`);
const seedBin = db.prepare('INSERT OR IGNORE INTO bins (idx, refined) VALUES (?, 0)');
for (let i = 0; i < BIN_COUNT; i++) seedBin.run(i);

const selectBins = db.prepare('SELECT idx, refined FROM bins ORDER BY idx');
const bumpBin = db.prepare('UPDATE bins SET refined = MIN(refined + ?, ?) WHERE idx = ?');

function snapshot() {
    const rows = selectBins.all();
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
const feed = [];   // recent activity, replayed to new joiners
let online = 0;

function broadcast(obj) {
    const msg = JSON.stringify(obj);
    for (const client of wss.clients) {
        if (client.readyState === 1) client.send(msg);
    }
}

function randomHandle() {
    return 'Refiner-' + Math.floor(1000 + Math.random() * 9000);
}

wss.on('connection', (ws) => {
    online++;
    ws.isAlive = true;
    ws.handle = randomHandle();
    ws.on('pong', () => { ws.isAlive = true; });

    ws.send(JSON.stringify({ type: 'state', ...snapshot(), online, you: ws.handle, feed }));
    broadcast({ type: 'online', online });

    ws.on('message', (data) => {
        let msg;
        try { msg = JSON.parse(data); } catch { return; }

        if (msg.type === 'refine') {
            const bin = Number(msg.bin);
            let count = Number(msg.count);
            if (!Number.isInteger(bin) || bin < 0 || bin >= BIN_COUNT) return;
            if (!Number.isFinite(count) || count <= 0) return;
            count = Math.min(Math.floor(count), MAX_REFINE);

            bumpBin.run(count, BIN_TARGET, bin);

            const event = { bin, count, by: ws.handle, at: Date.now() };
            feed.push(event);
            if (feed.length > 12) feed.shift();

            broadcast({ type: 'refined', ...event, ...snapshot(), online });
        }
    });

    ws.on('close', () => {
        online = Math.max(0, online - 1);
        broadcast({ type: 'online', online });
    });
});

// drop dead connections so the online count stays honest
const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
        if (ws.isAlive === false) { ws.terminate(); continue; }
        ws.isAlive = false;
        ws.ping();
    }
}, 30000);
wss.on('close', () => clearInterval(heartbeat));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Cold Harbor server running on http://localhost:${PORT}`);
});
