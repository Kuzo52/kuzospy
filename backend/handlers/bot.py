"""Хэндлеры Telegram-бота KuzoSpy."""

from __future__ import annotations

import os

from aiogram import Bot, Dispatcher, F
from aiogram.filters import CommandStart
from aiogram.enums import ParseMode
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
    "Жми кнопку ниже и погнали! 👇\n\n"
    'Made by <a href="https://t.me/kuzoceo">@kuzoceo</a>'
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
                    text="Играть",
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
            WELCOME_HTML,
            reply_markup=build_webapp_keyboard(),
            parse_mode=ParseMode.HTML,
            disable_web_page_preview=True,
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
