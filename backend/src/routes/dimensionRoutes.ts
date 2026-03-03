import { Router } from 'express';
import {
  getDimensions,
  getDimensionById,
  createDimension,
  updateDimension,
  deleteDimension,
  reorderDimensions,
  getDimensionValues,
  createDimensionValue,
  updateDimensionValue,
  deleteDimensionValue,
  reorderDimensionValues,
} from '../controllers/dimensionController.js';
import { requireBody, requireParams, validateLength, validateNonEmptyArray } from '../middleware/validate.js';

const router = Router();

// ============ Dimension 路由 ============

// GET /api/dimensions - 获取维度列表
router.get('/', getDimensions);

// GET /api/dimensions/:id - 获取单个维度
router.get('/:id', getDimensionById);

// POST /api/dimensions - 创建维度
router.post('/',
  requireBody('name'),
  validateLength('name', 1, 100),
  createDimension
);

// PUT /api/dimensions/:id - 更新维度
router.put('/:id',
  requireParams('id'),
  validateLength('name', 1, 100),
  updateDimension
);

// DELETE /api/dimensions/:id - 删除维度
router.delete('/:id', requireParams('id'), deleteDimension);

// PUT /api/dimensions/sort - 批量更新维度排序
router.put('/sort',
  requireBody('ids'),
  validateNonEmptyArray('ids'),
  reorderDimensions
);

// ============ DimensionValue 路由 ============

// GET /api/dimension-values - 获取维度取值列表
router.get('/values', getDimensionValues);

// POST /api/dimension-values - 创建维度取值
router.post('/values',
  requireBody('dimension_id', 'value'),
  validateLength('value', 1, 100),
  createDimensionValue
);

// PUT /api/dimension-values/:id - 更新维度取值
router.put('/values/:id',
  requireParams('id'),
  validateLength('value', 1, 100),
  updateDimensionValue
);

// DELETE /api/dimension-values/:id - 删除维度取值
router.delete('/values/:id', requireParams('id'), deleteDimensionValue);

// PUT /api/dimension-values/sort - 批量更新取值排序
router.put('/values/sort',
  requireBody('dimension_id', 'ids'),
  validateNonEmptyArray('ids'),
  reorderDimensionValues
);

export default router;
