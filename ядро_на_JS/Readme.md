# inertial_tanks_js — ядро Inertial Tanks на JavaScript

Порт игрового ядра Inertial Tanks с Python/Pygame (ЛР 1–2) на **JavaScript (ES6+)**:
та же физика, те же коллизии, та же логика сессий — но без отрисовки,
поэтому ядро работает в Node.js и проверяется автотестами.

**Что внутри:**
```
1. **Объектно-ориентированная структура** — классы `Tank`, `Level`, `Game`, `SessionStore` в отдельных модулях
2. **Инерциальная физика** — тяга по направлению `angle`, трение `friction`,
   ограничение `maxSpeed`, гашение малых скоростей через `VELOCITY_EPSILON`;
   движение по осям раздельно (`tryMove(vx, 0)` → `tryMove(0, vy)`) — танк скользит вдоль стены
3. **Коллизии** — собственный `Rect` с `colliderect` / `collidepoint` / `move` (копия, не мутация);
   проверка «круг vs прямоугольник» по ближайшей точке
4. **Конечный автомат статуса игры** — `null → INTERRUPTED / EXIT / WIN / TIME_UP`
   с блокировкой обновлений после финала (`session_saved`)
```

## Структура
```
inertial_tanks_js/ # ядро — только логика, без интерфейса
├── package.json # type: module — запуск ES-модулей в Node
├── README.md
├── selftest.js # самопроверка: 35 проверок (node selftest.js)
└── js/
├── constants.js # все параметры игры (аналог config.py)
├── rect.js # Rect — порт возможностей pygame.Rect
├── geometry.js # Пифагор, ближайшая точка, круг-vs-прямоугольник
├── level.js # Level — сетка, стены, спавн, валидация JSON
├── tank.js # Tank — тяга, трение, вращение, коллизии
├── game.js # Game — игровой цикл без отрисовки
└── session_store.js # SessionStore — записи, лидерборд, статистика
```

# самопроверка (35 проверок: геометрия, физика, FSM, коллизии, JSON, цикл)
=== Results ===
```
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
```
Формулы
Движение и инерция (порт Tank.move):
```
angle = (angle + rotationSpeed * (right - left)) mod 360
rad   = angle * π / 180

up:   vx -= thrust * cos(rad);  vy -= thrust * sin(rad)
down: vx += thrust * cos(rad);  vy += thrust * sin(rad)

vx *= friction;  vy *= friction
если |vx| < eps → 0;  если |vy| < eps → 0

speed = sqrt(vx² + vy²)
если speed > maxSpeed → масштабирование до maxSpeed
Коллизия «круг vs прямоугольник» (порт Tank.check_circle):
```

```
closestX = clamp(cx, rect.left, rect.right)
closestY = clamp(cy, rect.top,  rect.bottom)
пересечение ⇔ (cx - closestX)² + (cy - closestY)² ≤ radius²
```
Пороговое условие по времени:

```
timeElapsed ≥ TIME_LIMIT_SECONDS (300 с)  →  STATUS.TIME_UP
```
Скольжение вдоль стены:
```
tryMove(vx, 0) → при коллизии только vx = 0
tryMove(0, vy) → при коллизии только vy = 0
Таблица состояний игры
Статус	Триггер
null (идёт)	new Game(...)
STATUS.INTERRUPTED	game.finishByUser() (ESC)
STATUS.EXIT	закрытие окна / выход
STATUS.WIN	game.win()
STATUS.TIME_UP	timeElapsed ≥ TIME_LIMIT_SECONDS
```
После установки статуса step() больше не меняет состояние.

Результаты самопроверки
node selftest.js покрывает:

Геометрия Rect — left/right/top/bottom/center, move-копия, colliderect, collidepoint

Геометрия круга — distance, closestPointOnRect, circleIntersectsRect (касание/непересечение)

Валидация уровня — пустой конфиг, две S, строки разной длины, битый JSON

Стены и спавн — buildWalls (46 стен в DEFAULT_LEVEL), getStartPosition

Физика танка — тяга, вращение, трение, maxSpeed, откат при коллизии, зажатие в границах

Игровой цикл — накопление времени, TIME_UP, блокировка step после финала, округление до 0.1

SessionStore — валидация (пустое имя, недопустимый статус), лидерборд, персональная статистика

Константы — ALLOWED_STATUSES содержит 5 статусов

Ожидаемый вывод: все проверки пройдены (failed = 0).
