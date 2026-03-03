import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types/index.js';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public dependencies?: Record<string, number>;

  constructor(statusCode: number, code: string, message: string, dependencies?: Record<string, number>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.dependencies = dependencies;
  }
}

// 预定义错误
export const ValidationError = (message: string) => new AppError(400, 'VALIDATION_ERROR', message);
export const NotFoundError = (message: string) => new AppError(404, 'NOT_FOUND', message);
export const DependenciesError = (message: string, dependencies: Record<string, number>) =>
  new AppError(409, 'HAS_DEPENDENCIES', message, dependencies);
export const DuplicateCellError = (message: string) => new AppError(409, 'DUPLICATE_CELL', message);
export const InternalError = (message: string = 'Internal server error') => new AppError(500, 'INTERNAL_ERROR', message);

// 错误处理中间件
export function errorHandler(err: Error | AppError, req: Request, res: Response, _next: NextFunction): void {
  console.error('Error:', err);

  if (err instanceof AppError) {
    const errorResponse: ApiError = {
      error: err.message,
      code: err.code,
    };
    if (err.dependencies) {
      errorResponse.dependencies = err.dependencies;
    }
    res.status(err.statusCode).json(errorResponse);
    return;
  }

  // 处理 SQLite 唯一约束错误
  if (err.message.includes('UNIQUE constraint failed')) {
    res.status(409).json({
      error: '该单元格已存在工具卡片',
      code: 'DUPLICATE_CELL',
    } as ApiError);
    return;
  }

  // 未知错误
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  } as ApiError);
}
