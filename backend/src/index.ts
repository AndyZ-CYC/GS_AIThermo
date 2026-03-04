import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDatabase } from './models/schema.js';
import { errorHandler } from './middleware/errorHandler.js';
import baseRoutes from './routes/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 初始化数据库
initDatabase();

// CORS 配置 - 允许多个前端端口
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // 允许无origin的请求（如移动端应用、curl等）
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（海报图片）
const uploadsDir = path.join(__dirname, '../data/uploads');
app.use('/uploads', express.static(uploadsDir));

// API 路由
app.use('/api', baseRoutes);

// 404 处理
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    code: 'NOT_FOUND',
  });
});

// 错误处理中间件
app.use(errorHandler);

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
