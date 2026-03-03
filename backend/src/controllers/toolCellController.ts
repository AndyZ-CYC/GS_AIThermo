import { Request, Response } from 'express';
import { ToolCellService } from '../services/toolCellService.js';
import { ApiResponse } from '../types/index.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { NotFoundError } from '../middleware/errorHandler.js';

export const getToolCells = asyncHandler(async (_req: Request, res: Response) => {
  const toolCells = ToolCellService.getAll();
  const response: ApiResponse<typeof toolCells> = { data: toolCells };
  res.json(response);
});

export const getToolCellByCell = asyncHandler(async (req: Request, res: Response) => {
  const gameTypeId = parseInt(req.params.gameTypeId, 10);
  const roleId = parseInt(req.params.roleId, 10);

  const toolCell = ToolCellService.getByCell(gameTypeId, roleId);

  if (!toolCell) {
    throw NotFoundError('该单元格没有工具卡片');
  }

  const response: ApiResponse<typeof toolCell> = { data: toolCell };
  res.json(response);
});

export const getToolCellById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const toolCell = ToolCellService.getById(id);

  if (!toolCell) {
    throw NotFoundError('工具卡片不存在');
  }

  const response: ApiResponse<typeof toolCell> = { data: toolCell };
  res.json(response);
});

export const createToolCell = asyncHandler(async (req: Request, res: Response) => {
  const {
    game_type_id,
    role_id,
    tool_name,
    maturity_level,
    official_url,
    short_desc,
    report_url,
  } = req.body;

  const toolCell = ToolCellService.create({
    game_type_id,
    role_id,
    tool_name,
    maturity_level,
    official_url,
    short_desc,
    report_url,
  });

  const response: ApiResponse<typeof toolCell> = {
    data: toolCell,
    message: '工具卡片创建成功',
  };
  res.status(201).json(response);
});

export const updateToolCell = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { tool_name, maturity_level, official_url, short_desc, report_url } = req.body;

  const toolCell = ToolCellService.update(id, {
    tool_name,
    maturity_level,
    official_url,
    short_desc,
    report_url,
  });

  if (!toolCell) {
    throw NotFoundError('工具卡片不存在');
  }

  const response: ApiResponse<typeof toolCell> = {
    data: toolCell,
    message: '工具卡片更新成功',
  };
  res.json(response);
});

export const deleteToolCell = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  const success = ToolCellService.delete(id);

  if (!success) {
    throw NotFoundError('工具卡片不存在');
  }

  res.json({ data: null, message: '工具卡片删除成功' });
});
