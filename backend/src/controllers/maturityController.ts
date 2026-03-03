import { Request, Response } from 'express';
import { MaturityService } from '../services/maturityService.js';
import { ApiResponse } from '../types/index.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const getMaturityConfigs = asyncHandler(async (_req: Request, res: Response) => {
  const configs = MaturityService.getAll();
  const response: ApiResponse<typeof configs> = { data: configs };
  res.json(response);
});
