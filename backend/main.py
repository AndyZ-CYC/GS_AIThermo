from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager

from database import init_db, UPLOAD_DIR
from routers.game_types import router as game_type_router, poster_router
from routers.roles import router as role_group_router, role_router
from routers.tool_cells import router as tool_cell_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="AI 行业温度计 API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_parent = UPLOAD_DIR.parent
uploads_parent.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_parent)), name="uploads")

app.include_router(game_type_router)
app.include_router(poster_router)
app.include_router(role_group_router)
app.include_router(role_router)
app.include_router(tool_cell_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
