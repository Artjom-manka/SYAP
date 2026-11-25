// Навигация (бургер) и инициализация главной страницы.
import { initHotbar } from './hotbar.js';

const burger = document.querySelector('#burger');
const menu = document.querySelector('#mobile-menu');
if (burger && menu) {
    burger.addEventListener('click', () => menu.classList.toggle('open'));
    menu.querySelectorAll('.mobile-link').forEach((link) =>
        link.addEventListener('click', () => menu.classList.remove('open')));
}

function drawError(canvas, err) {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a0e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff5c5c';
    ctx.font = '18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Ошибка загрузки модулей ядра!', canvas.width / 2, canvas.height / 2 - 16);
    ctx.fillText(err.message.slice(0, 60), canvas.width / 2, canvas.height / 2 + 16);
}

const canvas = document.querySelector('#game');
if (canvas) {
    let widget = null;
    try {
        const { initWidget } = await import('./widget-integration.js'); // динамический импорт: сбой ядра не ломает хотбар
        widget = initWidget(canvas);
    } catch (err) {
        console.error(err);
        drawError(canvas, err);
    }
    initHotbar(document.querySelector('#hotbar'), (item) => widget?.setPreset(item));
}
