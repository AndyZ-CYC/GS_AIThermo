import { Request, Response } from 'express';
import { DimensionService } from '../services/dimensionService.js';
import { ApiResponse } from '../types/index.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { NotFoundError, DependenciesError, ValidationError } from '../middleware/errorHandler.js';

// Dimension 控制器
export const getDimensions = asyncHandler(async (_req: Request, res: Response) => {
  const dimensions = DimensionService.getAll();
  const response: ApiResponse<typeof dimensions> = { data: dimensions };
  res.json(response);
});

export const getDimensionById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const dimension = DimensionService.getById(id);

  if (!dimension) {
    throw NotFoundError('维度不存在');
  }

  const response: ApiResponse<typeof dimension> = { data: dimension };
  res.json(response);
});

export const createDimension = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  const dimension = DimensionService.create(name);

  const response: ApiResponse<typeof dimension> = {
    data: dimension,
    message: '维度创建成功',
  };
  res.status(201).json(response);
});

export const updateDimension = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { name } = req.body;

  const dimension = DimensionService.update(id, name);

  if (!dimension) {
    throw NotFoundError('维度不存在');
  }

  const response: ApiResponse<typeof dimension> = {
    data: dimension,
    message: '维度更新成功',
  };
  res.json(response);
});

export const deleteDimension = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  const result = DimensionService.delete(id);

  if (!result.success) {
    throw DependenciesError(
      `该维度下存在 ${result.dependencies!.dimension_values} 个取值，请先删除所有取值后再删除此维度。`,
      result.dependencies!
    );
  }

  res.json({ data: null, message: '维度删除成功' });
});

export const reorderDimensions = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;
  DimensionService.reorder(ids);
  res.json({ data: null, message: '排序更新成功' });
});

// DimensionValue 控制器
export const getDimensionValues = asyncHandler(async (_req: Request, res: Response) => {
  const values = DimensionService.getAllValues();
  const response: ApiResponse<typeof values> = { data: values };
  res.json(response);
});

export const createDimensionValue = asyncHandler(async (req: Request, res: Response) => {
  const { dimension_id, value } = req.body;
  const dimValue = DimensionService.createValue(dimension_id, value);

  const response: ApiResponse<typeof dimValue> = {
    data: dimValue,
    message: '维度取值创建成功',
  };
  res.status(201).json(response);
});

export const updateDimensionValue = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const { value } = req.body;

  const dimValue = DimensionService.updateValue(id, value);

  if (!dimValue) {
    throw NotFoundError('维度取值不存在');
  }

  const response: ApiResponse<typeof dimValue> = {
    data: dimValue,
    message: '维度取值更新成功',
  };
  res.json(response);
});

export const deleteDimensionValue = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  const result = DimensionService.deleteValue(id);

  if (!result.success) {
    throw DependenciesError(
      `该维度取值已被 ${result.dependencies!.game_types} 个游戏类型关联，请先解除关联后再删除。`,
      result.dependencies!
    );
  }

  res.json({ data: null, message: '维度取值删除成功' });
});

export const reorderDimensionValues = asyncHandler(async (req: Request, res: Response) => {
  const { dimension_id, ids } = req.body;

  try {
    DimensionService.reorderValues(dimension_id, ids);
    res.json({ data: null, message: '排序更新成功' });
  } catch (error) {
    throw ValidationError((error as Error).message);
  }
});
