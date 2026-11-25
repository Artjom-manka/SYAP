import { load, save, escapeHtml, generateId, validate, FIELDS, SELECTED_KEY, STORAGE_KEY } from './storage.js';

const form = document.querySelector('#create-form');
const tbody = document.querySelector('#presets tbody');
const filter = document.querySelector('#filterSpeed');
const filterVal = document.querySelector('#filterVal');
const counter = document.querySelector('#counter');

let items = load();
let editingId = null;

// ---------- Read ----------
function visibleItems() {
    return items.filter((i) => Number(i.maxSpeed) <= Number(filter.value));
}

function viewRow(item) {
    return `
    <tr data-id="${escapeHtml(item.id)}">
        <td>${escapeHtml(item.name)}</td>
        <td>${Number(item.thrust)}</td>
        <td>${Number(item.friction)}</td>
        <td>${Number(item.maxSpeed)}</td>
        <td><div class="actions">
            <button class="btn-edit" data-id="${escapeHtml(item.id)}" title="Изменить">✎</button>
            <button class="btn-delete" data-id="${escapeHtml(item.id)}" title="Удалить">✕</button>
        </div></td>
    </tr>`;
}

function editRow(item) {
    const num = (f) => `<td><input name="${f.key}" type="number" value="${Number(item[f.key])}"
        min="${f.min}" max="${f.max}" step="any" required></td>`;
    return `
    <tr data-id="${escapeHtml(item.id)}" class="editing">
        <td><input name="name" value="${escapeHtml(item.name)}" maxlength="30" required></td>
        ${FIELDS.map(num).join('')}
        <td>
            <div class="actions">
                <button class="btn-save" data-id="${escapeHtml(item.id)}" title="Сохранить">✓</button>
                <button class="btn-cancel" data-id="${escapeHtml(item.id)}" title="Отмена">✕</button>
            </div>
            <div class="row-error"></div>
        </td>
    </tr>`;
}

function render() {
    const list = visibleItems();
    filterVal.textContent = filter.value;
    tbody.innerHTML = list.length
        ? list.map((i) => (i.id === editingId ? editRow(i) : viewRow(i))).join('')
        : '<tr><td colspan="5" class="empty">Записей нет</td></tr>';
    counter.textContent = `Показано ${list.length} из ${items.length}`;
}

// ---------- Create ----------
function showFormErrors(errors) {
    form.querySelectorAll('.error').forEach((span) => {
        span.textContent = errors[span.dataset.for] ?? '';
    });
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const { valid, errors } = validate(data);
    showFormErrors(errors);
    if (!valid) return;

    items.push({
        id: generateId(),
        name: data.name.trim(),
        thrust: Number(data.thrust),
        friction: Number(data.friction),
        maxSpeed: Number(data.maxSpeed),
    });
    save(items);
    form.reset();
    render();
});

// ---------- Update / Delete: делегирование событий на <tbody> ----------
function startEdit(id) { editingId = id; render(); }
function cancelEdit() { editingId = null; render(); }

function saveEdit(id) {
    const row = tbody.querySelector(`tr[data-id="${CSS.escape(id)}"]`);
    const data = {};
    row.querySelectorAll('input').forEach((inp) => { data[inp.name] = inp.value; });
    const { valid, errors } = validate(data);
    if (!valid) {
        row.querySelector('.row-error').textContent = Object.values(errors).join('; ');
        return;
    }
    items = items.map((i) => (i.id === id ? {
        ...i,
        name: data.name.trim(),
        thrust: Number(data.thrust),
        friction: Number(data.friction),
        maxSpeed: Number(data.maxSpeed),
    } : i));
    editingId = null;
    save(items);
    render();
}

function confirmDelete(id) {
    const item = items.find((i) => i.id === id);
    if (!item || !confirm(`Удалить «${item.name}»?`)) return;
    items = items.filter((i) => i.id !== id);
    if (localStorage.getItem(SELECTED_KEY) === id) localStorage.removeItem(SELECTED_KEY);
    save(items);
    render();
}

tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.classList.contains('btn-edit')) startEdit(id);
    else if (btn.classList.contains('btn-delete')) confirmDelete(id);
    else if (btn.classList.contains('btn-save')) saveEdit(id);
    else if (btn.classList.contains('btn-cancel')) cancelEdit();
});

// ---------- Фильтр ----------
filter.addEventListener('input', render);

// Изменения из другой вкладки
addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) { items = load(); render(); }
});

render();
