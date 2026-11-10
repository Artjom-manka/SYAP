import assert from 'node:assert/strict';

import { Rect } from './js/rect.js';
import { distance, circleIntersectsRect, closestPointOnRect } from './js/geometry.js';
import { Level, DEFAULT_LEVEL } from './js/level.js';
import { Tank } from './js/tank.js';
import { Game } from './js/game.js';
import { SessionStore } from './js/session_store.js';
import { STATUS, TANK, TIME_LIMIT_SECONDS, ALLOWED_STATUSES } from './js/constants.js';

const results = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        results.push(`OK   ${name}`);
        passed++;
    } catch (e) {
        results.push(`FAIL ${name} - ${e.message}`);
        failed++;
    }
}

test('Rect geometry', () => {
    const r = new Rect(10, 20, 30, 40);
    assert.equal(r.left, 10);
    assert.equal(r.right, 40);
    assert.equal(r.top, 20);
    assert.equal(r.bottom, 60);
    assert.deepEqual(r.center, [25, 40]);
});

test('Rect move returns new object', () => {
    const r = new Rect(0, 0, 10, 10);
    const r2 = r.move(5, 5);
    assert.equal(r.x, 0);
    assert.equal(r2.x, 5);
    assert.notEqual(r, r2);
});

test('Rect colliderect', () => {
    const a = new Rect(0, 0, 10, 10);
    const b = new Rect(5, 5, 10, 10);
    assert.equal(a.colliderect(b), true);
    const c = new Rect(20, 20, 5, 5);
    assert.equal(a.colliderect(c), false);
});

test('Rect collidepoint', () => {
    const r = new Rect(10, 10, 20, 20);
    assert.equal(r.collidepoint(15, 15), true);
    assert.equal(r.collidepoint(10, 10), true);
    assert.equal(r.collidepoint(30, 30), false);
});

test('distance 3-4-5', () => {
    assert.equal(distance(0, 0, 3, 4), 5);
});

test('closestPointOnRect inside', () => {
    const r = new Rect(0, 0, 10, 10);
    assert.deepEqual(closestPointOnRect(5, 5, r), [5, 5]);
});

test('closestPointOnRect outside', () => {
    const r = new Rect(0, 0, 10, 10);
    assert.deepEqual(closestPointOnRect(-5, 5, r), [0, 5]);
});

test('circleIntersectsRect touch', () => {
    const r = new Rect(10, 0, 10, 10);
    assert.equal(circleIntersectsRect(5, 5, 5, r), true);
});

test('circleIntersectsRect no hit', () => {
    const r = new Rect(100, 100, 10, 10);
    assert.equal(circleIntersectsRect(0, 0, 5, r), false);
});

test('Level validate ok', () => {
    const r = Level.validate(DEFAULT_LEVEL);
    assert.equal(r.ok, true);
});

test('Level validate empty', () => {
    const r = Level.validate({});
    assert.equal(r.ok, false);
});

test('Level validate two spawns', () => {
    const r = Level.validate({ grid: ['SS', '##'] });
    assert.equal(r.ok, false);
    assert.match(r.message, /Больше одной/);
});

test('Level validate bad row length', () => {
    const r = Level.validate({ grid: ['###', '##'] });
    assert.equal(r.ok, false);
});

test('Level fromJSON ok', () => {
    const text = JSON.stringify({ name: 'T', tile_size: 40, grid: ['#S#', '###'] });
    const level = Level.fromJSON(text);
    assert.equal(level.name, 'T');
});

test('Level fromJSON broken', () => {
    assert.throws(() => Level.fromJSON('{not json'), /Ошибка парсинга JSON/);
});

test('Level buildWalls count', () => {
    const level = new Level(DEFAULT_LEVEL);
    const walls = level.buildWalls();
    assert.equal(walls.length, 46);
});

test('Level getStartPosition', () => {
    const level = new Level(DEFAULT_LEVEL);
    const [x, y] = level.getStartPosition();
    assert.equal(x, 60);
    assert.equal(y, 60);
});

test('Tank initial state', () => {
    const t = new Tank(100, 200);
    assert.equal(t.x, 100);
    assert.equal(t.y, 200);
    assert.equal(t.vx, 0);
    assert.equal(t.vy, 0);
    assert.equal(t.angle, 0);
});

test('Tank thrust forward', () => {
    const t = new Tank(0, 0);
    t.move({ up: true }, []);
    assert.ok(t.vx < 0);
});

test('Tank rotation', () => {
    const t = new Tank(0, 0);
    t.move({ right: true }, []);
    assert.equal(t.angle, TANK.ROTATION_SPEED);
    t.move({ left: true }, []);
    assert.equal(t.angle, 0);
});

test('Tank friction reduces speed', () => {
    const t = new Tank(0, 0);
    t.move({ up: true }, []);
    const v1 = Math.hypot(t.vx, t.vy);
    t.move({}, []);
    const v2 = Math.hypot(t.vx, t.vy);
    assert.ok(v2 < v1);
});

test('Tank maxSpeed cap', () => {
    const t = new Tank(0, 0);
    for (let i = 0; i < 100; i++) t.move({ up: true }, []);
    const speed = Math.hypot(t.vx, t.vy);
    assert.ok(speed <= t.maxSpeed + 1e-9);
});

test('Tank collision rollback', () => {
    const t = new Tank(50, 50);
    t.radius = 10;
    const wall = new Rect(55, 40, 100, 100);
    const res = t.tryMove(10, 0, [wall]);
    assert.equal(res.moved, false);
    assert.equal(t.x, 50);
    assert.equal(t.vx, 0);
});

test('Tank free move', () => {
    const t = new Tank(50, 50);
    t.radius = 10;
    const res = t.tryMove(5, 0, []);
    assert.equal(res.moved, true);
    assert.equal(t.x, 55);
});

test('Tank clampToBounds left edge', () => {
    const t = new Tank(0, 0);
    t.radius = 10;
    t.x = -50;
    t.vx = -3;
    const corrected = t.clampToBounds(800, 640);
    assert.equal(corrected, true);
    assert.equal(t.x, 10);
    assert.equal(t.vx, 0);
});

test('Game start from level', () => {
    const g = new Game(new Level(DEFAULT_LEVEL));
    assert.equal(g.tank.x, 60);
    assert.equal(g.tank.y, 60);
    assert.equal(g.status, null);
});

test('Game step accumulates time', () => {
    const g = new Game(new Level(DEFAULT_LEVEL));
    g.step(0.1, {});
    g.step(0.1, {});
    assert.ok(Math.abs(g.timeElapsed - 0.2) < 1e-9);
});

test('Game TIME_UP by timeout', () => {
    const g = new Game(new Level(DEFAULT_LEVEL));
    g.step(TIME_LIMIT_SECONDS + 1, {});
    assert.equal(g.status, STATUS.TIME_UP);
});

test('Game no step after finish', () => {
    const g = new Game(new Level(DEFAULT_LEVEL));
    g.finishByUser(STATUS.INTERRUPTED);
    g.step(100, { up: true });
    assert.equal(g.status, STATUS.INTERRUPTED);
    assert.equal(g.timeElapsed, 0);
});

test('Game toSessionRecord rounding', () => {
    const g = new Game(new Level(DEFAULT_LEVEL), { playerName: 'Артём' });
    g.step(3.1415, {});
    g.win();
    const rec = g.toSessionRecord();
    assert.equal(rec.timeSec, 3.1);
    assert.equal(rec.status, STATUS.WIN);
    assert.equal(rec.playerName, 'Артём');
});

test('SessionStore add valid', () => {
    const s = new SessionStore();
    const r = s.add({ timeSec: 15, alerts: 0, status: STATUS.WIN, playerName: 'Артём' });
    assert.equal(r.ok, true);
    assert.equal(r.sessionId, 1);
    assert.equal(s.all().length, 1);
});

test('SessionStore add empty name rejected', () => {
    const s = new SessionStore();
    const r = s.add({ timeSec: 10, alerts: 0, status: STATUS.WIN, playerName: '' });
    assert.equal(r.ok, false);
    assert.ok(r.issues.some((m) => m.includes('имя')));
});

test('SessionStore add bad status rejected', () => {
    const s = new SessionStore();
    const r = s.add({ timeSec: 10, alerts: 0, status: 'Странно', playerName: 'X' });
    assert.equal(r.ok, false);
});

test('SessionStore leaderboard sorting', () => {
    const s = new SessionStore();
    s.add({ timeSec: 10, alerts: 0, status: STATUS.WIN, playerName: 'A' });
    s.add({ timeSec: 30, alerts: 0, status: STATUS.WIN, playerName: 'B' });
    s.add({ timeSec: 20, alerts: 0, status: STATUS.WIN, playerName: 'C' });
    const top = s.leaderboard();
    assert.deepEqual(top.map((r) => r.playerName), ['B', 'C', 'A']);
});

test('SessionStore personalStats', () => {
    const s = new SessionStore();
    s.add({ timeSec: 10, alerts: 1, status: STATUS.WIN, playerName: 'A' });
    s.add({ timeSec: 20, alerts: 2, status: STATUS.INTERRUPTED, playerName: 'A' });
    s.add({ timeSec: 30, alerts: 0, status: STATUS.WIN, playerName: 'B' });
    const st = s.personalStats('A');
    assert.equal(st.sessions, 2);
    assert.equal(st.totalTime, 30);
    assert.equal(st.bestTime, 20);
    assert.equal(st.totalAlerts, 3);
});

test('ALLOWED_STATUSES length', () => {
    assert.equal(ALLOWED_STATUSES.length, 5);
    assert.ok(ALLOWED_STATUSES.includes(STATUS.WIN));
});

console.log('\n=== Results ===\n');
for (const line of results) console.log(line);
console.log(`\nPassed: ${passed} / Failed: ${failed} / Total: ${passed + failed}`);
if (failed > 0) process.exitCode = 1;