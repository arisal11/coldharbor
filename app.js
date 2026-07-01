// ===== Cold Harbor — Macrodata Refinement =====
// A large grid of numbers (bigger than the screen — pan with arrow keys).
// A hidden "scary" cluster reacts when you feel it out (grow/shrink/shake/sway),
// mapped to one of the four tempers. Box-select the cluster and drag it into
// one of the five bins to refine it.

const nums = [];   // every number tile in the grid
const temp = [];   // the current target cluster (the "scary" numbers)

const CELL = 50;   // px per tile
let viewCols = 0, viewRows = 0;   // tiles that fit on screen
let gridCols = 0, gridRows = 0;   // tiles in the full (pannable) grid
let offsetX = 0, offsetY = 0;     // current pan offset (px, <= 0)
let grid = null;

let clusterCol = 0, clusterRow = 0; // top-left tile of the cluster
let currentTemper = null;
let revealed = false;

const binProgress = [0, 0, 0, 0, 0];

// Four tempers, each mapped to the reaction it produces
const TEMPERS = [
    { code: 'WO', reaction: 'shrink' },   // Woe — despair
    { code: 'FC', reaction: 'increase' }, // Frolic — joy
    { code: 'DR', reaction: 'shake' },    // Dread — fear
    { code: 'MA', reaction: 'sway' },     // Malice — rage
];

const container = document.getElementById('main');

// ---------- build the (larger-than-screen) grid ----------
function addNums() {
    container.innerHTML = '';
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
    temp.forEach((el) => {
        el.addEventListener('mouseenter', () => reactStart(el, currentTemper.reaction));
        el.addEventListener('mouseleave', () => reactStop(el));
    });

    updateReveal();
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

    if (reaction === 'increase') {
        el.style.fontSize = '42px';
    } else if (reaction === 'shrink') {
        el.style.fontSize = '9px';
    } else if (reaction === 'shake') {
        el.classList.add('reacting');
        const loop = () => {
            if (!el._reacting) return;
            const x = (Math.random() - 0.5) * 5;
            const y = (Math.random() - 0.5) * 5;
            el.style.transform = `translate(${x}px, ${y}px)`;
            el._raf = requestAnimationFrame(loop);
        };
        loop();
    } else if (reaction === 'sway') {
        el.classList.add('reacting');
        let angle = 0;
        let dir = 1;
        const loop = () => {
            if (!el._reacting) return;
            angle += dir;
            if (angle > 6 || angle < -6) dir *= -1;
            el.style.transform = `rotate(${angle}deg)`;
            el._raf = requestAnimationFrame(loop);
        };
        loop();
    }
}

function reactStop(el) {
    el._reacting = false;
    if (el._raf) cancelAnimationFrame(el._raf);
    el.classList.remove('reacting');
    el.style.transform = '';
    el.style.fontSize = '';
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
    const bin = el.closest('.container > div');
    if (!bin) return -1;
    return Array.from(document.querySelectorAll('.container > div')).indexOf(bin);
}

function highlightBin(index) {
    document.querySelectorAll('.container > div').forEach((bin, i) => {
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
    let binIndex = binProgress.findIndex((p) => p < 100);
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
        const box = document.querySelectorAll('.container > div')[binIndex];
        animateIntoBox(selected, box);
        fillBin(binIndex);
        setTimeout(() => {
            addNums();
            initNums();
        }, 400);
    } else {
        container.classList.add('reject');
        setTimeout(() => container.classList.remove('reject'), 300);
        selected.forEach((el) => el.classList.remove('selected'));
    }
}

function fillBin(index) {
    const gain = 8 + Math.floor(Math.random() * 12); // 8-19% per refine
    binProgress[index] = Math.min(100, binProgress[index] + gain);

    const bar = document.querySelectorAll('.progress-bar')[index];
    bar.style.width = binProgress[index] + '%';
    bar.textContent = binProgress[index] + '%';
    if (binProgress[index] >= 100) bar.classList.add('complete');
}

function animateIntoBox(selectedElements, targetBox) {
    targetBox.classList.add('open');

    selectedElements.forEach((el, index) => {
        const clone = el.cloneNode(true);
        document.body.appendChild(clone);

        const startRect = el.getBoundingClientRect();
        const endRect = targetBox.getBoundingClientRect();

        clone.style.position = 'fixed';
        clone.style.left = `${startRect.left}px`;
        clone.style.top = `${startRect.top}px`;
        clone.style.width = `${startRect.width}px`;
        clone.style.height = `${startRect.height}px`;
        clone.style.transition = 'all 0.6s ease';
        clone.style.zIndex = 1000;
        clone.style.pointerEvents = 'none';

        requestAnimationFrame(() => {
            clone.style.left = `${endRect.left + endRect.width / 2}px`;
            clone.style.top = `${endRect.top + endRect.height / 2}px`;
            clone.style.opacity = 0;
            clone.style.transform = 'scale(0.4)';
        });

        setTimeout(() => {
            clone.remove();
            if (index === selectedElements.length - 1) {
                targetBox.classList.remove('open');
            }
        }, 600);
    });
}

// ---------- start ----------
addNums();
initNums();
