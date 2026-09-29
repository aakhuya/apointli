import logging
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import engine

# Set up logging so errors surface in Render's log stream
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("apointli")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🚀 Apointli API starting in {settings.ENVIRONMENT} mode")
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("✅ Database connection OK")
    except Exception as e:
        logger.error(f"❌ Database connection FAILED: {type(e).__name__}: {e}")

    logger.info(f"🔓 CORS allowed origins: {settings.CORS_ORIGINS}")
    yield
    await engine.dispose()
    logger.info("👋 Apointli API shut down")


app = FastAPI(
    title="Apointli API",
    description="Multi-tenant appointment scheduling SaaS",
    version="0.1.0",
    lifespan=lifespan,
)


# ─── CORS ───
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https?://[a-z0-9-]+\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)


# ─── Global error handler ───
# Logs the FULL traceback with logging.error() so it shows up in Render
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    logger.error(
        f"💥 Unhandled error on {request.method} {request.url.path}\n"
        f"   Exception type: {type(exc).__name__}\n"
        f"   Exception message: {exc}\n"
        f"   Traceback:\n{tb}"
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred"},
    )


app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "name": "Apointli API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
