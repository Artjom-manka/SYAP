// Canvas-виджет (ЛР 5): только отрисовка и ввод. Логика — в ядре (Game).
import { Game, Level, DEFAULT_LEVEL } from './core.js';
import { updateHud } from './hud.js';

const FRAME_MS = 1000 / 60;
const GAME_KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];

export function initWidget(canvas) {
    const ctx = canvas.getContext('2d');
    const keys = {};
    let game = null;
    let preset = null;
    let accumulator = 0;
    let last = performance.now();

    function applyPreset() {
        if (!game || !preset) return;
        const t = game.tank;
        // Применяем только те параметры, которые есть у Tank в ядре
        for (const key of ['thrust', 'friction', 'maxSpeed']) {
            if (key in t) t[key] = preset[key];
        }
    }

    function createGame() {
        game = new Game(new Level(DEFAULT_LEVEL));
        accumulator = 0;
        // размер холста по размеру лабиринта
        const w = Math.max(...game.walls.map((r) => r.x + r.w));
        const h = Math.max(...game.walls.map((r) => r.y + r.h));
        if (Number.isFinite(w) && Number.isFinite(h)) { canvas.width = w; canvas.height = h; }
        applyPreset();
    }

    function readInput() {
        return {
            up: keys.w === true || keys.arrowup === true,
            down: keys.s === true || keys.arrowdown === true,
            left: keys.a === true || keys.arrowleft === true,
            right: keys.d === true || keys.arrowright === true,
        };
    }

    function render() {
        ctx.fillStyle = '#0a0a0e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#5a5a5f';
        for (const w of game.walls) ctx.fillRect(w.x, w.y, w.w - 1, w.h - 1);

        const { tank } = game;
        ctx.save();
        ctx.translate(tank.x, tank.y);
        ctx.rotate((tank.angle * Math.PI) / 180);
        ctx.fillStyle = '#288cff';
        ctx.beginPath();
        ctx.arc(0, 0, tank.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a5fa8';
        ctx.fillRect(0, -tank.radius * 0.15, tank.radius * 1.4, tank.radius * 0.3);
        ctx.restore();

        if (game.status !== null) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(game.status, canvas.width / 2, canvas.height / 2);
        }
    }

    function loop(now) {
        const delta = Math.min(now - last, 100);
        last = now;
        accumulator += delta;
        while (accumulator >= FRAME_MS) {
            if (game.status === null) game.step(FRAME_MS / 1000, readInput());
            accumulator -= FRAME_MS;
        }
        render();
        updateHud(game, preset ? preset.name : 'стандарт');
        requestAnimationFrame(loop);
    }

    // Клавиатура
    addEventListener('keydown', (e) => {
        if (e.target.closest?.('input, textarea')) return;
        const k = e.key.toLowerCase();
        keys[k] = true;
        if (GAME_KEYS.includes(k)) e.preventDefault();
        if (k === 'r') createGame();
    });
    addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

    // Сенсорные кнопки (мобильные)
    document.querySelectorAll('.touch-btn').forEach((btn) => {
        const key = btn.dataset.key;
        const set = (v) => (e) => { keys[key] = v; e.preventDefault(); };
        btn.addEventListener('pointerdown', set(true));
        ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, set(false)));
    });

    createGame();
    requestAnimationFrame(loop);

    return {
        setPreset(item) { preset = item; applyPreset(); },
        restart: createGame,
    };
}
