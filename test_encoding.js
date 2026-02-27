// 测试字符编码问题
const crypto = require('crypto');
const iconv = require('iconv-lite');

const signStrBase = 'money=19.9&name=个体工商户业务咨询&out_trade_no=ORDER1772194917982956&pid=1013&return_url=https://dengxiadingban.github.io/&type=wxpay';
const key = 'O6vYiY855iuZxDdzLMX7XIVXilyUhYZB';
const targetSign = '27e8444764931073c256ff30798efdcb';

console.log('=== 测试不同字符编码 ===\n');
console.log('目标签名:', targetSign);
console.log('');

// UTF-8编码（默认）
const utf8Str = signStrBase + key;
const utf8Sign = crypto.createHash('md5').update(utf8Str, 'utf8').digest('hex');
console.log('UTF-8编码:');
console.log('  MD5:', utf8Sign);
console.log('  匹配:', utf8Sign === targetSign ? '✓' : '✗');
console.log('');

// GBK编码
try {
    const gbkBuffer = iconv.encode(signStrBase + key, 'gbk');
    const gbkSign = crypto.createHash('md5').update(gbkBuffer).digest('hex');
    console.log('GBK编码:');
    console.log('  MD5:', gbkSign);
    console.log('  匹配:', gbkSign === targetSign ? '✓' : '✗');
} catch(e) {
    console.log('GBK编码: 需要安装 iconv-lite 模块');
    console.log('  运行: npm install iconv-lite');
}

