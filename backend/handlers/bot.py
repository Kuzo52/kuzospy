"""Хэндлеры Telegram-бота KuzoSpy."""

from __future__ import annotations

import os

from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    MenuButtonWebApp,
    Message,
    WebAppInfo,
)

WELCOME_HTML = (
    "🕵️ <b>Добро пожаловать в KuzoSpy!</b>\n\n"
    "Локальная игра «Шпион» для компании прямо в Telegram. "
    "Один телефон по кругу — смотрите карты по очереди "
    "и найдите шпиона среди своих.\n\n"
    "Жми кнопку «Играть» ниже и погнали! 👇\n\n"
    'Made by <a href="https://t.me/kuzoceo">@kuzoceo</a>'
)


def get_webapp_url() -> str:
    return os.getenv(
        "WEBAPP_URL",
        "https://kuzo52.github.io/kuzospy/",
    ).strip()


def build_webapp_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🎮 Играть",
                    web_app=WebAppInfo(url=get_webapp_url()),
                )
            ]
        ]
    )


async def configure_menu_button(bot: Bot) -> None:
    """Ставит кнопку меню один раз при старте — не на каждый /start."""
    try:
        await bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(
                text="Играть",
                web_app=WebAppInfo(url=get_webapp_url()),
            )
        )
    except Exception:
        pass


def setup_bot(bot: Bot, dp: Dispatcher) -> None:
    """Регистрирует хэндлеры бота."""

    @dp.message(CommandStart())
    async def cmd_start(message: Message) -> None:
        # Только быстрый ответ — без лишних API-вызовов
        await message.answer(
            WELCOME_HTML,
            reply_markup=build_webapp_keyboard(),
            parse_mode=ParseMode.HTML,
            disable_web_page_preview=True,
        )
