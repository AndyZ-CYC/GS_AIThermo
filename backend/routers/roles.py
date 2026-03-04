from fastapi import APIRouter, HTTPException
from database import get_db
from models import (
    RoleGroupCreate, RoleGroupUpdate, RoleGroupSortRequest, RoleGroupOut,
    RoleCreate, RoleUpdate, RoleSortRequest, RoleOut,
)

router = APIRouter(prefix="/api/role-groups", tags=["role-groups"])
role_router = APIRouter(prefix="/api/roles", tags=["roles"])


def _build_role_group_out(row: dict, roles: list[dict]) -> RoleGroupOut:
    return RoleGroupOut(
        id=row["id"],
        name=row["name"],
        sort_order=row["sort_order"],
        roles=[RoleOut(**r) for r in roles],
    )


@router.get("", response_model=list[RoleGroupOut])
def list_role_groups():
    db = get_db()
    groups = db.execute("SELECT * FROM role_group ORDER BY sort_order").fetchall()
    result = []
    for g in groups:
        roles = db.execute(
            "SELECT * FROM role WHERE role_group_id = ? ORDER BY sort_order",
            (g["id"],),
        ).fetchall()
        result.append(_build_role_group_out(dict(g), [dict(r) for r in roles]))
    db.close()
    return result


@router.post("", response_model=RoleGroupOut, status_code=201)
def create_role_group(body: RoleGroupCreate):
    db = get_db()
    max_order = db.execute("SELECT COALESCE(MAX(sort_order), 0) FROM role_group").fetchone()[0]
    cur = db.execute(
        "INSERT INTO role_group (name, sort_order) VALUES (?, ?)",
        (body.name, max_order + 1),
    )
    db.commit()
    row = db.execute("SELECT * FROM role_group WHERE id = ?", (cur.lastrowid,)).fetchone()
    db.close()
    return _build_role_group_out(dict(row), [])


@router.put("/sort", status_code=204)
def sort_role_groups(body: RoleGroupSortRequest):
    db = get_db()
    for idx, gid in enumerate(body.ids):
        db.execute("UPDATE role_group SET sort_order = ? WHERE id = ?", (idx, gid))
    db.commit()
    db.close()


@router.put("/{group_id}", response_model=RoleGroupOut)
def update_role_group(group_id: int, body: RoleGroupUpdate):
    db = get_db()
    existing = db.execute("SELECT * FROM role_group WHERE id = ?", (group_id,)).fetchone()
    if not existing:
        db.close()
        raise HTTPException(404, "工种大类不存在")
    db.execute(
        "UPDATE role_group SET name = ?, updated_at = datetime('now') WHERE id = ?",
        (body.name, group_id),
    )
    db.commit()
    row = db.execute("SELECT * FROM role_group WHERE id = ?", (group_id,)).fetchone()
    roles = db.execute(
        "SELECT * FROM role WHERE role_group_id = ? ORDER BY sort_order", (group_id,)
    ).fetchall()
    db.close()
    return _build_role_group_out(dict(row), [dict(r) for r in roles])


@router.delete("/{group_id}", status_code=204)
def delete_role_group(group_id: int):
    db = get_db()
    existing = db.execute("SELECT * FROM role_group WHERE id = ?", (group_id,)).fetchone()
    if not existing:
        db.close()
        raise HTTPException(404, "工种大类不存在")

    role_count = db.execute(
        "SELECT COUNT(*) FROM role WHERE role_group_id = ?", (group_id,)
    ).fetchone()[0]
    if role_count > 0:
        db.close()
        raise HTTPException(409, detail={
            "message": f"该大类下存在 {role_count} 个工种子类，请先删除后再操作",
            "code": "HAS_DEPENDENCIES",
            "dependencies": {"roles": role_count},
        })

    db.execute("DELETE FROM role_group WHERE id = ?", (group_id,))
    db.commit()
    db.close()


# ── Role (子工种) ──

@role_router.post("", response_model=RoleOut, status_code=201)
def create_role(body: RoleCreate):
    db = get_db()
    group = db.execute("SELECT id FROM role_group WHERE id = ?", (body.role_group_id,)).fetchone()
    if not group:
        db.close()
        raise HTTPException(404, "工种大类不存在")

    max_order = db.execute(
        "SELECT COALESCE(MAX(sort_order), 0) FROM role WHERE role_group_id = ?",
        (body.role_group_id,),
    ).fetchone()[0]
    cur = db.execute(
        "INSERT INTO role (role_group_id, name, sort_order) VALUES (?, ?, ?)",
        (body.role_group_id, body.name, max_order + 1),
    )
    db.commit()
    row = db.execute("SELECT * FROM role WHERE id = ?", (cur.lastrowid,)).fetchone()
    db.close()
    return RoleOut(**dict(row))


@role_router.put("/sort", status_code=204)
def sort_roles(body: RoleSortRequest):
    db = get_db()
    for rid in body.ids:
        row = db.execute("SELECT role_group_id FROM role WHERE id = ?", (rid,)).fetchone()
        if not row or row["role_group_id"] != body.role_group_id:
            db.close()
            raise HTTPException(400, f"Role id {rid} 不属于指定的大类 {body.role_group_id}")
    for idx, rid in enumerate(body.ids):
        db.execute("UPDATE role SET sort_order = ? WHERE id = ?", (idx, rid))
    db.commit()
    db.close()


@role_router.put("/{role_id}", response_model=RoleOut)
def update_role(role_id: int, body: RoleUpdate):
    db = get_db()
    existing = db.execute("SELECT * FROM role WHERE id = ?", (role_id,)).fetchone()
    if not existing:
        db.close()
        raise HTTPException(404, "工种子类不存在")
    db.execute(
        "UPDATE role SET name = ?, updated_at = datetime('now') WHERE id = ?",
        (body.name, role_id),
    )
    db.commit()
    row = db.execute("SELECT * FROM role WHERE id = ?", (role_id,)).fetchone()
    db.close()
    return RoleOut(**dict(row))


@role_router.delete("/{role_id}", status_code=204)
def delete_role(role_id: int):
    db = get_db()
    existing = db.execute("SELECT * FROM role WHERE id = ?", (role_id,)).fetchone()
    if not existing:
        db.close()
        raise HTTPException(404, "工种子类不存在")

    tc_count = db.execute(
        "SELECT COUNT(*) FROM tool_cell WHERE role_id = ?", (role_id,)
    ).fetchone()[0]
    if tc_count > 0:
        db.close()
        raise HTTPException(409, detail={
            "message": f"该工种下存在 {tc_count} 个工具卡片，请先删除后再操作",
            "code": "HAS_DEPENDENCIES",
            "dependencies": {"tool_cells": tc_count},
        })

    db.execute("DELETE FROM role WHERE id = ?", (role_id,))
    db.commit()
    db.close()
