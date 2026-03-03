import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../../data/db/app.db');

// 确保目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
const db: DatabaseType = new Database(DB_PATH);

// 启用外键约束
db.pragma('foreign_keys = ON');

// 启用 WAL 模式以提高性能
db.pragma('journal_mode = WAL');

export default db;
