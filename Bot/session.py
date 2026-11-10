import json
from pathlib import Path
from config import SESSION_DIR

def _session_path(user_id: int) -> Path:
    return SESSION_DIR / f"{user_id}.json"

def create_new_session(user_id: int) -> dict:
    return {
        "state": "MENU",
        "name": None,
        "subscribed": False,
        "screen_message_id": None,
        "screen_chat_id": None,
    }

def load_session(user_id: int) -> dict:
    path = _session_path(user_id)
    if not path.exists():
        return create_new_session(user_id)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save_session(user_id: int, data: dict) -> None:
    path = _session_path(user_id)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)