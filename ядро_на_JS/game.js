import { Tank } from './tank.js';
import { Level, DEFAULT_LEVEL } from './level.js';
import { GAME, STATUS, TIME_LIMIT_SECONDS } from './constants.js';

export class Game {
    constructor(level, options = {}) {
        this.level = level ?? new Level(DEFAULT_LEVEL);
        this.walls = this.level.buildWalls();

        const [sx, sy] = this.level.getStartPosition();
        this.tank = new Tank(sx, sy);

        this.timeElapsed = 0;
        this.status = null;
        this.sessionSaved = false;
        this.playerName = options.playerName ?? 'Unknown';

        this.windowWidth = options.width ?? GAME.WINDOW_WIDTH;
        this.windowHeight = options.height ?? GAME.WINDOW_HEIGHT;
    }

    step(dtSeconds, controls) {
        if (this.status !== null) return this.status;

        this.timeElapsed += dtSeconds;

        this.tank.move(controls, this.walls);
        this.tank.clampToBounds(this.windowWidth, this.windowHeight);

        if (this.timeElapsed >= TIME_LIMIT_SECONDS) {
            this.status = STATUS.TIME_UP;
        }
        return this.status;
    }

    finishByUser(reason = STATUS.INTERRUPTED) {
        if (this.status !== null) return this.status;
        this.status = reason;
        return this.status;
    }

    win() {
        if (this.status !== null) return this.status;
        this.status = STATUS.WIN;
        return this.status;
    }

    toSessionRecord() {
        return {
            timeSec: Number(this.timeElapsed.toFixed(1)),
            alerts: 0,
            status: this.status ?? STATUS.EXIT,
            playerName: this.playerName,
        };
    }
}