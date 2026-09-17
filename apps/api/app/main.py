from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"🚀 Apointli API starting in {settings.ENVIRONMENT} mode")

    # Verify DB connection
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            result.scalar()
        print("✅ Database connection OK")
    except Exception as e:
        print(f"❌ Database connection FAILED: {type(e).__name__}: {e}")

    yield

    # Shutdown
    await engine.dispose()
    print("👋 Apointli API shut down")


app = FastAPI(
    title="Apointli API",
    description="Multi-tenant appointment scheduling SaaS",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "name": "Apointli API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
