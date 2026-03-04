from pydantic import BaseModel, Field
from typing import Optional


# ── GameType ──

class GameTypeCreate(BaseModel):
    name: str = Field(..., min_length=1)

class GameTypeUpdate(BaseModel):
    name: str = Field(..., min_length=1)

class GameTypeSortRequest(BaseModel):
    ids: list[int]

class PosterOut(BaseModel):
    id: int
    game_type_id: int
    file_path: str
    created_at: str

class GameTypeOut(BaseModel):
    id: int
    name: str
    sort_order: int
    created_at: str
    updated_at: str
    posters: list[PosterOut] = []


# ── RoleGroup / Role ──

class RoleGroupCreate(BaseModel):
    name: str = Field(..., min_length=1)

class RoleGroupUpdate(BaseModel):
    name: str = Field(..., min_length=1)

class RoleGroupSortRequest(BaseModel):
    ids: list[int]

class RoleCreate(BaseModel):
    role_group_id: int
    name: str = Field(..., min_length=1)

class RoleUpdate(BaseModel):
    name: str = Field(..., min_length=1)

class RoleSortRequest(BaseModel):
    role_group_id: int
    ids: list[int]

class RoleOut(BaseModel):
    id: int
    role_group_id: int
    name: str
    sort_order: int

class RoleGroupOut(BaseModel):
    id: int
    name: str
    sort_order: int
    roles: list[RoleOut] = []


# ── ToolCell ──

class ToolCellCreate(BaseModel):
    game_type_id: int
    role_id: int
    tool_name: str = Field(..., min_length=1)
    maturity_score: int = Field(..., ge=0, le=100)
    official_url: str = Field(..., min_length=1)
    short_desc: str = Field(..., min_length=1)
    report_url: Optional[str] = None

class ToolCellUpdate(BaseModel):
    tool_name: str = Field(..., min_length=1)
    maturity_score: int = Field(..., ge=0, le=100)
    official_url: str = Field(..., min_length=1)
    short_desc: str = Field(..., min_length=1)
    report_url: Optional[str] = None

class ToolCellOut(BaseModel):
    id: int
    game_type_id: int
    role_id: int
    tool_name: str
    maturity_score: int
    official_url: str
    short_desc: str
    report_url: Optional[str]
    icon_path: Optional[str]
    created_at: str
    updated_at: str
