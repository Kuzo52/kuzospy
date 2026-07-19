"""Работа с базой локаций для игры KuzoSpy."""

from __future__ import annotations

import random
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "kuzospy.db"

LOCATIONS: list[str] = [
    "Космическая станция",
    "База на Луне",
    "Орбитальный отель",
    "Завод роботов",
    "Подводная лодка",
    "Пиратский корабль",
    "Круизный лайнер",
    "Затонувшая Атлантида",
    "Необитаемый остров",
    "Рыцарский замок",
    "Древний Египет",
    "Школа магии",
    "Деревня викингов",
    "Дикий Запад (Салун)",
    "Пассажирский самолет",
    "Метро",
    "Поезд «Восточный экспресс»",
    "Космический шаттл",
    "Офис IT-компании",
    "Пожарная часть",
    "Полицейский участок",
    "Автосервис",
    "Военная база",
    "Подземный бункер",
    "Лаборатория ученого",
    "Тюрьма",
    "Казино в Лас-Вегасе",
    "Ночной клуб",
    "Цирк",
    "Аквапарк",
    "Рок-фестиваль",
    "Парк аттракционов",
    "Горнолыжный курорт",
    "Фестиваль косплея",
    "Кинотеатр",
    "Киностудия Голливуда",
    "Музей искусств",
    "Театр оперы",
    "Библиотека",
    "Дорогой ресторан",
    "Бургерная",
    "Кондитерская фабрика",
    "Отель «Все включено»",
    "Психиатрическая больница",
    "Салон красоты",
    "Спа-курорт",
    "Супермаркет",
    "Стадион",
    "Кошачий приют",
    "Детский сад",
]


def _connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    """Создаёт таблицу locations и заполняет её, если база пуста."""
    with _connect() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS locations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            )
            """
        )
        count = connection.execute("SELECT COUNT(*) AS total FROM locations").fetchone()[
            "total"
        ]
        if count == 0:
            connection.executemany(
                "INSERT INTO locations (name) VALUES (?)",
                [(name,) for name in LOCATIONS],
            )
        connection.commit()


def get_random_location() -> str:
    """Возвращает одно случайное место из базы."""
    init_db()
    with _connect() as connection:
        row = connection.execute(
            "SELECT name FROM locations ORDER BY RANDOM() LIMIT 1"
        ).fetchone()
        if row is None:
            return random.choice(LOCATIONS)
        return str(row["name"])


def get_all_locations() -> list[str]:
    """Возвращает все места из базы (для подсказки шпиону)."""
    init_db()
    with _connect() as connection:
        rows = connection.execute(
            "SELECT name FROM locations ORDER BY name COLLATE NOCASE"
        ).fetchall()
        if not rows:
            return sorted(LOCATIONS)
        return [str(row["name"]) for row in rows]
