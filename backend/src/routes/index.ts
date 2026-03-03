import { Router, Request, Response } from 'express';
import { ApiResponse } from '../types/index.js';

const router = Router();

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

export default router;
