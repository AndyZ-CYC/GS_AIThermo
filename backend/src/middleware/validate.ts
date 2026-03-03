import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ValidationError } from './errorHandler.js';

/**
 * 验证请求体必填字段
 * @param fields 必填字段名数组
 */
export function requireBody(...fields: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.body || typeof req.body !== 'object') {
      next(ValidationError('请求体不能为空'));
      return;
    }

    const missingFields: string[] = [];
    for (const field of fields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      next(ValidationError(`缺少必填字段: ${missingFields.join(', ')}`));
      return;
    }

    next();
  };
}

/**
 * 验证路由参数必填
 * @param params 参数名数组
 */
export function requireParams(...params: string[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const missingParams: string[] = [];
    for (const param of params) {
      if (!req.params[param]) {
        missingParams.push(param);
      }
    }

    if (missingParams.length > 0) {
      next(ValidationError(`缺少路由参数: ${missingParams.join(', ')}`));
      return;
    }

    next();
  };
}

/**
 * 验证数值范围
 * @param field 字段名
 * @param min 最小值
 * @param max 最大值
 */
export function validateRange(field: string, min: number, max: number): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.body[field];

    if (value !== undefined) {
      if (typeof value !== 'number' || value < min || value > max) {
        next(ValidationError(`${field} 必须是 ${min} 到 ${max} 之间的数值`));
        return;
      }
    }

    next();
  };
}

/**
 * 验证字符串长度
 * @param field 字段名
 * @param minLength 最小长度
 * @param maxLength 最大长度
 */
export function validateLength(field: string, minLength: number, maxLength: number): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.body[field];

    if (value !== undefined) {
      if (typeof value !== 'string' || value.length < minLength || value.length > maxLength) {
        next(ValidationError(`${field} 长度必须在 ${minLength} 到 ${maxLength} 个字符之间`));
        return;
      }
    }

    next();
  };
}

/**
 * 验证 URL 格式
 * @param field 字段名
 * @param required 是否必填
 */
export function validateUrl(field: string, required: boolean = false): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.body[field];

    if (!value && !required) {
      next();
      return;
    }

    if (value) {
      try {
        new URL(value);
      } catch {
        next(ValidationError(`${field} 不是有效的 URL`));
        return;
      }
    }

    next();
  };
}

/**
 * 验证数组非空
 * @param field 字段名
 */
export function validateNonEmptyArray(field: string): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const value = req.body[field];

    if (value !== undefined) {
      if (!Array.isArray(value) || value.length === 0) {
        next(ValidationError(`${field} 必须是非空数组`));
        return;
      }
    }

    next();
  };
}
