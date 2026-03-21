#!/usr/bin/env node

/**
 * 构建脚本：将环境变量注入到 config.js
 * 用于 Cloudflare Pages 部署
 * 
 * 使用方法：
 *   node build.js
 * 
 * 环境变量：
 *   EPAY_KEY - 易支付商户密钥
 *   EPAY_PID - 易支付商户ID（默认：1013）
 */

const fs = require('fs');
const path = require('path');

// 读取环境变量
const EPAY_KEY = process.env.EPAY_KEY || '';
const EPAY_PID = process.env.EPAY_PID || '1013';

// 配置文件路径
const configPath = path.join(__dirname, 'config.js');

// 生成配置内容
const configContent = `// 易支付商户密钥配置
// Cloudflare Pages 环境变量注入
// 此文件由 build.js 脚本自动生成，不要手动编辑
window.EPAY_CONFIG_INJECTED = {
  key: '${EPAY_KEY}',
  pid: '${EPAY_PID}'
};
`;

// 写入配置文件
try {
  fs.writeFileSync(configPath, configContent, 'utf8');
  console.log('✓ 配置文件已生成');
  console.log(`  - EPAY_PID: ${EPAY_PID}`);
  console.log(`  - EPAY_KEY: ${EPAY_KEY ? '已设置' : '未设置（使用默认值）'}`);
} catch (err) {
  console.error('✗ 生成配置文件失败:', err.message);
  process.exit(1);
}

