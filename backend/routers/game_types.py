import uuid
import os
from fastapi import APIRouter, HTTPException, UploadFile, File
from database import get_db, UPLOAD_DIR
from models import (
    GameTypeCreate, GameTypeUpdate, GameTypeSortRequest,
    GameTypeOut, PosterOut,
)

router = APIRouter(prefix="/api/game-types", tags=["game-types"])


def _build_game_type_out(row: dict, posters: list[dict]) -> GameTypeOut:
    return GameTypeOut(
        id=row["id"],
        name=row["name"],
        sort_order=row["sort_order"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        posters=[PosterOut(**p) for p in posters],
    )


@router.get("", response_model=list[GameTypeOut])
def list_game_types():
    db = get_db()
    rows = db.execute("SELECT * FROM game_type ORDER BY sort_order").fetchall()
    result = []
    for r in rows:
        posters = db.execute(
            "SELECT * FROM game_type_poster WHERE game_type_id = ? ORDER BY created_at",
            (r["id"],),
        ).fetchall()
        result.append(_build_game_type_out(dict(r), [dict(p) for p in posters]))
    db.close()
    return result


@router.post("", response_model=GameTypeOut, status_code=201)
def create_game_type(body: GameTypeCreate):
    db = get_db()
    max_order = db.execute("SELECT COALESCE(MAX(sort_order), 0) FROM game_type").fetchone()[0]
    cur = db.execute(
        "INSERT INTO game_type (name, sort_order) VALUES (?, ?)",
        (body.name, max_order + 1),
    )
    db.commit()
    row = db.execute("SELECT * FROM game_type WHERE id = ?", (cur.lastrowid,)).fetchone()
    db.close()
    return _build_game_type_out(dict(row), [])


@router.put("/sort", status_code=204)
def sort_game_types(body: GameTypeSortRequest):
    db = get_db()
    for idx, gid in enumerate(body.ids):
        db.execute("UPDATE game_type SET sort_order = ? WHERE id = ?", (idx, gid))
    db.commit()
    db.close()


@router.put("/{game_type_id}", response_model=GameTypeOut)
def update_game_type(game_type_id: int, body: GameTypeUpdate):
    db = get_db()
    existing = db.execute("SELECT * FROM game_type WHERE id = ?", (game_type_id,)).fetchone()
    if not existing:
        db.close()
        raise HTTPException(404, "游戏类型不存在")
    db.execute(
        "UPDATE game_type SET name = ?, updated_at = datetime('now'), updated_by = 'system' WHERE id = ?",
        (body.name, game_type_id),
    )
    db.commit()
    row = db.execute("SELECT * FROM game_type WHERE id = ?", (game_type_id,)).fetchone()
    posters = db.execute(
        "SELECT * FROM game_type_poster WHERE game_type_id = ? ORDER BY created_at",
        (game_type_id,),
    ).fetchall()
    db.close()
    return _build_game_type_out(dict(row), [dict(p) for p in posters])


@router.delete("/{game_type_id}", status_code=204)
def delete_game_type(game_type_id: int):
    db = get_db()
    existing = db.execute("SELECT * FROM game_type WHERE id = ?", (game_type_id,)).fetchone()
    if not existing:
        db.close()
        raise HTTPException(404, "游戏类型不存在")

    tc_count = db.execute(
        "SELECT COUNT(*) FROM tool_cell WHERE game_type_id = ?", (game_type_id,)
    ).fetchone()[0]
    poster_count = db.execute(
        "SELECT COUNT(*) FROM game_type_poster WHERE game_type_id = ?", (game_type_id,)
    ).fetchone()[0]

    if tc_count > 0 or poster_count > 0:
        db.close()
        raise HTTPException(409, detail={
            "message": "该游戏类型下存在关联数据，请先清理后再删除",
            "code": "HAS_DEPENDENCIES",
            "dependencies": {"tool_cells": tc_count, "posters": poster_count},
        })

    db.execute("DELETE FROM game_type WHERE id = ?", (game_type_id,))
    db.commit()
    db.close()


# ── Posters ──

@router.post("/{game_type_id}/posters", response_model=list[PosterOut], status_code=201)
async def upload_posters(game_type_id: int, files: list[UploadFile] = File(...)):
    db = get_db()
    existing = db.execute("SELECT id FROM game_type WHERE id = ?", (game_type_id,)).fetchone()
    if not existing:
        db.close()
        raise HTTPException(404, "游戏类型不存在")

    type_dir = UPLOAD_DIR / str(game_type_id)
    type_dir.mkdir(parents=True, exist_ok=True)

    result = []
    for f in files:
        ext = os.path.splitext(f.filename or "")[1] or ".jpg"
        filename = f"{uuid.uuid4().hex}{ext}"
        file_path = type_dir / filename
        content = await f.read()
        with open(file_path, "wb") as fp:
            fp.write(content)

        rel_path = f"/uploads/posters/{game_type_id}/{filename}"
        cur = db.execute(
            "INSERT INTO game_type_poster (game_type_id, file_path) VALUES (?, ?)",
            (game_type_id, rel_path),
        )
        db.commit()
        row = db.execute("SELECT * FROM game_type_poster WHERE id = ?", (cur.lastrowid,)).fetchone()
        result.append(PosterOut(**dict(row)))

    db.close()
    return result


poster_router = APIRouter(prefix="/api/posters", tags=["posters"])


@poster_router.delete("/{poster_id}", status_code=204)
def delete_poster(poster_id: int):
    db = get_db()
    row = db.execute("SELECT * FROM game_type_poster WHERE id = ?", (poster_id,)).fetchone()
    if not row:
        db.close()
        raise HTTPException(404, "海报不存在")

    physical_path = UPLOAD_DIR.parent.parent / row["file_path"].lstrip("/")
    if physical_path.exists():
        physical_path.unlink()

    db.execute("DELETE FROM game_type_poster WHERE id = ?", (poster_id,))
    db.commit()
    db.close()
