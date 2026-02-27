// MD5 测试工具
// 用于验证签名是否正确

const testString = "money=19.9&name=个体工商户业务咨询&notify_url=&out_trade_no=ORDER1772193545604297&pid=1013&return_url=https://dengxiadingban.github.io/&sitename=商务咨询服务平台&type=wechat&O6vYiY855iuZxDdzLMX7XIVXilyUhYZB";

console.log("测试字符串:", testString);
console.log("\n请访问以下网站验证MD5:");
console.log("https://www.md5hashgenerator.com/");
console.log("\n或使用在线工具:");
console.log("https://tool.oschina.net/encrypt?type=2");
console.log("\n将上面的测试字符串粘贴进去，查看生成的MD5值");
console.log("\n如果MD5值不是: 36XXGxiYDigrQgg5xz4n45bcBW7qeYyW35");
console.log("说明我们的MD5算法有问题");

