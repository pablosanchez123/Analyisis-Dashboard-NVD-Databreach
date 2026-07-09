from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import cwe, forecast, meta, patch_time, severity, vendors

app = FastAPI(title="NVD Vulnerability Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(severity.router)
app.include_router(vendors.router)
app.include_router(patch_time.router)
app.include_router(cwe.router)
app.include_router(forecast.router)
app.include_router(meta.router)


@app.get("/healthz")
def healthz():
    return {"status": "ok"}
