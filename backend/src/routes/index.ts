import { Router, Request, Response } from 'express';
import { ApiResponse } from '../types/index.js';

// 导入各模块路由
import gameTypeRoutes from './gameTypeRoutes.js';
import roleRoutes from './roleRoutes.js';
import toolCellRoutes from './toolCellRoutes.js';
import dimensionRoutes from './dimensionRoutes.js';
import maturityRoutes from './maturityRoutes.js';

const router = Router();

// ============ 基础路由 ============

// 健康检查
router.get('/health', (_req: Request, res: Response) => {
  const response: ApiResponse<{ status: string; timestamp: string }> = {
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  };
  res.json(response);
});

// API 版本信息
router.get('/version', (_req: Request, res: Response) => {
  const response: ApiResponse<{ version: string; name: string }> = {
    data: {
      version: '1.0.0',
      name: 'AI 行业温度计 API',
    },
  };
  res.json(response);
});

// ============ 业务路由 ============

// 游戏类型路由
router.use('/game-types', gameTypeRoutes);

// 工种路由（包含大类和子类）
router.use('/role-groups', roleRoutes);
router.use('/roles', roleRoutes);

// 工具卡片路由
router.use('/tool-cells', toolCellRoutes);

// 维度路由（包含维度和取值）
router.use('/dimensions', dimensionRoutes);

// 成熟度配置路由
router.use('/maturity-configs', maturityRoutes);

export default router;
