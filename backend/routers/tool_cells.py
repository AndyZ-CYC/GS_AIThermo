import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File
from database import get_db, ICON_DIR
from models import ToolCellCreate, ToolCellUpdate, ToolCellOut

router = APIRouter(prefix="/api/tool-cells", tags=["tool-cells"])


def _build_tool_cell_out(row: dict) -> ToolCellOut:
    return ToolCellOut(**{**row, "is_na": bool(row.get("is_na", 0))})


@router.get("", response_model=list[ToolCellOut])
def list_tool_cells():
    db = get_db()
    rows = db.execute("SELECT * FROM tool_cell").fetchall()
    db.close()
    return [_build_tool_cell_out(dict(r)) for r in rows]


@router.post("", response_model=ToolCellOut, status_code=201)
def create_tool_cell(body: ToolCellCreate):
    db = get_db()

    gt = db.execute("SELECT id FROM game_type WHERE id = ?", (body.game_type_id,)).fetchone()
    if not gt:
        db.close()
        raise HTTPException(404, "游戏类型不存在")
    role = db.execute("SELECT id FROM role WHERE id = ?", (body.role_id,)).fetchone()
    if not role:
        db.close()
        raise HTTPException(404, "工种子类不存在")

    dup = db.execute(
        "SELECT id FROM tool_cell WHERE game_type_id = ? AND role_id = ?",
        (body.game_type_id, body.role_id),
    ).fetchone()
    if dup:
        db.close()
        raise HTTPException(409, detail={
            "message": "该单元格已存在工具卡片",
            "code": "DUPLICATE_CELL",
        })

    if body.is_na:
        tool_name = "N/A"
        maturity_score = 0
        official_url = "-"
        short_desc = "不适用"
    else:
        if not body.tool_name or not body.official_url or not body.short_desc:
            db.close()
            raise HTTPException(422, "非 N/A 卡片需填写工具名称、官网链接和简短描述")
        tool_name = body.tool_name
        maturity_score = body.maturity_score
        official_url = body.official_url
        short_desc = body.short_desc

    cur = db.execute(
        """INSERT INTO tool_cell
           (game_type_id, role_id, is_na, tool_name, maturity_score, official_url, short_desc, report_url)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (body.game_type_id, body.role_id, int(body.is_na), tool_name, maturity_score,
         official_url, short_desc, body.report_url),
    )
    db.commit()
    row = db.execute("SELECT * FROM tool_cell WHERE id = ?", (cur.lastrowid,)).fetchone()
    db.close()
    return _build_tool_cell_out(dict(row))


@router.put("/{cell_id}", response_model=ToolCellOut)
def update_tool_cell(cell_id: int, body: ToolCellUpdate):
    db = get_db()
    existing = db.execute("SELECT * FROM tool_cell WHERE id = ?", (cell_id,)).fetchone()
    if not existing:
        db.close()
        raise HTTPException(404, "工具卡片不存在")

    if body.is_na:
        tool_name = "N/A"
        maturity_score = 0
        official_url = "-"
        short_desc = "不适用"
    else:
        if not body.tool_name or not body.official_url or not body.short_desc:
            db.close()
            raise HTTPException(422, "非 N/A 卡片需填写工具名称、官网链接和简短描述")
        tool_name = body.tool_name
        maturity_score = body.maturity_score
        official_url = body.official_url
        short_desc = body.short_desc

    db.execute(
        """UPDATE tool_cell SET
           is_na = ?, tool_name = ?, maturity_score = ?, official_url = ?,
           short_desc = ?, report_url = ?, updated_at = datetime('now'), updated_by = 'system'
           WHERE id = ?""",
        (int(body.is_na), tool_name, maturity_score, official_url,
         short_desc, body.report_url, cell_id),
    )
    db.commit()
    row = db.execute("SELECT * FROM tool_cell WHERE id = ?", (cell_id,)).fetchone()
    db.close()
    return _build_tool_cell_out(dict(row))


@router.delete("/{cell_id}", status_code=204)
def delete_tool_cell(cell_id: int):
    db = get_db()
    existing = db.execute("SELECT * FROM tool_cell WHERE id = ?", (cell_id,)).fetchone()
    if not existing:
        db.close()
        raise HTTPException(404, "工具卡片不存在")
    if existing["icon_path"]:
        _remove_icon_file(existing["icon_path"])
    db.execute("DELETE FROM tool_cell WHERE id = ?", (cell_id,))
    db.commit()
    db.close()


@router.post("/{cell_id}/icon", response_model=ToolCellOut)
async def upload_icon(cell_id: int, file: UploadFile = File(...)):
    db = get_db()
    existing = db.execute("SELECT * FROM tool_cell WHERE id = ?", (cell_id,)).fetchone()
    if not existing:
        db.close()
        raise HTTPException(404, "工具卡片不存在")

    ext = Path(file.filename or "icon.png").suffix.lower() or ".png"
    filename = f"{uuid.uuid4().hex}{ext}"
    dest = ICON_DIR / filename
    content = await file.read()
    dest.write_bytes(content)

    icon_url = f"/uploads/icons/{filename}"
    if existing["icon_path"]:
        _remove_icon_file(existing["icon_path"])

    db.execute(
        "UPDATE tool_cell SET icon_path = ?, updated_at = datetime('now') WHERE id = ?",
        (icon_url, cell_id),
    )
    db.commit()
    row = db.execute("SELECT * FROM tool_cell WHERE id = ?", (cell_id,)).fetchone()
    db.close()
    return _build_tool_cell_out(dict(row))


@router.delete("/{cell_id}/icon", response_model=ToolCellOut)
def delete_icon(cell_id: int):
    db = get_db()
    existing = db.execute("SELECT * FROM tool_cell WHERE id = ?", (cell_id,)).fetchone()
    if not existing:
        db.close()
        raise HTTPException(404, "工具卡片不存在")
    if existing["icon_path"]:
        _remove_icon_file(existing["icon_path"])
    db.execute(
        "UPDATE tool_cell SET icon_path = NULL, updated_at = datetime('now') WHERE id = ?",
        (cell_id,),
    )
    db.commit()
    row = db.execute("SELECT * FROM tool_cell WHERE id = ?", (cell_id,)).fetchone()
    db.close()
    return _build_tool_cell_out(dict(row))


def _remove_icon_file(icon_path: str):
    filename = icon_path.rsplit("/", 1)[-1]
    fp = ICON_DIR / filename
    if fp.exists():
        fp.unlink()
