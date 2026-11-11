# inertial_tanks_js — ядро Inertial Tanks на JavaScript

Порт игрового ядра Inertial Tanks с Python/Pygame (ЛР 1–2) на **JavaScript (ES6+)**.
Сохраняются та же физика, те же коллизии и та же логика сессий, что и в Python-версии,
но полностью без отрисовки. Ядро работает в Node.js и проверяется автотестами —
без браузера, без Canvas, без Pygame.

---

## Что внутри

### 1. Объектно-ориентированная структура

Каждая игровая сущность вынесена в отдельный модуль:

- **`Tank`** — управляемая сущность: позиция, скорость, угол, инерция, коллизии.
- **`Level`** — сетка уровня: тайлы, стены, точка спавна, загрузка и валидация JSON.
- **`Game`** — игровой цикл без отрисовки: шаг симуляции, статус партии, финал.
- **`SessionStore`** — записи сессий, лидерборд, персональная статистика.
- **`Rect`** — собственный аналог `pygame.Rect` (без Pygame).
- **`geometry`** — математические расчёты: расстояния, коллизия «круг vs прямоугольник».

### 2. Инерциальная физика (порт `Tank.move`)

Тяга идёт по направлению угла, трение гасит скорость постепенно, а не мгновенно:

- **`thrust = 0.3`** — приращение скорости за кадр при нажатой клавише.
- **`friction = 0.98`** — множитель, применяемый к скорости каждый кадр.
- **`maxSpeed = 3`** — верхний предел скорости.
- **`VELOCITY_EPSILON = 0.01`** — скорости меньше порога обнуляются, чтобы танк «не дрейфовал» бесконечно.

**Движение по осям раздельно** — `tryMove(vx, 0)` затем `tryMove(0, vy)`.
Если танк упирается в стену боком, обнуляется только одна компонента скорости,
а вторая продолжает работать — танк **скользит вдоль стены**, а не застревает.

### 3. Коллизии

- **`Rect`** — собственный класс прямоугольника с методами `colliderect`, `collidepoint`, `move`.
  Ключевое: `move()` возвращает **новый** объект, а не мутирует существующий —
  так «пробное» движение не портит текущее состояние.
- **Круг vs прямоугольник** — коллизия танка со стеной по ближайшей точке
  прямоугольника к центру танка. Это дешевле полной проверки AABB-пересечения
  и точнее для круглого танка.

### 4. Конечный автомат статуса игры

Четыре терминальных состояния и одно рабочее:

| Статус | Когда наступает |
|---|---|
| `null` (идёт) | `new Game(...)` |
| `STATUS.INTERRUPTED` | `game.finishByUser()` — игрок прервал |
| `STATUS.EXIT` | выход из игры |
| `STATUS.WIN` | `game.win()` — победа |
| `STATUS.TIME_UP` | `timeElapsed ≥ TIME_LIMIT_SECONDS` |

После установки любого терминального статуса `step()` больше не меняет состояние —
это защита от «доигрывания» партии после финала (аналог `session_saved = True` в `main.py`).

### 5. Загрузка уровня из JSON с валидацией

`Level.fromJSON(text)` делает `JSON.parse` в `try/catch` и затем `Level.validate`:
проверяет, что `grid` — массив строк одинаковой длины, что в нём ровно одна `S`.
Битый JSON или невалидный уровень выбрасывают `Error` с понятным сообщением —
без «тихого» падения.

### 6. Записи сессий и статистика

`SessionStore` хранит записи в памяти (ядро не пишет файлы):
- `add(record)` — валидирует и добавляет запись, возвращает `{ ok, sessionId }` или `{ ok: false, issues }`.
- `leaderboard(limit)` — топ по времени.
- `personalStats(name)` — количество сессий, суммарное время, лучшее время, суммарные тревоги.

---

## Структура проекта
inertial_tanks_js/ # ядро — только логика, без интерфейса
├── package.json # {"type": "module"} — запуск ES-модулей в Node
├── README.md # этот файл
├── selftest.js # самопроверка: 35 проверок
└── js/
├── constants.js # все параметры игры (аналог config.py)
├── rect.js # Rect — порт pygame.Rect
├── geometry.js # расстояния, ближайшая точка, круг-vs-прямоугольник
├── level.js # Level — сетка, стены, спавн, JSON-валидация
├── tank.js # Tank — тяга, трение, вращение, коллизии
├── game.js # Game — игровой цикл без отрисовки
└── session_store.js # SessionStore — записи, лидерборд, статистика

---

Для проверки кода нам нужно:

1. перейти в нужную папку
   ```
   cd C:\Users\vyzik\source\repos\TankiJS\TankiJS
   ```
2. ввести следующую команду для запуска
   ```
    node selftest.js
   ```
И выводится результат
```
=== Results ===

OK   Rect geometry
OK   Rect move returns new object
OK   Rect colliderect
OK   Rect collidepoint
OK   distance 3-4-5
OK   closestPointOnRect inside
OK   closestPointOnRect outside
OK   circleIntersectsRect touch
OK   circleIntersectsRect no hit
OK   Level validate ok
OK   Level validate empty
OK   Level validate two spawns
OK   Level validate bad row length
OK   Level fromJSON ok
OK   Level fromJSON broken
OK   Level buildWalls count
OK   Level getStartPosition
OK   Tank initial state
OK   Tank thrust forward
OK   Tank rotation
OK   Tank friction reduces speed
OK   Tank maxSpeed cap
OK   Tank collision rollback
OK   Tank free move
OK   Tank clampToBounds left edge
OK   Game start from level
OK   Game step accumulates time
OK   Game TIME_UP by timeout
OK   Game no step after finish
OK   Game toSessionRecord rounding
OK   SessionStore add valid
OK   SessionStore add empty name rejected
OK   SessionStore add bad status rejected
OK   SessionStore leaderboard sorting
OK   SessionStore personalStats
OK   ALLOWED_STATUSES length

Passed: 36 / Failed: 0 / Total: 36
```
Формулы
Движение и инерция (порт Tank.move)
```
angle = (angle + rotationSpeed * (right - left)) mod 360
rad   = angle * π / 180

up:   vx -= thrust * cos(rad);  vy -= thrust * sin(rad)
down: vx += thrust * cos(rad);  vy += thrust * sin(rad)

vx *= friction;  vy *= friction
если |vx| < eps → 0;  если |vy| < eps → 0

speed = sqrt(vx² + vy²)
```
если speed > maxSpeed → масштабирование до maxSpeed

Коллизия «круг vs прямоугольник» (порт Tank.check_circle)
```
closestX = clamp(cx, rect.left, rect.right)
closestY = clamp(cy, rect.top,  rect.bottom)
пересечение ⇔ (cx - closestX)² + (cy - closestY)² ≤ radius²
```
Пороговое условие по времени
```
timeElapsed ≥ TIME_LIMIT_SECONDS (300 с)  →  STATUS.TIME_UP
Скольжение вдоль стены
text
tryMove(vx, 0) → при коллизии только vx = 0
tryMove(0, vy) → при коллизии только vy = 0
```
