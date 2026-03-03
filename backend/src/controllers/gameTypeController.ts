import { Request, Response } from 'express';
import { GameTypeService } from '../services/gameTypeService.js';
import { ApiResponse } from '../types/index.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { NotFoundError, DependenciesError } from '../middleware/errorHandler.js';

export const getGameTypes = asyncHandler(async (_req: Request, res: Response) => {
  const gameTypes = GameTypeService.getAll();
  const response: ApiResponse<typeof gameTypes> = { data: gameTypes };
  res.json(response);
});

export const getGameTypeById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const gameType = GameTypeService.getById(id);

  if (!gameType) {
    throw NotFoundError('游戏类型不存在');
  }

  const response: ApiResponse<typeof gameType> = { data: gameType };
  res.json(response);
});

export const createGameType = asyncHandler(async (req: Request, res: Response) => {
  const { name, dimension_value_ids } = req.body;

  const gameType = GameTypeService.create({
    name,
    dimension_value_ids,
  });

  const response: ApiResponse<typeof gameType> = {
    data: gameType,
    message: '游戏类型创建成功',
  };
  res.status(201).json(response);
});

export const updateGameType = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { name, dimension_value_ids } = req.body;

  const gameType = GameTypeService.update(id, { name, dimension_value_ids });

  if (!gameType) {
    throw NotFoundError('游戏类型不存在');
  }

  const response: ApiResponse<typeof gameType> = {
    data: gameType,
    message: '游戏类型更新成功',
  };
  res.json(response);
});

export const deleteGameType = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  const result = GameTypeService.delete(id);

  if (!result.success) {
    throw DependenciesError(
      '该游戏类型下存在关联工具卡片或海报，请先清理后再删除。',
      result.dependencies!
    );
  }

  res.json({ data: null, message: '游戏类型删除成功' });
});

export const reorderGameTypes = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;

  GameTypeService.reorder(ids);

  res.json({ data: null, message: '排序更新成功' });
});
