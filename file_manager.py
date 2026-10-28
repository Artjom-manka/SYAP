import json
import csv
import logging
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
LEVEL_FILE = BASE_DIR / "levelPlayer.json"
LOG_FILE = BASE_DIR / "game_flight.log"
CSV_FILE = BASE_DIR / "agent_logs.csv"

logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


def log_event(message):
    logging.info(message)


def load_config():
    try:
        with open(LEVEL_FILE, "r", encoding="cp1251") as f:
            data = json.load(f)
    except FileNotFoundError:
        print("Файл levelPlayer.json не найден. Используется уровень по умолчанию.")
        log_event("Файл levelPlayer.json не найден")
        return {}
    except json.JSONDecodeError:
        print("Ошибка парсинга levelPlayer.json")
        log_event("Ошибка парсинга levelPlayer.json")
        return {}
    else:
        log_event("Уровень загружен из levelPlayer.json")
        return data


def validate_level(config):
    if not config:
        return False, "Конфиг пустой"

    grid = config.get("grid")
    if not grid:
        return False, "Нет поля 'grid'"

    width = len(grid[0])
    for i, row in enumerate(grid):
        if len(row) != width:
            return False, "Строка " + str(i) + " разной длины"

    spawn_count = 0
    for row in grid:
        for ch in row:
            if ch == "S":
                spawn_count += 1

    if spawn_count == 0:
        return False, "Нет точки спавна (S)"
    if spawn_count > 1:
        return False, "Больше одной точки спавна"

    return True, "OK"


def load_level():
    from levelDefault import DEFAULT_LEVEL

    config = load_config()
    ok, msg = validate_level(config)

    if not ok:
        print("Уровень не прошёл валидацию:", msg)
        log_event("Уровень не прошёл валидацию: " + msg)
        return DEFAULT_LEVEL

    return config


def next_session_number():
    records = read_records()
    if not records:
        return 1
    return len(records)


def save_session(time_sec, alerts, status):
    file_exists = CSV_FILE.exists() and CSV_FILE.stat().st_size > 0
    session_id = next_session_number()

    try:
        with open(CSV_FILE, "a", newline="", encoding="cp1251") as f:
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow(["Сессия", "Время", "Тревоги", "Статус"])
            writer.writerow([session_id, round(time_sec, 1), alerts, status])
    except OSError as e:
        print("Не удалось записать CSV:", e)
        log_event("Ошибка записи CSV: " + str(e))
    else:
        log_event("Результат сохранён: сессия " + str(session_id) + ", " + status)
    finally:
        print("Сохранение результата завершено")


def read_records():
    if not CSV_FILE.exists():
        return []
    try:
        with open(CSV_FILE, "r", encoding="cp1251") as f:
            return list(csv.reader(f))
    except OSError:
        return []