// ===== Cold Harbor — Macrodata Refinement =====
// A large grid of numbers (bigger than the screen — pan with arrow keys).
// A hidden "scary" cluster reacts when you feel it out (grow, shrink, shake,
// jitter, sway, wobble, spin, bounce, droop, stretch, flicker), tied to one of
// the four tempers. Box-select the cluster and drag it into one of the five
// bins to refine it.

const nums = [];   // every number tile in the grid
const temp = [];   // the current target cluster (the "scary" numbers)

const CELL = 50;   // px per tile
let viewCols = 0, viewRows = 0;   // tiles that fit on screen
let gridCols = 0, gridRows = 0;   // tiles in the full (pannable) grid
let offsetX = 0, offsetY = 0;     // current pan offset (px, <= 0)
let grid = null;

let clusterCol = 0, clusterRow = 0; // top-left tile of the cluster
let currentTemper = null;
let currentReaction = null;         // which wacky behavior this cluster does
let revealed = false;

let pulseTimer = null;
const PULSE_INTERVAL = 15000; // every 15s the cluster acts up on its own
const PULSE_DURATION = 3000;  // how long the auto-pulse lasts

// Four tempers, each with a pool of wacky behaviors that fit its mood.
// A random one is picked per file so the numbers do different things.
const TEMPERS = [
    { code: 'WO', reactions: ['shrink', 'droop', 'flicker'] },   // Woe — despair
    { code: 'FC', reactions: ['increase', 'bounce', 'spin'] },   // Frolic — joy
    { code: 'DR', reactions: ['shake', 'jitter', 'flicker'] },   // Dread — fear
    { code: 'MA', reactions: ['sway', 'wobble', 'stretch'] },    // Malice — rage
];

const container = document.getElementById('main');

// ---------- build the (larger-than-screen) grid ----------
function addNums() {
    if (grid) grid.remove();   // keep the feed overlay; only replace the grid
    nums.length = 0;

    viewCols = Math.max(1, Math.floor(container.clientWidth / CELL));
    viewRows = Math.max(1, Math.floor(container.clientHeight / CELL));
    gridCols = viewCols + 8; // extra room to pan into
    gridRows = viewRows + 8;

    grid = document.createElement('div');
    grid.className = 'grid';
    grid.style.gridTemplateColumns = `repeat(${gridCols}, ${CELL}px)`;
    grid.style.gridAutoRows = `${CELL}px`;

    for (let i = 0; i < gridCols * gridRows; i++) {
        const el = document.createElement('div');
        el.className = 'number';
        el.textContent = Math.floor(Math.random() * 10);
        el.style.animationDelay = (Math.random() * 4).toFixed(2) + 's';
        nums.push(el);
        grid.appendChild(el);
    }

    container.appendChild(grid);
    offsetX = 0;
    offsetY = 0;
    applyPan();
}

// ---------- pick the target cluster ----------
function initNums() {
    temp.length = 0;
    revealed = false;

    const clusterW = 2 + Math.floor(Math.random() * 2); // 2-3 wide
    const clusterH = 2 + Math.floor(Math.random() * 2); // 2-3 tall
    clusterCol = Math.floor(Math.random() * Math.max(1, gridCols - clusterW));
    clusterRow = Math.floor(Math.random() * Math.max(1, gridRows - clusterH));

    for (let r = 0; r < clusterH; r++) {
        for (let c = 0; c < clusterW; c++) {
            const idx = (clusterRow + r) * gridCols + (clusterCol + c);
            const el = nums[idx];
            if (el) {
                el.classList.add('select');
                temp.push(el);
            }
        }
    }

    currentTemper = TEMPERS[Math.floor(Math.random() * TEMPERS.length)];
    currentReaction = currentTemper.reactions[
        Math.floor(Math.random() * currentTemper.reactions.length)
    ];
    temp.forEach((el) => {
        el.addEventListener('mouseenter', () => reactStart(el, currentReaction));
        el.addEventListener('mouseleave', () => reactStop(el));
    });

    startPulseTimer();
    updateReveal();
}

// every PULSE_INTERVAL the whole cluster reacts on its own for a moment,
// so it's easier to spot without hovering
function startPulseTimer() {
    if (pulseTimer) clearInterval(pulseTimer);
    pulseTimer = setInterval(pulseCluster, PULSE_INTERVAL);
}

function pulseCluster() {
    temp.forEach((el) => reactStart(el, currentReaction));
    setTimeout(() => temp.forEach((el) => reactStop(el)), PULSE_DURATION);
}

// ---------- panning ----------
function applyPan() {
    if (grid) grid.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
}

function clampPan() {
    const minX = Math.min(0, container.clientWidth - gridCols * CELL);
    const minY = Math.min(0, container.clientHeight - gridRows * CELL);
    offsetX = Math.max(minX, Math.min(0, offsetX));
    offsetY = Math.max(minY, Math.min(0, offsetY));
}

document.addEventListener('keydown', (event) => {
    const step = CELL;
    if (event.key === 'ArrowLeft') offsetX += step;
    else if (event.key === 'ArrowRight') offsetX -= step;
    else if (event.key === 'ArrowUp') offsetY += step;
    else if (event.key === 'ArrowDown') offsetY -= step;
    else return;
    event.preventDefault();
    clampPan();
    applyPan();
});

// ---------- the "numbers do things" reactions ----------
function reactStart(el, reaction) {
    reactStop(el);
    el._reacting = true;

    // font-size reactions rely on the CSS transition, no animation loop needed
    if (reaction === 'increase') {
        el.style.fontSize = '42px';
        return;
    }
    if (reaction === 'shrink') {
        el.style.fontSize = '9px';
        return;
    }

    // everything else animates transform/opacity — pause the idle float so the
    // inline transform isn't overridden by the float animation
    el.classList.add('reacting');
    let t = 0;
    let angle = 0;
    let dir = 1;

    const loop = () => {
        if (!el._reacting) return;
        t += 1;

        switch (reaction) {
            case 'shake': {
                const x = (Math.random() - 0.5) * 5;
                const y = (Math.random() - 0.5) * 5;
                el.style.transform = `translate(${x}px, ${y}px)`;
                break;
            }
            case 'jitter': { // frantic — shakes hard and twitches
                const x = (Math.random() - 0.5) * 11;
                const y = (Math.random() - 0.5) * 11;
                const r = (Math.random() - 0.5) * 12;
                el.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;
                break;
            }
            case 'sway': {
                angle += dir;
                if (angle > 6 || angle < -6) dir *= -1;
                el.style.transform = `rotate(${angle}deg)`;
                break;
            }
            case 'wobble': { // wide angry rock, slightly enlarged
                angle += dir * 1.5;
                if (angle > 16 || angle < -16) dir *= -1;
                el.style.transform = `rotate(${angle}deg) scale(1.12)`;
                break;
            }
            case 'spin': { // full continuous rotation
                angle = (angle + 7) % 360;
                el.style.transform = `rotate(${angle}deg)`;
                break;
            }
            case 'bounce': { // hops up and down
                const y = -Math.abs(Math.sin(t * 0.15)) * 12;
                el.style.transform = `translateY(${y}px)`;
                break;
            }
            case 'droop': { // sinks down, sad
                const y = 7 + Math.sin(t * 0.08) * 3;
                el.style.transform = `translateY(${y}px) scale(0.9)`;
                break;
            }
            case 'stretch': { // squash and stretch
                const s = Math.sin(t * 0.2);
                el.style.transform = `scale(${1 + s * 0.45}, ${1 - s * 0.3})`;
                break;
            }
            case 'flicker': { // glitchy CRT flicker
                el.style.opacity = Math.random() < 0.5 ? '0.2' : '1';
                el.style.transform = `translate(${(Math.random() - 0.5) * 3}px, 0)`;
                break;
            }
        }

        el._raf = requestAnimationFrame(loop);
    };
    loop();
}

function reactStop(el) {
    el._reacting = false;
    if (el._raf) cancelAnimationFrame(el._raf);
    el.classList.remove('reacting');
    el.style.transform = '';
    el.style.fontSize = '';
    el.style.opacity = '';
}

// ---------- reveal (logo = test button) ----------
function updateReveal() {
    const label = document.getElementById('temperLabel');
    nums.forEach((n) => n.classList.remove('revealed'));
    if (revealed) {
        temp.forEach((el) => el.classList.add('revealed'));
        if (label) label.textContent = 'TEMPER: ' + currentTemper.code;
    } else if (label) {
        label.textContent = '';
    }
}

function panToCluster() {
    offsetX = -(clusterCol * CELL) + (container.clientWidth / 2 - CELL);
    offsetY = -(clusterRow * CELL) + (container.clientHeight / 2 - CELL);
    clampPan();
    applyPan();
}

const logo = document.getElementById('logo');
if (logo) {
    logo.addEventListener('click', () => {
        revealed = !revealed;
        updateReveal();
        if (revealed) panToCluster();
    });
}

// ---------- selecting + dragging ----------
let mode = null; // 'select' | 'drag'
let startX, startY;
let selectingBox = null;
let ghost = null;

container.addEventListener('mousedown', (event) => {
    // stop the browser from starting a native text selection over the tiles
    event.preventDefault();

    const onSelected =
        event.target.classList.contains('number') &&
        event.target.classList.contains('selected');
    const anySelected = document.querySelectorAll('.number.selected').length > 0;

    if (onSelected && anySelected) {
        startDrag(event);
    } else {
        startBoxSelect(event);
    }
});

function startBoxSelect(event) {
    mode = 'select';
    startX = event.clientX;
    startY = event.clientY;

    nums.forEach((n) => n.classList.remove('selected'));

    selectingBox = document.createElement('div');
    selectingBox.className = 'selecting-box';
    selectingBox.style.left = startX + 'px';
    selectingBox.style.top = startY + 'px';
    document.body.appendChild(selectingBox);
}

function updateBoxSelect(event) {
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    selectingBox.style.width = Math.abs(dx) + 'px';
    selectingBox.style.height = Math.abs(dy) + 'px';
    selectingBox.style.left = Math.min(startX, event.clientX) + 'px';
    selectingBox.style.top = Math.min(startY, event.clientY) + 'px';

    const boxRect = selectingBox.getBoundingClientRect();
    nums.forEach((number) => {
        const itemRect = number.getBoundingClientRect();
        const intersecting = !(
            boxRect.top > itemRect.bottom ||
            boxRect.bottom < itemRect.top ||
            boxRect.right < itemRect.left ||
            boxRect.left > itemRect.right
        );
        number.classList.toggle('selected', intersecting);
    });
}

function startDrag(event) {
    mode = 'drag';
    const selected = document.querySelectorAll('.number.selected');
    ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.textContent = Array.from(selected).map((n) => n.textContent).join(' ');
    document.body.appendChild(ghost);
    moveGhost(event);
}

function moveGhost(event) {
    ghost.style.left = event.clientX + 'px';
    ghost.style.top = event.clientY + 'px';
}

function binIndexUnder(event) {
    const el = document.elementFromPoint(event.clientX, event.clientY);
    if (!el) return -1;
    const bin = el.closest('.bin');
    if (!bin) return -1;
    return Array.from(document.querySelectorAll('.bin')).indexOf(bin);
}

function highlightBin(index) {
    document.querySelectorAll('.bin').forEach((bin, i) => {
        bin.classList.toggle('bin-hover', i === index);
    });
}

document.addEventListener('mousemove', (event) => {
    if (mode === 'select') {
        updateBoxSelect(event);
    } else if (mode === 'drag') {
        moveGhost(event);
        highlightBin(binIndexUnder(event));
    }
});

document.addEventListener('mouseup', (event) => {
    if (mode === 'select') {
        if (selectingBox) selectingBox.remove();
        selectingBox = null;
    } else if (mode === 'drag') {
        if (ghost) ghost.remove();
        ghost = null;
        highlightBin(-1);
        const binIndex = binIndexUnder(event);
        if (binIndex !== -1) dropIntoBin(binIndex);
    }
    mode = null;
});

// Enter refines into the first unfinished bin
document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    let binIndex = binPct.findIndex((p) => p < 100);
    if (binIndex === -1) binIndex = 0;
    dropIntoBin(binIndex);
});

// ---------- refining ----------
function dropIntoBin(binIndex) {
    const selected = Array.from(document.querySelectorAll('.number.selected'));
    if (selected.length === 0) return;

    const correct =
        selected.length === temp.length &&
        selected.every((el) => temp.includes(el));

    if (correct) {
        const box = document.querySelectorAll('.bin')[binIndex].querySelector('.box');
        animateIntoBox(selected, box);
        if (wsReady) {
            // authoritative: server records it in the DB and broadcasts to everyone
            sendRefine(binIndex, selected.length);
        } else {
            // offline fallback so single-player still works
            applyLocalRefine(binIndex, selected.length);
        }
        setTimeout(() => {
            addNums();
            initNums();
        }, 800);
    } else {
        container.classList.add('reject');
        setTimeout(() => container.classList.remove('reject'), 300);
        selected.forEach((el) => el.classList.remove('selected'));
    }
}

// Open the box's flaps, then fly the selected numbers into the top opening.
function animateIntoBox(selectedElements, box) {
    box.classList.add('open');

    const endRect = box.getBoundingClientRect();
    const targetX = endRect.left + endRect.width / 2;
    const targetY = endRect.top + 8; // the opening at the top of the box

    let lastDone = 0;

    selectedElements.forEach((el, index) => {
        const startRect = el.getBoundingClientRect();
        const clone = el.cloneNode(true);
        clone.classList.remove('selected', 'revealed');

        clone.style.position = 'fixed';
        clone.style.left = `${startRect.left}px`;
        clone.style.top = `${startRect.top}px`;
        clone.style.width = `${startRect.width}px`;
        clone.style.height = `${startRect.height}px`;
        clone.style.margin = '0';
        clone.style.transition = 'left 0.85s cubic-bezier(0.45,0,0.7,1), top 0.85s cubic-bezier(0.45,0,0.7,1), transform 0.85s ease-in, opacity 0.85s ease-in';
        clone.style.zIndex = 1000;
        clone.style.pointerEvents = 'none';
        clone.style.animation = 'none';
        document.body.appendChild(clone);

        // stagger the tiles so they stream into the box one after another
        const delay = index * 100;
        setTimeout(() => {
            clone.style.left = `${targetX}px`;
            clone.style.top = `${targetY}px`;
            clone.style.transform = 'scale(0.15)';
            clone.style.opacity = '0';
        }, delay + 20);

        const done = delay + 900;
        lastDone = Math.max(lastDone, done);
        setTimeout(() => clone.remove(), done);
    });

    // close the flaps back down once the last tile has dropped in
    setTimeout(() => box.classList.remove('open'), lastDone + 150);
}

// ================= multiplayer (shared global goal) =================
// The five bins ARE the global progress: everyone's refinements land in the
// same Postgres-backed bins, updated live over WebSocket.
let BIN_TARGET = 100000;
let ws = null;
let wsReady = false;

const binPct = [0, 0, 0, 0, 0];         // current bin fill %, authoritative from server
const localRefined = [0, 0, 0, 0, 0];   // offline fallback counts

function connect() {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${proto}//${location.host}`);

    ws.addEventListener('open', () => { wsReady = true; });

    ws.addEventListener('message', (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }
        if (msg.type === 'state' || msg.type === 'refined') {
            BIN_TARGET = msg.binTarget;
            renderBins(msg.bins);
        }
    });

    ws.addEventListener('close', () => {
        wsReady = false;
        setTimeout(connect, 2000); // auto-reconnect
    });
    ws.addEventListener('error', () => { try { ws.close(); } catch (e) {} });
}

function sendRefine(bin, count) {
    if (wsReady && ws) ws.send(JSON.stringify({ type: 'refine', bin, count }));
}

// offline single-player fallback
function applyLocalRefine(bin, count) {
    localRefined[bin] = Math.min(BIN_TARGET, localRefined[bin] + count);
    renderBins(localRefined.map((r, idx) => ({
        idx, refined: r, pct: Math.min(100, (r / BIN_TARGET) * 100),
    })));
}

function renderBins(bins) {
    const binEls = document.querySelectorAll('.bin');
    bins.forEach((b) => {
        binPct[b.idx] = b.pct;
        const binEl = binEls[b.idx];
        if (!binEl) return;
        const fill = binEl.querySelector('.fill');
        const pctEl = binEl.querySelector('.pct');
        fill.style.width = b.pct + '%';
        pctEl.textContent = formatPct(b.pct);
        const full = b.pct >= 100;
        fill.classList.toggle('complete', full);
        binEl.querySelector('.box').classList.toggle('full', full);
        binEl.title = `${b.refined.toLocaleString()} / ${BIN_TARGET.toLocaleString()} macrodata`;
    });
}

function formatPct(p) {
    if (p >= 100) return '100%';
    if (p >= 10) return p.toFixed(0) + '%';
    if (p >= 1) return p.toFixed(1) + '%';
    return p.toFixed(2) + '%';
}

// ---------- start ----------
addNums();
initNums();
connect();
