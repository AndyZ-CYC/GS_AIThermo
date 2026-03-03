import db from '../config/database.js';
import type { MaturityConfig } from '../types/index.js';

export class MaturityService {
  // 获取所有成熟度配置
  static getAll(): MaturityConfig[] {
    return db.prepare(`
      SELECT * FROM maturity_config
      ORDER BY sort_order ASC
    `).all() as MaturityConfig[];
  }

  // 根据 level 获取配置
  static getByLevel(level: number): MaturityConfig | null {
    return db.prepare(`
      SELECT * FROM maturity_config WHERE level = ?
    `).get(level) as MaturityConfig | null;
  }
}
