import { Rect } from './rect.js';
import { circleIntersectsRect, distance } from './geometry.js';
import { TANK, GAME } from './constants.js';

export class Tank {
    constructor(x, y, scale = TANK.SCALE, speed = TANK.SPEED) {
        this.x = Number(x);
        this.y = Number(y);
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.thrust = TANK.THRUST;
        this.friction = TANK.FRICTION;
        this.rotationSpeed = TANK.ROTATION_SPEED;
        this.maxSpeed = TANK.MAX_SPEED;

        this.scale = scale;
        this.speed = speed;

        const approxSpriteWidth = Math.floor(456 * scale);
        this.radius = Math.floor(approxSpriteWidth / 2);
    }

    get centerx() { return this.x; }
    get centery() { return this.y; }

    tryMove(dx, dy, walls) {
        if (dx === 0 && dy === 0) return { moved: false, blockedX: false, blockedY: false };

        const oldX = this.x;
        const oldY = this.y;

        this.x += dx;
        this.y += dy;

        for (const wall of walls) {
            if (circleIntersectsRect(this.x, this.y, this.radius, wall)) {
                this.x = oldX;
                this.y = oldY;
                let blockedX = false, blockedY = false;
                if (dx !== 0) { this.vx = 0; blockedX = true; }
                if (dy !== 0) { this.vy = 0; blockedY = true; }
                return { moved: false, blockedX, blockedY };
            }
        }
        return { moved: true, blockedX: false, blockedY: false };
    }

    move(controls, walls) {
        const { left = false, right = false, up = false, down = false } = controls ?? {};

        if (left) this.angle -= this.rotationSpeed;
        if (right) this.angle += this.rotationSpeed;
        this.angle = ((this.angle % 360) + 360) % 360;

        const rad = (this.angle * Math.PI) / 180;

        if (up) {
            this.vx -= this.thrust * Math.cos(rad);
            this.vy -= this.thrust * Math.sin(rad);
        }
        if (down) {
            this.vx += this.thrust * Math.cos(rad);
            this.vy += this.thrust * Math.sin(rad);
        }

        this.vx *= this.friction;
        this.vy *= this.friction;

        if (Math.abs(this.vx) < TANK.VELOCITY_EPSILON) this.vx = 0;
        if (Math.abs(this.vy) < TANK.VELOCITY_EPSILON) this.vy = 0;

        const speed = Math.hypot(this.vx, this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }

        const resX = this.tryMove(this.vx, 0, walls);
        const resY = this.tryMove(0, this.vy, walls);

        return { resX, resY };
    }

    clampToBounds(width = GAME.WINDOW_WIDTH, height = GAME.WINDOW_HEIGHT) {
        let corrected = false;
        if (this.x - this.radius < 0) { this.x = this.radius; this.vx = 0; corrected = true; }
        if (this.x + this.radius > width) { this.x = width - this.radius; this.vx = 0; corrected = true; }
        if (this.y - this.radius < 0) { this.y = this.radius; this.vy = 0; corrected = true; }
        if (this.y + this.radius > height) { this.y = height - this.radius; this.vy = 0; corrected = true; }
        return corrected;
    }

    get rect() {
        return new Rect(this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
    }

    distanceTo(px, py) {
        return distance(this.x, this.y, px, py);
    }
}