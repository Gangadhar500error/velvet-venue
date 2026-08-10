import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.db.database import engine
from app.main import app

pytest_plugins = ("pytest_asyncio",)


@pytest_asyncio.fixture(scope="session")
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture(autouse=True)
async def reset_db_engine():
    yield
    await engine.dispose()
