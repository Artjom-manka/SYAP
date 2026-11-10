import asyncio
import io
import csv
import logging

from aiogram import Bot, Dispatcher, F
from aiogram.exceptions import TelegramBadRequest
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import Message, CallbackQuery

import config
import analytics
import keyboards
import session as sess

logging.basicConfig(
    filename=config.BASE_DIR / "bot_flight.log",
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

bot = Bot(token=config.BOT_TOKEN)
dp = Dispatcher(storage=MemoryStorage())

class BotState(StatesGroup):
    MENU = State()
    UPLOAD = State()
    WAIT_NAME = State()
    BROADCAST = State()

async def show_screen(chat_id: int, user_id: int, text: str, keyboard) -> None:
    session = sess.load_session(user_id)
    screen_id = session.get("screen_message_id")
    screen_chat = session.get("screen_chat_id")

    if screen_id and screen_chat == chat_id:
        try:
            await bot.edit_message_text(
                text=text,
                chat_id=chat_id,
                message_id=screen_id,
                reply_markup=keyboard,
                parse_mode="HTML"
            )
            return
        except TelegramBadRequest as e:
            if "message is not modified" in str(e):
                return
            logger.info("Экран %s недоступен: %s", screen_id, e)
        except Exception as e:
            logger.info("Не удалось отредактировать экран %s: %s", screen_id, e)

    msg = await bot.send_message(chat_id, text, reply_markup=keyboard, parse_mode="HTML")
    session["screen_message_id"] = msg.message_id
    session["screen_chat_id"] = chat_id
    sess.save_session(user_id, session)

def load_records() -> list[analytics.Record]:
    if not config.SCORES_CSV.exists():
        return []
    try:
        text = config.SCORES_CSV.read_text(encoding="cp1251")
        records, _ = analytics.parse_scores_text(text)
        return records
    except Exception as e:
        logger.error("Ошибка чтения CSV: %s", e)
        return []

def load_log() -> str:
    if not config.EVENTS_LOG.exists():
        return ""
    try:
        return config.EVENTS_LOG.read_text(encoding="utf-8")
    except Exception as e:
        logger.error("Ошибка чтения лога: %s", e)
        return ""

@dp.message(Command("start"))
async def cmd_start(message: Message, state: FSMContext):
    user_id = message.from_user.id
    sess.save_session(user_id, sess.create_new_session(user_id))
    await state.set_state(BotState.MENU)
    await message.answer(
        "Добро пожаловать в бота-аналитика Inertial Tanks!\n"
        "Здесь можно посмотреть таблицу лидеров, личную статистику "
        "и загрузить новые результаты.",
        reply_markup=keyboards.main_menu(),
    )

@dp.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(
        "Команды:\n"
        "/start — главное меню\n"
        "/help — эта справка\n\n"
        "Кнопки:\n"
        "🏆 Топ игроков — таблица рекордов\n"
        "🏅 Мои ачивки — ваши достижения\n"
        "📊 Моя статистика — по имени\n"
        "📤 Загрузить результаты — пришлите CSV или лог\n"
        "🔔 Подписка — уведомления о новых результатах\n"
        "❓ Помощь — это сообщение",
    )

@dp.callback_query(F.data == "menu")
async def cb_menu(callback: CallbackQuery, state: FSMContext):
    await state.set_state(BotState.MENU)
    await show_screen(
        callback.message.chat.id,
        callback.from_user.id,
        "Главное меню:",
        keyboards.main_menu(),
    )
    await callback.answer()

@dp.callback_query(F.data == "top")
async def cb_top(callback: CallbackQuery):
    records = load_records()
    log_text = load_log()
    names = analytics.parse_log_names(log_text)
    for rec in records:
        if not rec.name:
            for (status, name) in names:
                if status == rec.status:
                    rec.name = name
                    break
    text = analytics.format_leaderboard(analytics.leaderboard(records))
    await show_screen(
        callback.message.chat.id,
        callback.from_user.id,
        text,
        keyboards.back_to_menu(),
    )
    await callback.answer()

@dp.callback_query(F.data == "achievements")
async def cb_achievements(callback: CallbackQuery, state: FSMContext):
    session = sess.load_session(callback.from_user.id)
    name = session.get("name")
    if not name:
        await state.set_state(BotState.WAIT_NAME)
        await callback.message.answer(
            "Введите имя игрока, чтобы посмотреть достижения:",
            reply_markup=keyboards.cancel_upload(),
        )
        await callback.answer()
        return
    records = load_records()
    text = f"Ваши достижения, {name}:\n\n" + "\n".join(
        analytics.achievements(records, name)
    )
    await show_screen(
        callback.message.chat.id,
        callback.from_user.id,
        text,
        keyboards.back_to_menu(),
    )
    await callback.answer()

@dp.callback_query(F.data == "stats")
async def cb_stats(callback: CallbackQuery, state: FSMContext):
    session = sess.load_session(callback.from_user.id)
    name = session.get("name")
    if not name:
        await state.set_state(BotState.WAIT_NAME)
        await callback.message.answer(
            "Введите имя игрока, чтобы посмотреть статистику:",
            reply_markup=keyboards.cancel_upload(),
        )
        await callback.answer()
        return
    records = load_records()
    text = analytics.personal_stats(records, name)
    await show_screen(
        callback.message.chat.id,
        callback.from_user.id,
        text,
        keyboards.back_to_menu(),
    )
    await callback.answer()

@dp.callback_query(F.data == "subscribe")
async def cb_subscribe(callback: CallbackQuery):
    session = sess.load_session(callback.from_user.id)
    session["subscribed"] = not session.get("subscribed", False)
    sess.save_session(callback.from_user.id, session)
    status = "включена" if session["subscribed"] else "выключена"
    await callback.answer(f"Подписка {status}", show_alert=True)
    await show_screen(
        callback.message.chat.id,
        callback.from_user.id,
        "Главное меню:",
        keyboards.main_menu(),
    )

@dp.callback_query(F.data == "upload")
async def cb_upload(callback: CallbackQuery, state: FSMContext):
    await state.set_state(BotState.UPLOAD)
    await callback.message.answer(
        "Пришлите файл agent_logs.csv или game_flight.log.\n"
        "Я разберу данные, проверю их и обновлю статистику.",
        reply_markup=keyboards.cancel_upload(),
    )
    await callback.answer()

@dp.callback_query(F.data == "help")
async def cb_help(callback: CallbackQuery):
    await show_screen(
        callback.message.chat.id,
        callback.from_user.id,
        "Кнопки бота:\n"
        "🏆 Топ игроков — лучшие результаты\n"
        "🏅 Мои ачивки — достижения по времени\n"
        "📊 Моя статистика — по вашему имени\n"
        "📤 Загрузить результаты — CSV или лог\n"
        "🔔 Подписка — уведомления\n"
        "❓ Помощь — это сообщение",
        keyboards.back_to_menu(),
    )
    await callback.answer()

@dp.message(StateFilter(BotState.UPLOAD), F.document)
async def handle_upload(message: Message, state: FSMContext):
    doc = message.document
    if not doc.file_name:
        await message.answer("Не удалось определить имя файла.")
        return

    buffer = io.BytesIO()
    await bot.download(doc, destination=buffer)
    raw = buffer.getvalue()

    try:
        text = raw.decode("cp1251")
    except UnicodeDecodeError:
        text = raw.decode("utf-8", errors="ignore")

    if doc.file_name.endswith(".csv"):
        records, errors = analytics.parse_scores_text(text)
    elif doc.file_name.endswith(".log"):
        records, errors = [], []
    else:
        await message.answer("Поддерживаются только .csv и .log")
        return

    verified = []
    for rec in records:
        issues = analytics.verify_record(rec)
        if not issues:
            verified.append(rec)
        else:
            errors.append(f"Сессия {rec.session_id}: {', '.join(issues)}")

    if verified:
        file_exists = config.SCORES_CSV.exists() and config.SCORES_CSV.stat().st_size > 0
        with open(config.SCORES_CSV, "a", newline="", encoding="cp1251") as f:
            writer = csv.writer(f, delimiter=";")
            if not file_exists:
                writer.writerow(["Сессия", "Имя", "Время", "Тревоги", "Статус"])
            for r in verified:
                writer.writerow([r.session_id, r.name, r.time_sec, r.alerts, r.status])

    report = (
        f"Добавлено записей: {len(verified)}\n"
        f"Отклонено строк: {len(errors)}"
    )
    if errors:
        report += "\n\n" + "\n".join(errors[:5])
        if len(errors) > 5:
            report += "\n…"

    await state.set_state(BotState.MENU)
    await show_screen(
        message.chat.id,
        message.from_user.id,
        report,
        keyboards.back_to_menu(),
    )

    if verified:
        await notify_subscribers(f"Новые результаты: {len(verified)} записей добавлено.")

@dp.message(StateFilter(BotState.UPLOAD))
async def upload_wrong_type(message: Message):
    await message.answer("Пожалуйста, пришлите файл .csv или .log, либо нажмите «Отмена».")

@dp.message(StateFilter(BotState.WAIT_NAME))
async def handle_name(message: Message, state: FSMContext):
    name = message.text.strip()
    if not name:
        await message.answer("Имя не может быть пустым. Попробуйте ещё раз.")
        return
    session = sess.load_session(message.from_user.id)
    session["name"] = name
    sess.save_session(message.from_user.id, session)
    await state.set_state(BotState.MENU)
    records = load_records()
    text = analytics.personal_stats(records, name)
    await show_screen(
        message.chat.id,
        message.from_user.id,
        text,
        keyboards.back_to_menu(),
    )

async def notify_subscribers(text: str):
    for path in config.SESSION_DIR.glob("*.json"):
        try:
            user_id = int(path.stem)
            session = sess.load_session(user_id)
            if session.get("subscribed"):
                await bot.send_message(user_id, f"🔔 {text}")
        except Exception:
            pass

@dp.message(Command("broadcast"))
async def cmd_broadcast(message: Message, state: FSMContext):
    if message.from_user.id != config.ADMIN_ID:
        await message.answer("Недостаточно прав.")
        return
    await state.set_state(BotState.BROADCAST)
    await message.answer("Введите текст рассылки:")

@dp.message(StateFilter(BotState.BROADCAST))
async def do_broadcast(message: Message, state: FSMContext):
    if message.from_user.id != config.ADMIN_ID:
        await state.clear()
        return
    text = message.text
    count = 0
    for path in config.SESSION_DIR.glob("*.json"):
        try:
            user_id = int(path.stem)
            session = sess.load_session(user_id)
            if session.get("subscribed"):
                await bot.send_message(user_id, f"📢 {text}")
                count += 1
        except Exception:
            pass
    await state.clear()
    await message.answer(f"Рассылка отправлена {count} подписчикам.")

@dp.errors()
async def on_error(event):
    logger.error("Ошибка апдейта: %s", event.exception, exc_info=True)
    return True

async def main():
    if not config.BOT_TOKEN:
        raise SystemExit("Укажите BOT_TOKEN в .env")
    logger.info("Бот запущен")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())