// 测试不同的签名方式
const crypto = require('crypto');

const params = {
  pid: '1013',
  type: 'wxpay',
  out_trade_no: 'ORDER1772194917982956',
  notify_url: '',
  return_url: 'https://dengxiadingban.github.io/',
  name: '个体工商户业务咨询',
  money: '19.9'
};

const key = 'O6vYiY855iuZxDdzLMX7XIVXilyUhYZB'; // 你的密钥
const targetSign = '27e8444764931073c256ff30798efdcb';

console.log('目标签名:', targetSign);
console.log('');

// 方式1：排序后拼接，包含空值，直接加密钥
const sorted1 = Object.keys(params).sort();
let str1 = '';
for (const k of sorted1) {
  if (k !== 'sign' && k !== 'sign_type') {
    str1 += k + '=' + params[k] + '&';
  }
}
str1 = str1.slice(0, -1) + key;
const sign1 = crypto.createHash('md5').update(str1).digest('hex');
console.log('方式1（包含空值，直接拼接密钥）:');
console.log('签名字符串:', str1);
console.log('MD5结果:', sign1);
console.log('是否匹配:', sign1 === targetSign);
console.log('');

// 方式2：排序后拼接，排除空值，直接加密钥
const sorted2 = Object.keys(params).sort();
let str2 = '';
for (const k of sorted2) {
  if (params[k] !== '' && k !== 'sign' && k !== 'sign_type') {
    str2 += k + '=' + params[k] + '&';
  }
}
str2 = str2.slice(0, -1) + key;
const sign2 = crypto.createHash('md5').update(str2).digest('hex');
console.log('方式2（排除空值，直接拼接密钥）:');
console.log('签名字符串:', str2);
console.log('MD5结果:', sign2);
console.log('是否匹配:', sign2 === targetSign);
console.log('');

// 方式3：排序后拼接，排除空值，&key=密钥
const sorted3 = Object.keys(params).sort();
let str3 = '';
for (const k of sorted3) {
  if (params[k] !== '' && k !== 'sign' && k !== 'sign_type') {
    str3 += k + '=' + params[k] + '&';
  }
}
str3 = str3 + 'key=' + key;
const sign3 = crypto.createHash('md5').update(str3).digest('hex');
console.log('方式3（排除空值，&key=密钥）:');
console.log('签名字符串:', str3);
console.log('MD5结果:', sign3);
console.log('是否匹配:', sign3 === targetSign);
console.log('');

// 方式4：排序后拼接，包含空值，&key=密钥
const sorted4 = Object.keys(params).sort();
let str4 = '';
for (const k of sorted4) {
  if (k !== 'sign' && k !== 'sign_type') {
    str4 += k + '=' + params[k] + '&';
  }
}
str4 = str4 + 'key=' + key;
const sign4 = crypto.createHash('md5').update(str4).digest('hex');
console.log('方式4（包含空值，&key=密钥）:');
console.log('签名字符串:', str4);
console.log('MD5结果:', sign4);
console.log('是否匹配:', sign4 === targetSign);

