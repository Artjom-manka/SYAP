import { Rect } from './rect.js';
import { GAME } from './constants.js';

export const DEFAULT_LEVEL = {
    name: 'Default',
    tile_size: 40,
    grid: [
        '####################',
        '#S.................#',
        '#..................#',
        '#..................#',
        '####################',
    ],
    player: { angle: 0 },
};

export class Level {
    constructor(config) {
        this.name = config.name ?? 'Unnamed';
        this.tileSize = config.tile_size ?? GAME.TILE_SIZE;
        this.grid = config.grid;
        this.player = config.player ?? {};
    }

    static validate(config) {
        if (!config || typeof config !== 'object') {
            return { ok: false, message: 'Конфиг пустой' };
        }
        const grid = config.grid;
        if (!Array.isArray(grid) || grid.length === 0) {
            return { ok: false, message: "Нет поля 'grid' или оно пустое" };
        }
        const width = grid[0].length;
        for (let i = 0; i < grid.length; i++) {
            if (typeof grid[i] !== 'string' || grid[i].length !== width) {
                return { ok: false, message: `Строка ${i} разной длины` };
            }
        }
        let spawnCount = 0;
        for (const row of grid) {
            for (const ch of row) if (ch === 'S') spawnCount++;
        }
        if (spawnCount === 0) return { ok: false, message: 'Нет точки спавна (S)' };
        if (spawnCount > 1) return { ok: false, message: 'Больше одной точки спавна' };
        return { ok: true, message: 'OK' };
    }

    static fromJSON(text) {
        let config;
        try {
            config = JSON.parse(text);
        } catch (e) {
            throw new Error(`Ошибка парсинга JSON: ${e.message}`);
        }
        const check = Level.validate(config);
        if (!check.ok) {
            throw new Error(`Уровень не прошёл валидацию: ${check.message}`);
        }
        return new Level(config);
    }

    buildWalls() {
        const walls = [];
        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid[row].length; col++) {
                if (this.grid[row][col] === '#') {
                    walls.push(new Rect(
                        col * this.tileSize,
                        row * this.tileSize,
                        this.tileSize,
                        this.tileSize,
                    ));
                }
            }
        }
        return walls;
    }

    getStartPosition() {
        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid[row].length; col++) {
                if (this.grid[row][col] === 'S') {
                    return [
                        col * this.tileSize + this.tileSize / 2,
                        row * this.tileSize + this.tileSize / 2,
                    ];
                }
            }
        }
        return [this.tileSize, this.tileSize];
    }
}