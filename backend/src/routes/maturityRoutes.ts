import { Router } from 'express';
import { getMaturityConfigs } from '../controllers/maturityController.js';

const router = Router();

// GET /api/maturity-configs - 获取成熟度配置
router.get('/', getMaturityConfigs);

export default router;
