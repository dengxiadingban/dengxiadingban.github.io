// 反推密钥工具
// 如果你知道正确的签名，可以尝试不同的密钥

const crypto = require('crypto');

const signStr = 'money=19.9&name=个体工商户业务咨询&out_trade_no=ORDER1772194917982956&pid=1013&return_url=https://dengxiadingban.github.io/&type=wxpay';
const targetSign = '27e8444764931073c256ff30798efdcb';

console.log('签名字符串:', signStr);
console.log('目标签名:', targetSign);
console.log('');

// 测试一些可能的密钥格式
const possibleKeys = [
  'O6vYiY855iuZxDdzLMX7XIVXilyUhYZB', // 原密钥
  'o6vyiy855iuzxddzlmx7xivxilyuhyzb', // 小写
  'O6VYIY855IUZXDDZLMX7XIVXILYUHYZB', // 大写
];

console.log('测试不同的密钥格式：');
console.log('');

for (const key of possibleKeys) {
  const testStr = signStr + key;
  const sign = crypto.createHash('md5').update(testStr).digest('hex');
  console.log(`密钥: ${key}`);
  console.log(`MD5: ${sign}`);
  console.log(`匹配: ${sign === targetSign ? '✓' : '✗'}`);
  console.log('');
}

console.log('='.repeat(60));
console.log('');
console.log('如果以上都不匹配，请：');
console.log('1. 登录易支付商户后台');
console.log('2. 查看"商户密钥"或"API密钥"');
console.log('3. 确认密钥是否正确');
console.log('4. 检查 Cloudflare Workers 环境变量 EPAY_KEY_ENV 是否设置正确');

