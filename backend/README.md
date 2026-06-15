# KOSMO Backend

FastAPI service for KOSMO. The backend owns application logic and uses Supabase as persistence/auth infrastructure.

## Run locally

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

## Migrations

SQL migrations live in `backend/migrations`. Apply them with:

```powershell
python scripts/apply_migrations.py
```

The migration runner requires `DATABASE_URL`.

