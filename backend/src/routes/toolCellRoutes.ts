import { Router } from 'express';
import {
  getToolCells,
  getToolCellByCell,
  getToolCellById,
  createToolCell,
  updateToolCell,
  deleteToolCell,
} from '../controllers/toolCellController.js';
import { requireBody, requireParams, validateLength, validateRange, validateUrl } from '../middleware/validate.js';

const router = Router();

// GET /api/tool-cells - 获取所有工具卡片
router.get('/', getToolCells);

// GET /api/tool-cells/cell/:gameTypeId/:roleId - 获取单元格工具
router.get('/cell/:gameTypeId/:roleId', getToolCellByCell);

// GET /api/tool-cells/:id - 获取单个工具卡片
router.get('/:id', getToolCellById);

// POST /api/tool-cells - 创建工具卡片
router.post('/',
  requireBody('game_type_id', 'role_id', 'tool_name', 'maturity_level', 'official_url', 'short_desc'),
  validateLength('tool_name', 1, 200),
  validateRange('maturity_level', 1, 5),
  validateLength('short_desc', 1, 500),
  validateUrl('official_url', true),
  validateUrl('report_url', false),
  createToolCell
);

// PUT /api/tool-cells/:id - 更新工具卡片
router.put('/:id',
  requireParams('id'),
  validateLength('tool_name', 1, 200),
  validateRange('maturity_level', 1, 5),
  validateLength('short_desc', 1, 500),
  validateUrl('official_url', false),
  validateUrl('report_url', false),
  updateToolCell
);

// DELETE /api/tool-cells/:id - 删除工具卡片
router.delete('/:id', requireParams('id'), deleteToolCell);

export default router;
