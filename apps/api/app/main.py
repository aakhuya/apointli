import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 Apointli API starting in {settings.ENVIRONMENT} mode")
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        print("✅ Database connection OK")
    except Exception as e:
        print(f"❌ Database connection FAILED: {type(e).__name__}: {e}")
    yield
    await engine.dispose()
    print("👋 Apointli API shut down")


app = FastAPI(
    title="Apointli API",
    description="Multi-tenant appointment scheduling SaaS",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Global exception handler ───
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    print(f"💥 Unhandled error on {request.method} {request.url.path}")
    traceback.print_exc()
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
