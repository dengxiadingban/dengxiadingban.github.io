// 测试不包含notify_url参数的签名
const crypto = require('crypto');

const params = {
  pid: '1013',
  type: 'wxpay',
  out_trade_no: 'ORDER1772194917982956',
  // 注意：这里完全不包含 notify_url
  return_url: 'https://dengxiadingban.github.io/',
  name: '个体工商户业务咨询',
  money: '19.9'
};

const key = 'O6vYiY855iuZxDdzLMX7XIVXilyUhYZB';
const targetSign = '27e8444764931073c256ff30798efdcb';

console.log('=== 测试不包含notify_url参数 ===\n');

const sortedKeys = Object.keys(params).sort();
let signStr = '';

for (const k of sortedKeys) {
  signStr += k + '=' + params[k] + '&';
}

signStr = signStr.slice(0, -1);
console.log('签名字符串（不含密钥）:', signStr);

signStr += key;
console.log('签名字符串（含密钥）:', signStr);

const sign = crypto.createHash('md5').update(signStr).digest('hex');
console.log('\nMD5结果:', sign);
console.log('目标签名:', targetSign);
console.log('是否匹配:', sign === targetSign ? '✓ 是' : '✗ 否');

