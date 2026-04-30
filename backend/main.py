"""
Faculty DSS — FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler — runs startup and shutdown logic."""
    # Future: seed default criteria, warm caches, etc.
    yield
    # Future: close connection pools, flush caches


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Optimization-Based Multi-Criteria Decision Support System "
        "for Faculty Recruitment and Multi-Position Allocation"
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
# Permissive for development: allow any localhost port.
# In production, restrict to settings.cors_origins_list only.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,          # from CORS_ORIGINS env var
    allow_origin_regex=r"http://localhost(:\d+)?",     # catch any localhost port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(api_router)
