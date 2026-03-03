#!/usr/bin/env node
import db from '../config/database.js';

console.log('Seeding database with mock data...');

// 插入示例维度
const insertDimension = db.prepare(`
  INSERT INTO dimension (name, sort_order, created_by)
  VALUES (?, ?, 'system')
`);

const insertDimensionValue = db.prepare(`
  INSERT INTO dimension_value (dimension_id, value, sort_order, created_by)
  VALUES (?, ?, ?, 'system')
`);

// 插入游戏类型
const insertGameType = db.prepare(`
  INSERT INTO game_type (name, sort_order, created_by)
  VALUES (?, ?, 'system')
`);

// 插入工种大类
const insertRoleGroup = db.prepare(`
  INSERT INTO role_group (name, sort_order, created_by)
  VALUES (?, ?, 'system')
`);

// 插入工种子类
const insertRole = db.prepare(`
  INSERT INTO role (role_group_id, name, sort_order, created_by)
  VALUES (?, ?, ?, 'system')
`);

// 插入工具卡片
const insertToolCell = db.prepare(`
  INSERT INTO tool_cell (
    game_type_id, role_id, tool_name, maturity_level,
    official_url, short_desc, report_url, created_by
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, 'system')
`);

// 使用事务插入数据
const seed = db.transaction(() => {
  // 维度数据
  const gameplayDim = insertDimension.run('玩法', 1);
  const perspectiveDim = insertDimension.run('视角', 2);
  const artStyleDim = insertDimension.run('美术风格', 3);

  // 玩法维度取值
  insertDimensionValue.run(gameplayDim.lastInsertRowid, 'RPG', 1);
  insertDimensionValue.run(gameplayDim.lastInsertRowid, '动作', 2);
  insertDimensionValue.run(gameplayDim.lastInsertRowid, '射击', 3);
  insertDimensionValue.run(gameplayDim.lastInsertRowid, '策略', 4);

  // 视角维度取值
  insertDimensionValue.run(perspectiveDim.lastInsertRowid, '2D', 1);
  insertDimensionValue.run(perspectiveDim.lastInsertRowid, '2.5D', 2);
  insertDimensionValue.run(perspectiveDim.lastInsertRowid, '3D 第一人称', 3);
  insertDimensionValue.run(perspectiveDim.lastInsertRowid, '3D 第三人称', 4);

  // 美术风格维度取值
  insertDimensionValue.run(artStyleDim.lastInsertRowid, '写实', 1);
  insertDimensionValue.run(artStyleDim.lastInsertRowid, '卡通', 2);
  insertDimensionValue.run(artStyleDim.lastInsertRowid, '像素', 3);
  insertDimensionValue.run(artStyleDim.lastInsertRowid, '二次元', 4);

  // 游戏类型数据
  const gt1 = insertGameType.run('2.5D 俯视角 RPG', 1);
  const gt2 = insertGameType.run('3D 写实 FPS', 2);
  const gt3 = insertGameType.run('2D 像素横版动作', 3);
  const gt4 = insertGameType.run('3D 二次元开放世界', 4);

  // 工种大类数据
  const rg1 = insertRoleGroup.run('2D 美术', 1);
  const rg2 = insertRoleGroup.run('3D 美术', 2);
  const rg3 = insertRoleGroup.run('程序开发', 3);
  const rg4 = insertRoleGroup.run('策划设计', 4);

  // 工种子类数据
  const role1_1 = insertRole.run(rg1.lastInsertRowid, '2D 原画', 1);
  const role1_2 = insertRole.run(rg1.lastInsertRowid, 'UI 设计', 2);
  const role1_3 = insertRole.run(rg1.lastInsertRowid, '2D 动画', 3);

  const role2_1 = insertRole.run(rg2.lastInsertRowid, '3D 建模', 1);
  const role2_2 = insertRole.run(rg2.lastInsertRowid, '3D 动画', 2);
  const role2_3 = insertRole.run(rg2.lastInsertRowid, '技术美术', 3);

  const role3_1 = insertRole.run(rg3.lastInsertRowid, '客户端开发', 1);
  const role3_2 = insertRole.run(rg3.lastInsertRowid, '服务端开发', 2);
  const role3_3 = insertRole.run(rg3.lastInsertRowid, 'AI 工程师', 3);

  const role4_1 = insertRole.run(rg4.lastInsertRowid, '系统策划', 1);
  const role4_2 = insertRole.run(rg4.lastInsertRowid, '关卡设计', 2);
  const role4_3 = insertRole.run(rg4.lastInsertRowid, '剧情文案', 3);

  // 工具卡片数据（示例）
  // 2.5D 俯视角 RPG × 2D 原画
  insertToolCell.run(
    gt1.lastInsertRowid, role1_1.lastInsertRowid,
    'Midjourney', 5,
    'https://midjourney.com',
    'AI 图像生成工具，适用于概念设计阶段',
    null
  );

  // 2.5D 俯视角 RPG × UI 设计
  insertToolCell.run(
    gt1.lastInsertRowid, role1_2.lastInsertRowid,
    'Figma AI', 4,
    'https://figma.com',
    'AI 辅助 UI 设计工具',
    null
  );

  // 3D 写实 FPS × 3D 建模
  insertToolCell.run(
    gt2.lastInsertRowid, role2_1.lastInsertRowid,
    'NVIDIA Omniverse', 4,
    'https://nvidia.com/en-us/omniverse',
    'AI 辅助 3D 协作平台',
    null
  );

  // 3D 写实 FPS × 客户端开发
  insertToolCell.run(
    gt2.lastInsertRowid, role3_1.lastInsertRowid,
    'GitHub Copilot', 5,
    'https://github.com/features/copilot',
    'AI 代码助手，支持多种编程语言',
    null
  );

  // 2D 像素横版动作 × 2D 原画
  insertToolCell.run(
    gt3.lastInsertRowid, role1_1.lastInsertRowid,
    'Stable Diffusion', 4,
    'https://stability.ai',
    '开源 AI 图像生成工具，可本地部署',
    null
  );

  // 3D 二次元开放世界 × 2D 原画
  insertToolCell.run(
    gt4.lastInsertRowid, role1_1.lastInsertRowid,
    'NovelAI', 5,
    'https://novelai.net',
    '二次元风格 AI 绘画工具',
    null
  );

  // 3D 二次元开放世界 × 剧情文案
  insertToolCell.run(
    gt4.lastInsertRowid, role4_3.lastInsertRowid,
    'ChatGPT', 5,
    'https://openai.com/chatgpt',
    'AI 文本生成工具，辅助剧情创作',
    null
  );
});

seed();

console.log('Seed completed!');
console.log('Created:');
console.log('  - 3 dimensions with 4 values each');
console.log('  - 4 game types');
console.log('  - 4 role groups with 3 roles each (12 roles total)');
console.log('  - 7 tool cells');
