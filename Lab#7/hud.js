// Динамический HUD: значения берутся из объекта game (ядро),
// обновляются через textContent / style.width — DOM-узлы не пересоздаются.
const el = {
    status: document.querySelector('#hud-status'),
    time:   document.querySelector('#hud-time'),
    speed:  document.querySelector('#hud-speed'),
    pos:    document.querySelector('#hud-pos'),
    angle:  document.querySelector('#hud-angle'),
    preset: document.querySelector('#hud-preset'),
    bar:    document.querySelector('#meter-fill'),
    label:  document.querySelector('#hud-label'),
};

let lastState = '';

function stateFor(level) {
    if (level < 0.03) return { cls: 'calm', text: 'СТОИТ' };
    if (level < 0.33) return { cls: 'calm', text: 'СПОКОЙНО' };
    if (level < 0.66) return { cls: 'mid',  text: 'РАЗГОН' };
    return { cls: 'high', text: 'ДРИФТ!' };
}

export function updateHud(game, presetName) {
    const t = game.tank;
    const speed = Math.hypot(t.vx, t.vy);
    const level = Math.min(speed / (t.maxSpeed || 1), 1); // 0.0 … 1.0

    el.status.textContent = game.status ?? 'идёт';
    el.time.textContent = `${game.timeElapsed.toFixed(1)} с`;
    el.speed.textContent = speed.toFixed(2);
    el.pos.textContent = `${t.x.toFixed(0)}, ${t.y.toFixed(0)}`;
    el.angle.textContent = `${t.angle.toFixed(0)}°`;
    el.preset.textContent = presetName;
    el.bar.style.width = `${Math.round(level * 100)}%`;

    const { cls, text } = stateFor(level);
    el.label.textContent = text;
    if (cls !== lastState) {           // классы меняем только при смене состояния
        el.bar.className = `meter-fill ${cls}`;
        el.label.className = `hud-label ${cls}`;
        lastState = cls;
    }
}
