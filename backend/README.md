# Velvet Venues API

Production-ready FastAPI backend for the Velvet Venues project.

## Tech Stack

- Python 3.12+
- FastAPI
- PostgreSQL (Neon)
- SQLAlchemy 2.0 (Async)
- AsyncPG
- Alembic
- Pydantic V2
- JWT Authentication

## Installation

### 1. Create Virtual Environment

```bash
python -m venv .venv
```

**Windows:**

```bash
.venv\Scripts\activate
```

**macOS/Linux:**

```bash
source .venv/bin/activate
```

### 2. Install Packages

```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Copy the example environment file and update values as needed:

```bash
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

## Run Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

## Run Alembic

Initialize migrations (already configured in this project):

```bash
alembic init alembic
```

Generate a new migration:

```bash
alembic revision --autogenerate -m "Initial"
```

Apply migrations:

```bash
alembic upgrade head
```

## Seed Database

Seed default roles and users (admin, vendor, customer):

```bash
python -m scripts.seed
```

Default credentials (override via `.env`):

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@velvetvenues.com | Admin@123 |
| Vendor | vendor@velvetvenues.com | Vendor@123 |
| Customer | customer@velvetvenues.com | Customer@123 |

## Folder Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── api/                 # API routers
│   ├── core/                # Config, security, logging
│   ├── db/                  # Database engine, session, base
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── repositories/        # Data access layer
│   ├── services/            # Business logic
│   ├── middleware/          # Custom middleware
│   ├── dependencies/        # FastAPI dependencies
│   └── utils/               # Utility functions
├── tests/                   # Test suite
├── alembic/                 # Database migrations
├── requirements.txt
├── alembic.ini
├── .env
└── .env.example
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `uvicorn app.main:app --reload` | Start development server |
| `pytest` | Run tests |
| `alembic revision --autogenerate -m "message"` | Create migration |
| `alembic upgrade head` | Apply all migrations |
| `alembic downgrade -1` | Rollback last migration |
| `alembic current` | Show current revision |
| `alembic history` | Show migration history |
| `python -m scripts.seed` | Seed roles and default users |

## API Documentation

| URL | Description |
|-----|-------------|
| `http://127.0.0.1:8000/api/docs` | Swagger UI |
| `http://127.0.0.1:8000/api/redoc` | ReDoc |
| `http://127.0.0.1:8000/api/openapi.json` | OpenAPI schema |
| `http://127.0.0.1:8000/api/v1/health` | Health check endpoint |
