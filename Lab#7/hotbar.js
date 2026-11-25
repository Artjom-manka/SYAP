// Хотбар: карточки шасси из LocalStorage (ключ тот же, что в CRUD).
import { load, escapeHtml, STORAGE_KEY, SELECTED_KEY } from './storage.js';

function formatStats(item) {
    return Object.entries(item)
        .filter(([key]) => key !== 'id' && key !== 'name')
        .map(([key, value]) => `${key}: ${value}`)
        .join(' · ');
}

export function initHotbar(container, onSelect) {
    function render() {
        const items = load();
        const selectedId = localStorage.getItem(SELECTED_KEY);
        if (!items.length) {
            container.innerHTML = '<div class="hotbar-empty">Инвентарь пуст — добавьте шасси на странице «Инвентарь»</div>';
            return;
        }
        container.innerHTML = items.map((item) => `
            <div class="hotbar-card ${item.id === selectedId ? 'selected' : ''}" data-id="${escapeHtml(item.id)}">
                <div class="card-name">${escapeHtml(item.name)}</div>
                <div class="card-stats">${escapeHtml(formatStats(item))}</div>
            </div>`).join('');
    }

    container.addEventListener('click', (e) => {
        const card = e.target.closest('.hotbar-card');
        if (!card) return;
        const item = load().find((i) => i.id === card.dataset.id);
        if (!item) return;
        localStorage.setItem(SELECTED_KEY, item.id);
        render();
        onSelect(item);
    });

    // Карточки обновляются без перезагрузки: событие storage приходит из соседней вкладки
    addEventListener('storage', (e) => { if (e.key === STORAGE_KEY) render(); });
    addEventListener('focus', render);

    render();
    const saved = load().find((i) => i.id === localStorage.getItem(SELECTED_KEY));
    if (saved) onSelect(saved);
}
