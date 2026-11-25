// Данные сущности «Шасси танка» + работа с LocalStorage.
// Один и тот же ключ используется в CRUD-панели (ЛР 6) и на сайте (ЛР 7).
export const STORAGE_KEY = 'tank_presets';
export const SELECTED_KEY = 'tank_selected';

// Поля-числа сущности и допустимые диапазоны
export const FIELDS = [
    { key: 'thrust',   label: 'Тяга',           min: 0.001, max: 1 },
    { key: 'friction', label: 'Трение',         min: 0.5,   max: 0.999 },
    { key: 'maxSpeed', label: 'Макс. скорость', min: 0.1,   max: 20 },
];

export function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

export function generateId() {
    return crypto.randomUUID(); // работает на localhost и по HTTPS
}

export function load() {
    try {
        const arr = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(arr) ? arr : [];
    } catch (e) {
        console.error('Ошибка парсинга LocalStorage:', e);
        return [];
    }
}

export function save(items) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        return true;
    } catch (e) {
        console.error('Не удалось сохранить в LocalStorage:', e);
        return false;
    }
}

export function validate(data) {
    const errors = {};
    const name = String(data.name ?? '').trim();
    if (!name) errors.name = 'Название обязательно';
    else if (name.length > 30) errors.name = 'Не длиннее 30 символов';

    for (const f of FIELDS) {
        const raw = data[f.key];
        const n = Number(raw);
        if (raw === '' || raw == null || !Number.isFinite(n) || n < f.min || n > f.max) {
            errors[f.key] = `${f.label}: от ${f.min} до ${f.max}`;
        }
    }
    return { valid: Object.keys(errors).length === 0, errors };
}
