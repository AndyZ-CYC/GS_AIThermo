import sqlite3
import os
from pathlib import Path

DB_DIR = Path(__file__).parent / "data"
DB_PATH = DB_DIR / "app.db"
UPLOAD_DIR = DB_DIR / "uploads" / "posters"
ICON_DIR = DB_DIR / "uploads" / "icons"


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def init_db():
    DB_DIR.mkdir(parents=True, exist_ok=True)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ICON_DIR.mkdir(parents=True, exist_ok=True)

    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS game_type (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            sort_order  INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
            created_by  TEXT    DEFAULT 'system',
            updated_by  TEXT    DEFAULT 'system'
        );

        CREATE TABLE IF NOT EXISTS game_type_poster (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            game_type_id  INTEGER NOT NULL REFERENCES game_type(id),
            file_path     TEXT    NOT NULL,
            created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
            created_by    TEXT    DEFAULT 'system'
        );

        CREATE TABLE IF NOT EXISTS role_group (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            sort_order  INTEGER NOT NULL DEFAULT 0,
            created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
            created_by  TEXT    DEFAULT 'system',
            updated_by  TEXT    DEFAULT 'system'
        );

        CREATE TABLE IF NOT EXISTS role (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            role_group_id   INTEGER NOT NULL REFERENCES role_group(id),
            name            TEXT    NOT NULL,
            sort_order      INTEGER NOT NULL DEFAULT 0,
            created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
            created_by      TEXT    DEFAULT 'system',
            updated_by      TEXT    DEFAULT 'system'
        );

        CREATE TABLE IF NOT EXISTS tool_cell (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            game_type_id    INTEGER NOT NULL REFERENCES game_type(id),
            role_id         INTEGER NOT NULL REFERENCES role(id),
            tool_name       TEXT    NOT NULL,
            maturity_score  INTEGER NOT NULL CHECK(maturity_score BETWEEN 0 AND 100),
            official_url    TEXT    NOT NULL,
            short_desc      TEXT    NOT NULL,
            report_url      TEXT,
            icon_path       TEXT,
            created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
            created_by      TEXT    DEFAULT 'system',
            updated_by      TEXT    DEFAULT 'system'
        );

        CREATE UNIQUE INDEX IF NOT EXISTS uq_tool_cell
            ON tool_cell(game_type_id, role_id);

        CREATE INDEX IF NOT EXISTS idx_tool_cell_game_type ON tool_cell(game_type_id);
        CREATE INDEX IF NOT EXISTS idx_tool_cell_role ON tool_cell(role_id);
        CREATE INDEX IF NOT EXISTS idx_role_group ON role(role_group_id);
        CREATE INDEX IF NOT EXISTS idx_poster_game_type ON game_type_poster(game_type_id);
    """)

    # Migrate: add icon_path if missing (safe for existing DBs)
    cols = [r["name"] for r in conn.execute("PRAGMA table_info(tool_cell)").fetchall()]
    if "icon_path" not in cols:
        conn.execute("ALTER TABLE tool_cell ADD COLUMN icon_path TEXT")
        conn.commit()

    conn.close()
