"""Quick DB state inspector — run with: uv run python scripts/check_db.py"""
from sqlalchemy import create_engine, text
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

with engine.connect() as conn:
    # List all public tables
    rows = conn.execute(text(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
    )).fetchall()
    tables = [r[0] for r in rows]
    print("Tables in DB:", tables)

    # Alembic version tracking
    if "alembic_version" in tables:
        vers = conn.execute(text("SELECT version_num FROM alembic_version")).fetchall()
        print("Alembic version_num:", [r[0] for r in vers])
    else:
        print("alembic_version table: NOT FOUND")

    # Row counts for expected tables
    for t in ["applicants", "criteria", "departments", "positions", "allocations"]:
        if t in tables:
            cnt = conn.execute(text(f"SELECT COUNT(*) FROM {t}")).scalar()
            print(f"  {t}: {cnt} rows")
        else:
            print(f"  {t}: MISSING")
