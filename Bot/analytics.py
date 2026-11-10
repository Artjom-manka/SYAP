import csv
import io
import re
from dataclasses import dataclass
from config import TIME_LIMIT_SECONDS, ALLOWED_STATUSES

@dataclass
class Record:
    session_id: int
    time_sec: float
    alerts: int
    status: str
    name: str = ""

def parse_scores_text(text: str) -> tuple[list[Record], list[str]]:
    records: list[Record] = []
    errors: list[str] = []
    if not text.strip():
        return [], ["Файл пуст"]
    first_line = text.split("\n", 1)[0]
    delimiter = ";" if ";" in first_line else ","
    reader = csv.reader(io.StringIO(text), delimiter=delimiter)
    rows = [row for row in reader if any(cell.strip() for cell in row)]
    if not rows:
        return [], ["Файл пуст"]
    start = 0
    try:
        int(rows[0][0])
    except (ValueError, IndexError):
        start = 1
        
    for line_no, row in enumerate(rows[start:], start=start + 2):
        if len(row) != 5:
            errors.append(f"Строка {line_no}: ожидается 5 полей, получено {len(row)}")
            continue
        session_str, name, time_str, alerts_str, status = (cell.strip() for cell in row)
        try:
            session_id = int(session_str)
            time_sec = float(time_str)
            alerts = int(alerts_str)
        except ValueError:
            errors.append(f"Строка {line_no}: нечисловые значения")
            continue
        if status not in ALLOWED_STATUSES:
            errors.append(f"Строка {line_no}: недопустимый статус '{status}'")
            continue
        records.append(Record(session_id, time_sec, alerts, status, name))
    return records, errors

def parse_log_names(text: str) -> dict[tuple[str, str], str]:
    names: dict[tuple[str, str], str] = {}
    for line in text.splitlines():
        if "Результат сохранён:" in line:
            parts = line.split("|")[-1].split(":")
            if len(parts) > 1:
                data = parts[1].split(",")
                if len(data) >= 2:
                    name = data[0].strip()
                    status = data[1].strip()
                    names[(status, name)] = name
    return names

def verify_record(record: Record) -> list[str]:
    issues: list[str] = []
    if not record.name:
        issues.append("пустое имя игрока")
    if record.time_sec <= 0 or record.time_sec > TIME_LIMIT_SECONDS * 2:
        issues.append("неправдоподобное время сессии")
    if record.alerts < 0:
        issues.append("отрицательное число тревог")
    if record.status not in ALLOWED_STATUSES:
        issues.append("недопустимый статус")
    return issues

def leaderboard(records: list[Record], limit: int = 10) -> list[Record]:
    return sorted(records, key=lambda r: -r.time_sec)[:limit]

def format_leaderboard(records: list[Record]) -> str:
    if not records:
        return "Пока нет записей."
    lines = ["<pre>", "#  Имя/Сессия     Время   Тревоги  Статус"]
    for i, r in enumerate(records, start=1):
        name = r.name or f"Сессия {r.session_id}"
        lines.append(f"{i:<2} {name[:15]:<15} {r.time_sec:>6.1f}с {r.alerts:>7}  {r.status}")
    lines.append("</pre>")
    return "\n".join(lines)

def personal_stats(records: list[Record], name: str) -> str:
    player_records = [r for r in records if r.name == name]
    if not player_records:
        return f"Нет данных для игрока «{name}»."
    total_time = sum(r.time_sec for r in player_records)
    max_time = max(r.time_sec for r in player_records)
    total_alerts = sum(r.alerts for r in player_records)
    
    lines = [
        f"Статистика: {name}",
        f"Сессий: {len(player_records)}",
        f"Суммарно тревог: {total_alerts}",
        f"Общее время в игре: {total_time:.1f} с",
        f"Лучшее время за сессию: {max_time:.1f} с",
    ]
    return "\n".join(lines)

def achievements(records: list[Record], name: str) -> list[str]:
    player = [r for r in records if r.name == name]
    if not player:
        return ["Нет данных для получения достижений."]
        
    max_time = max(r.time_sec for r in player)
    total_time = sum(r.time_sec for r in player)
    
    result = []
    if max_time >= 60:
        result.append("🏃 Спринтер — провел в игре более 60 секунд за раз")
    else:
        result.append("🔒 Спринтер — проведи в игре более 60 секунд за раз")
        
    if total_time >= 180:
        result.append("⏱ Марафонец — суммарное время в игре превысило 3 минуты")
    else:
        result.append("🔒 Марафонец — набери 3 минуты общего времени игры")
        
    return result