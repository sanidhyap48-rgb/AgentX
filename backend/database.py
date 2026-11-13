
import sqlite3
import json
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "agentx.db"


def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(DB_PATH)


def initialize_database():
    with get_connection() as conn:

        conn.execute("""
            CREATE TABLE IF NOT EXISTS research_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question TEXT NOT NULL,
                report TEXT NOT NULL,
                sources TEXT NOT NULL,
                verification TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS execution_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                research_id INTEGER,
                stage TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT DEFAULT 'info',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)


def save_research(result):
    with get_connection() as conn:
        cursor = conn.execute("""
            INSERT INTO research_history
            (question, report, sources, verification)
            VALUES (?, ?, ?, ?)
        """, (
            result["question"],
            result["report"],
            json.dumps(result["sources"]),
            json.dumps(result["verification"])
        ))

        return cursor.lastrowid


def get_research_history():
    with get_connection() as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("""
            SELECT * FROM research_history
            ORDER BY created_at DESC
        """).fetchall()

        return [dict(row) for row in rows]


def save_execution_log(stage, message, status="info", research_id=None):
    with get_connection() as conn:
        conn.execute("""
            INSERT INTO execution_logs
            (research_id, stage, message, status)
            VALUES (?, ?, ?, ?)
        """, (
            research_id,
            stage,
            message,
            status
        ))


def get_execution_logs(research_id=None):
    with get_connection() as conn:
        conn.row_factory = sqlite3.Row

        if research_id is None:
            rows = conn.execute("""
                SELECT * FROM execution_logs
                ORDER BY created_at DESC, id DESC
            """).fetchall()
        else:
            rows = conn.execute("""
                SELECT * FROM execution_logs
                WHERE research_id = ?
                ORDER BY created_at DESC, id DESC
            """, (research_id,)).fetchall()

        return [dict(row) for row in rows]
