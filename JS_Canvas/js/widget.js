import { Game } from '../../inertial_tanks_js/js/game.js';
import { Level, DEFAULT_LEVEL } from '../../inertial_tanks_js/js/level.js';
import { Tank } from '../../inertial_tanks_js/js/tank.js';
import { GAME, STATUS, TIME_LIMIT_SECONDS } from '../../inertial_tanks_js/js/constants.js';
import { createScenarios } from './scenarios.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');

const VISIBLE_RADIUS = 260;
const FRAME_MS = 1000 / 60;

const hud = {
    status: document.querySelector('#status'),
    time: document.querySelector('#time'),
    speed: document.querySelector('#speed'),
    pos: document.querySelector('#pos'),
    angle: document.querySelector('#angle'),
    walls: document.querySelector('#walls'),
};

let game = null;
let walls = [];
let fog = true;
let frozen = false;
let boost = 1;
let accumulator = 0;
let last = performance.now();

const keys = {};

function createGame() {
    game = new Game(new Level(DEFAULT_LEVEL), { playerName: 'Player' });
    walls = game.walls;
    accumulator = 0;
}

function readInput() {
    return {
        up: keys.w === true || keys.arrowup === true,
        down: keys.s === true || keys.arrowdown === true,
        left: keys.a === true || keys.arrowleft === true,
        right: keys.d === true || keys.arrowright === true,
    };
}

function drawBackground() {
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function inRadius(x, y, cx, cy, r) {
    return Math.hypot(x - cx, y - cy) <= r;
}

function drawWalls(cx, cy) {
    ctx.fillStyle = '#5a5a5f';
    for (const w of walls) {
        if (!fog || inRadius(w.centerx, w.centery, cx, cy, VISIBLE_RADIUS)) {
            ctx.fillRect(w.x, w.y, w.w - 1, w.h - 1);
        }
    }
}

function drawTank(tank) {
    const { x, y, angle, radius } = tank;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((angle * Math.PI) / 180);

    ctx.fillStyle = '#288cff';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1a5fa8';
    ctx.fillRect(0, -radius * 0.15, radius * 1.4, radius * 0.3);

    ctx.restore();
}

function drawVisibility(cx, cy) {
    if (!fog) return;
    const gradient = ctx.createRadialGradient(cx, cy, 40, cx, cy, VISIBLE_RADIUS);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawIndicator(tank) {
    const speed = Math.hypot(tank.vx, tank.vy);
    if (speed < 0.5) return;

    const alpha = Math.min(1, speed / 3);
    ctx.strokeStyle = `rgba(255, 200, 60, ${alpha.toFixed(3)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tank.x, tank.y - tank.radius - 12, 6 + speed * 2, 0, Math.PI * 2);
    ctx.stroke();
}

function render() {
    drawBackground();
    if (!game) return;

    const { tank } = game;
    drawWalls(tank.x, tank.y);
    drawTank(tank);
    drawIndicator(tank);
    drawVisibility(tank.x, tank.y);

    if (game.status !== null) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(game.status, canvas.width / 2, canvas.height / 2);
    }
}

function updateHud() {
    if (!game) return;
    const t = game.tank;
    hud.status.textContent = game.status ?? 'идёт';
    hud.time.textContent = `${game.timeElapsed.toFixed(1)} с`;
    hud.speed.textContent = Math.hypot(t.vx, t.vy).toFixed(2);
    hud.pos.textContent = `${t.x.toFixed(0)}, ${t.y.toFixed(0)}`;
    hud.angle.textContent = `${t.angle.toFixed(0)}°`;
    hud.walls.textContent = String(walls.length);
}

function step() {
    if (!game || game.status !== null) return;
    if (frozen) return;

    const steps = Math.max(1, Math.round(boost));
    for (let i = 0; i < steps; i++) {
        game.step(FRAME_MS / 1000, readInput());
        if (game.status !== null) break;
    }
}

function loop(now) {
    const deltaMs = Math.min(now - last, 100);
    last = now;
    accumulator += deltaMs;

    while (accumulator >= FRAME_MS) {
        step();
        accumulator -= FRAME_MS;
    }

    render();
    updateHud();
    requestAnimationFrame(loop);
}

addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        e.preventDefault();
    }
    if (k === 'r') restart();
});

addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

function restart() {
    createGame();
}

const scenarios = createScenarios({
    getGame: () => game,
    restart,
    setFrozen: (v) => { frozen = v; },
    setBoost: (v) => { boost = v; },
    toggleFog: () => { fog = !fog; },
    getFog: () => fog,
});

window.Tanks = { get game() { return game; }, scenarios };

for (const btn of document.querySelectorAll('[data-scenario]')) {
    btn.addEventListener('click', () => {
        const fn = scenarios[btn.dataset.scenario];
        if (typeof fn === 'function') fn();
    });
}

createGame();
requestAnimationFrame(loop);