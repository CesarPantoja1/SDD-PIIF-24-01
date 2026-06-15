from __future__ import annotations

import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv


ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS_DIR = ROOT / "migrations"


def main() -> None:
    load_dotenv(ROOT / ".env")
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required to apply backend migrations")

    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if not migration_files:
        print("No migrations found.")
        return

    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute("create schema if not exists private")
            cur.execute(
                """
                create table if not exists private.app_migrations (
                  name text primary key,
                  applied_at timestamptz not null default now()
                )
                """
            )
            for path in migration_files:
                cur.execute("select 1 from private.app_migrations where name = %s", (path.name,))
                if cur.fetchone():
                    print(f"Skipping {path.name}")
                    continue

                print(f"Applying {path.name}")
                cur.execute(path.read_text(encoding="utf-8"))
                cur.execute("insert into private.app_migrations (name) values (%s)", (path.name,))

        conn.commit()


if __name__ == "__main__":
    main()
