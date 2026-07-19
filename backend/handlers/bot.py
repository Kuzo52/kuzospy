"""Хэндлеры Telegram-бота KuzoSpy."""

from __future__ import annotations

import os

from aiogram import Bot, Dispatcher, F
from aiogram.filters import CommandStart
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    MenuButtonWebApp,
    Message,
    WebAppInfo,
)

def get_webapp_url() -> str:
    return os.getenv(
        "WEBAPP_URL",
        "https://YOUR_USERNAME.github.io/kuzospy/",
    ).strip()


def build_webapp_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Открыть KuzoSpy",
                    web_app=WebAppInfo(url=get_webapp_url()),
                )
            ]
        ]
    )


def setup_bot(bot: Bot, dp: Dispatcher) -> None:
    """Регистрирует хэндлеры бота."""

    @dp.message(CommandStart())
    async def cmd_start(message: Message) -> None:
        await message.answer(
            "Привет! Это KuzoSpy — локальная игра «Шпион».\n\n"
            "Сядьте за стол, передавайте один телефон по кругу "
            "и найдите шпиона среди своих.\n\n"
            "Нажми кнопку ниже, чтобы начать.",
            reply_markup=build_webapp_keyboard(),
        )

        try:
            await bot.set_chat_menu_button(
                chat_id=message.chat.id,
                menu_button=MenuButtonWebApp(
                    text="Играть",
                    web_app=WebAppInfo(url=get_webapp_url()),
                ),
            )
        except Exception:
            # Меню-кнопка — удобство, не критична для игры
            pass

    @dp.message(F.text)
    async def fallback_text(message: Message) -> None:
        await message.answer(
            "Чтобы сыграть, нажми /start или кнопку ниже.",
            reply_markup=build_webapp_keyboard(),
        )
