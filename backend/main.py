"""Точка входа: FastAPI + Telegram-бот на одном порту."""

from __future__ import annotations

import asyncio
import os
import random
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

from aiogram import Bot, Dispatcher
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from database.db import get_all_locations, get_random_location, init_db
from handlers.bot import configure_menu_button, setup_bot

BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

if not BOT_TOKEN or ":" not in BOT_TOKEN:
    raise RuntimeError(
        "Не задан BOT_TOKEN. Укажи токен бота в файле backend/.env"
    )

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
setup_bot(bot, dp)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()

    # Сброс webhook + старых апдейтов = меньше лагов и конфликтов
    try:
        await bot.delete_webhook(drop_pending_updates=True)
    except Exception:
        pass

    await configure_menu_button(bot)

    polling_task = asyncio.create_task(
        dp.start_polling(bot, drop_pending_updates=True)
    )
    try:
        yield
    finally:
        polling_task.cancel()
        try:
            await polling_task
        except asyncio.CancelledError:
            pass
        await bot.session.close()


app = FastAPI(title="KuzoSpy API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict[str, str]:
    return {"status": "ok", "service": "KuzoSpy"}


@app.get("/api/locations")
async def api_locations() -> dict[str, list[str]]:
    """Список всех мест — для подсказки шпиону на экране игры."""
    return {"locations": get_all_locations()}


@app.get("/api/game")
async def api_game(
    players: int = Query(..., ge=3, le=10, description="Число игроков"),
    spies: int = Query(..., ge=1, le=2, description="Число шпионов"),
) -> dict[str, list[str]]:
    """
    Собирает колоду карт: карты с локацией и 1–2 карты «Шпион».
    Жёстко перемешивает через random.shuffle и отдаёт на фронтенд.
    """
    if spies >= players:
        raise HTTPException(
            status_code=400,
            detail="Шпионов должно быть меньше, чем игроков",
        )

    location = get_random_location()
    deck: list[str] = ["Шпион"] * spies + [location] * (players - spies)
    random.shuffle(deck)

    return {"cards": deck}


if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False)
