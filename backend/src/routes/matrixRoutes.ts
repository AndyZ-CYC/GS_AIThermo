import { Router } from 'express';
import { getMatrixData } from '../services/matrixService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

// 获取矩阵数据（一次性加载所有数据）
router.get('/', asyncHandler(async (_req, res) => {
  const data = getMatrixData();
  res.json({ data });
}));

export default router;
