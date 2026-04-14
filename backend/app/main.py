from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.database import create_tables
from app.routers import auth as auth_router
from app.routers import catalog as catalog_router
from app.routers import chat as chat_router

STATIC_DIR = Path(__file__).parent.parent / "static"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    create_tables()
    yield


app = FastAPI(title="Prelegal API", version="1.0.0", lifespan=lifespan)

app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])
app.include_router(catalog_router.router, prefix="/api/catalog", tags=["catalog"])
app.include_router(chat_router.router, prefix="/api/chat", tags=["chat"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# Serve static frontend build — mounted last so API routes take precedence
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
else:

    @app.get("/")
    async def root():
        return {"message": "Prelegal API — frontend not built", "docs": "/docs"}
