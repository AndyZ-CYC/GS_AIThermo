from fastapi import APIRouter, HTTPException
from database import get_db
from models import ToolCellCreate, ToolCellUpdate, ToolCellOut

router = APIRouter(prefix="/api/tool-cells", tags=["tool-cells"])


@router.get("", response_model=list[ToolCellOut])
def list_tool_cells():
    db = get_db()
    rows = db.execute("SELECT * FROM tool_cell").fetchall()
    db.close()
    return [ToolCellOut(**dict(r)) for r in rows]


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

    cur = db.execute(
        """INSERT INTO tool_cell
           (game_type_id, role_id, tool_name, maturity_score, official_url, short_desc, report_url)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (body.game_type_id, body.role_id, body.tool_name, body.maturity_score,
         body.official_url, body.short_desc, body.report_url),
    )
    db.commit()
    row = db.execute("SELECT * FROM tool_cell WHERE id = ?", (cur.lastrowid,)).fetchone()
    db.close()
    return ToolCellOut(**dict(row))


@router.put("/{cell_id}", response_model=ToolCellOut)
def update_tool_cell(cell_id: int, body: ToolCellUpdate):
    db = get_db()
    existing = db.execute("SELECT * FROM tool_cell WHERE id = ?", (cell_id,)).fetchone()
    if not existing:
        db.close()
        raise HTTPException(404, "工具卡片不存在")

    db.execute(
        """UPDATE tool_cell SET
           tool_name = ?, maturity_score = ?, official_url = ?,
           short_desc = ?, report_url = ?, updated_at = datetime('now'), updated_by = 'system'
           WHERE id = ?""",
        (body.tool_name, body.maturity_score, body.official_url,
         body.short_desc, body.report_url, cell_id),
    )
    db.commit()
    row = db.execute("SELECT * FROM tool_cell WHERE id = ?", (cell_id,)).fetchone()
    db.close()
    return ToolCellOut(**dict(row))


@router.delete("/{cell_id}", status_code=204)
def delete_tool_cell(cell_id: int):
    db = get_db()
    existing = db.execute("SELECT * FROM tool_cell WHERE id = ?", (cell_id,)).fetchone()
    if not existing:
        db.close()
        raise HTTPException(404, "工具卡片不存在")
    db.execute("DELETE FROM tool_cell WHERE id = ?", (cell_id,))
    db.commit()
    db.close()
