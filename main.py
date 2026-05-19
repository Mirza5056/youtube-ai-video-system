from fastapi import FastAPI
from app.api.routes import router
from app.db.database import test_connection
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware

app=FastAPI()
app.include_router(router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await test_connection()
    yield