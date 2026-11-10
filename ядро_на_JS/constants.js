export const GAME = Object.freeze({
    WINDOW_WIDTH: 800,
    WINDOW_HEIGHT: 640,
    TILE_SIZE: 40,
    WALL_THICKNESS: 20,
    FPS: 60,
});

export const TANK = Object.freeze({
    SCALE: 0.07,
    SPEED: 1.5,
    THRUST: 0.3,
    FRICTION: 0.98,
    ROTATION_SPEED: 3,
    MAX_SPEED: 3,
    VELOCITY_EPSILON: 0.01,
});

export const STATUS = Object.freeze({
    WIN: 'Победа',
    INTERRUPTED: 'Прервано',
    EXIT: 'Выход',
    CAUGHT: 'Поимка',
    TIME_UP: 'Время вышло',
});

export const ALLOWED_STATUSES = Object.freeze([
    STATUS.WIN,
    STATUS.INTERRUPTED,
    STATUS.EXIT,
    STATUS.CAUGHT,
    STATUS.TIME_UP,
]);

export const TIME_LIMIT_SECONDS = 300;