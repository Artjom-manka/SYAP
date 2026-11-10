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
node selftest.js
Про интерфейс. В этой версии только ядро — без отрисовки и ввода:
его можно проверить целиком в консоли, без браузера.

Ключевые отличия от Python-версии (ЛР 1–2)
Аспект	Python (ЛР 1–2)	JavaScript (ЛР 4)
Модули	import Tank, import Labirint	ES-модули import … from './js/x.js'
Прямоугольники	pygame.Rect	собственный класс Rect (move/colliderect/collidepoint)
FSM статуса	session_saved + ветвления	switch/явное состояние status
Физика	thrust, friction, max_speed	те же константы в constants.js
Данные уровня	levelPlayer.json + file_manager.validate_level	Level.fromJSON() с той же валидацией
Хранение сессий	запись в CSV	SessionStore в памяти (ядро чистое)

Отрисовка	цикл в main.py	не реализована — ядро от неё не зависит
Возможности ядра
☑ Классы Tank, Level, Game, SessionStore — независимые, каждый в своём модуле
☑ geometry.distance(x1, y1, x2, y2) — расстояние по теореме Пифагора (Math.hypot)
☑ geometry.circleIntersectsRect — коллизия «круг vs прямоугольник» по ближайшей точке
☑ Rect.move() возвращает новый объект — оригинал не мутируется
☑ Раздельное движение по осям — скольжение вдоль стен, защита от застревания
☑ Tank.clampToBounds — зажатие в границах окна (аналог main.py)
☑ FSM статуса игры: INTERRUPTED / EXIT / WIN / TIME_UP + блокировка после финала
☑ Загрузка уровня из JSON с валидацией (try/catch + проверка полей)
☑ SessionStore — валидация записи, лидерборд, персональная статистика

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
