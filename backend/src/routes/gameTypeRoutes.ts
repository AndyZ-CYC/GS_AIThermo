import { Router } from 'express';
import {
  getGameTypes,
  getGameTypeById,
  createGameType,
  updateGameType,
  deleteGameType,
  reorderGameTypes,
} from '../controllers/gameTypeController.js';
import { requireBody, requireParams, validateLength, validateNonEmptyArray } from '../middleware/validate.js';

const router = Router();

// GET /api/game-types - 获取游戏类型列表
router.get('/', getGameTypes);

// GET /api/game-types/:id - 获取单个游戏类型
router.get('/:id', getGameTypeById);

// POST /api/game-types - 创建游戏类型
router.post('/',
  requireBody('name'),
  validateLength('name', 1, 100),
  createGameType
);

// PUT /api/game-types/:id - 更新游戏类型
router.put('/:id',
  requireParams('id'),
  validateLength('name', 1, 100),
  updateGameType
);

// DELETE /api/game-types/:id - 删除游戏类型
router.delete('/:id', requireParams('id'), deleteGameType);

// PUT /api/game-types/sort - 批量更新排序
router.put('/sort',
  requireBody('ids'),
  validateNonEmptyArray('ids'),
  reorderGameTypes
);

export default router;
