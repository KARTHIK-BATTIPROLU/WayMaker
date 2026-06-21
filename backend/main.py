from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from core.config import settings
from db.database import connect_to_mongo, close_mongo_connection
from routers import auth, projects, orchestrate, chat, webhooks, analytics, ideate
from marketing_kit.router import router as marketing_kit_router
from marketing_kit.store import ensure_indexes

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    await ensure_indexes()
    yield
    await close_mongo_connection()

app = FastAPI(title="Waymaker AI API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        *[f"http://localhost:{port}" for port in range(5173, 5180)],
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": str(exc)})

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

@app.get("/")
async def root():
    return {"message": "Waymaker AI API is running. Access /health for status."}

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(orchestrate.router, prefix="/api/projects", tags=["orchestrate"])
app.include_router(chat.router, prefix="/api/projects", tags=["chat"])
app.include_router(webhooks.router, prefix="/api/projects", tags=["webhooks"])
app.include_router(analytics.router, prefix="/api/projects", tags=["analytics"])
app.include_router(ideate.router, prefix="/api/projects", tags=["ideate"])
app.include_router(marketing_kit_router, prefix="/api/marketing-kit", tags=["marketing-kit"])
