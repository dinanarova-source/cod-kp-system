import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth_router, catalog, proposals, admin

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ЦОД — Система КП", version="1.0.0")

_cors_env = os.getenv("CORS_ORIGINS", "")
_origins = [o.strip() for o in _cors_env.split(",") if o.strip()] or [
    "http://localhost:5173", "http://localhost:3000"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(catalog.router)
app.include_router(proposals.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "ЦОД КП API"}
