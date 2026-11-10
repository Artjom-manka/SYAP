import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

BOT_TOKEN = (os.getenv("BOT_TOKEN") or "").strip()
SCORES_CSV = BASE_DIR / "agent_logs.csv"
EVENTS_LOG = BASE_DIR / "game_flight.log"
SESSION_DIR = BASE_DIR / "sessions"
SESSION_DIR.mkdir(exist_ok=True)

TIME_LIMIT_SECONDS = 300
ALLOWED_STATUSES = ("Победа", "Прервано", "Выход", "Поимка", "Время вышло")

_admin_raw = (os.getenv("ADMIN_ID") or "0").strip()
try:
    ADMIN_ID = int(_admin_raw) if _admin_raw else 0
except ValueError:
    ADMIN_ID = 0