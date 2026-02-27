// 完整测试易支付签名
const crypto = require('crypto');

// 模拟参数
const params = {
  pid: '1013',
  type: 'wxpay',
  out_trade_no: 'ORDER1772194917982956',
  notify_url: '', // 空值
  return_url: 'https://dengxiadingban.github.io/',
  name: '个体工商户业务咨询',
  money: '19.9'
};

const key = 'O6vYiY855iuZxDdzLMX7XIVXilyUhYZB';
const targetSign = '27e8444764931073c256ff30798efdcb';

console.log('=== 易支付MD5签名测试 ===\n');
console.log('目标签名:', targetSign);
console.log('');

// 按照文档要求：排除空值、sign、sign_type
const sortedKeys = Object.keys(params).sort();
console.log('排序后的键:', sortedKeys);
console.log('');

let signStr = '';
const includedParams = [];

for (const k of sortedKeys) {
  const value = params[k];
  const isEmpty = value === '' || value === null || value === undefined;
  const isSignField = k === 'sign' || k === 'sign_type';
  
  console.log(`参数: ${k} = "${value}"`);
  console.log(`  - 是否为空: ${isEmpty}`);
  console.log(`  - 是否为签名字段: ${isSignField}`);
  console.log(`  - 是否参与签名: ${!isEmpty && !isSignField}`);
  
  if (!isEmpty && !isSignField) {
    signStr += k + '=' + value + '&';
    includedParams.push(k);
  }
  console.log('');
}

// 去掉最后一个&
signStr = signStr.slice(0, -1);

console.log('参与签名的参数:', includedParams.join(', '));
console.log('');
console.log('签名字符串（不含密钥）:', signStr);
console.log('');

// 拼接密钥
const signStrWithKey = signStr + key;
console.log('签名字符串（含密钥）:', signStrWithKey);
console.log('');

// MD5加密
const sign = crypto.createHash('md5').update(signStrWithKey).digest('hex');
console.log('MD5结果:', sign);
console.log('目标签名:', targetSign);
console.log('是否匹配:', sign === targetSign);
console.log('');

if (sign !== targetSign) {
  console.log('❌ 签名不匹配！');
  console.log('');
  console.log('可能的原因：');
  console.log('1. 密钥不正确');
  console.log('2. 参数值有差异（如URL编码问题）');
  console.log('3. 易支付平台有特殊的签名规则');
}

