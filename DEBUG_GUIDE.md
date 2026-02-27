# 调试指南

## 问题诊断

你遇到的问题是：跳转到了易支付URL，但没有显示支付界面。

可能的原因：
1. **MD5签名错误** - Cloudflare Workers 的 Web Crypto API 不支持 MD5
2. **签名字符串拼接错误** - 参数顺序或格式不对
3. **易支付平台配置问题** - API地址或参数格式不匹配

## 已修复的问题

我已经修复了以下问题：

### 1. 添加了完整的MD5实现
原来的代码使用 `crypto.subtle.digest('MD5')` 会失败，因为 Web Crypto API 不支持 MD5。
现在使用纯 JavaScript 实现的 MD5 算法。

### 2. 添加了详细的调试信息
- Worker 会在控制台输出签名字符串和签名值
- 前端会在控制台输出 Worker 返回的所有信息
- 可以对比签名是否正确

## 重新部署步骤

### 1. 重新部署 Worker

```bash
# 在项目目录下运行
wrangler deploy
```

### 2. 清除浏览器缓存

按 `Ctrl + Shift + Delete`，清除缓存和Cookie。

### 3. 测试支付流程

1. 打开你的网站
2. 按 `F12` 打开浏览器开发者工具
3. 切换到 **Console（控制台）** 标签
4. 点击"立即购买"并选择支付方式
5. 查看控制台输出的调试信息

### 4. 查看 Worker 日志

在另一个终端窗口运行：

```bash
wrangler tail
```

这会实时显示 Worker 的日志输出。

## 调试信息说明

### 前端控制台会显示：

```javascript
Worker返回数据: {
  success: true,
  payUrl: "https://...",
  orderId: "ORDER...",
  debug: {
    signString: "money=19.9&name=个体工商户业务咨询&...",
    sign: "4228c52c596d59c6701c6b8394c109a5",
    params: {...}
  }
}
```

### Worker 日志会显示：

```
收到支付请求: {"type":"wechat","out_trade_no":"ORDER..."}
环境变量检查: {"hasPID":true,"hasKEY":true,"hasURL":true}
签名信息: {"signString":"...","sign":"..."}
生成的支付URL: https://...
```

## 验证签名是否正确

### 方法1：手动验证

1. 从控制台复制 `signString`（签名字符串）
2. 访问在线MD5工具：https://www.md5hashgenerator.com/
3. 粘贴签名字符串，生成MD5
4. 对比生成的MD5是否与 `sign` 一致

### 方法2：对比易支付文档

查看你的易支付平台文档，确认：
1. 签名字符串的拼接格式是否正确
2. 是否需要对某些参数进行URL编码
3. 是否有其他特殊要求

## 常见问题排查

### 问题1：签名验证失败

**症状**：跳转到易支付页面，但显示"签名验证失败"

**解决方法**：
1. 检查 Worker 环境变量中的 `EPAY_KEY_ENV` 是否正确
2. 查看易支付文档，确认签名算法
3. 对比调试信息中的签名字符串格式

### 问题2：参数错误

**症状**：易支付页面显示"参数错误"或"缺少必需参数"

**解决方法**：
1. 检查 `EPAY_API_URL_ENV` 是否正确
2. 确认易支付平台要求的参数格式
3. 查看 Worker 日志中的参数信息

### 问题3：PID不存在

**症状**：易支付页面显示"商户不存在"

**解决方法**：
1. 检查 Worker 环境变量中的 `EPAY_PID_ENV` 是否正确
2. 确认易支付账号是否已激活

## 易支付签名算法说明

标准的易支付签名算法：

```
1. 将所有参数（除sign和sign_type）按键名排序
2. 拼接成：key1=value1&key2=value2&...
3. 在末尾添加密钥：...&your_key
4. 对整个字符串进行MD5加密
5. 得到32位小写的MD5值
```

示例：
```
原始参数：
money=19.9
name=个体工商户业务咨询
notify_url=
out_trade_no=ORDER1772191705873
pid=1013
return_url=https://dengxiadingban.github.io/
sitename=商务咨询服务平台
type=wechat

排序后拼接：
money=19.9&name=个体工商户业务咨询&notify_url=&out_trade_no=ORDER1772191705873&pid=1013&return_url=https://dengxiadingban.github.io/&sitename=商务咨询服务平台&type=wechat&YOUR_KEY

MD5加密后：
4228c52c596d59c6701c6b8394c109a5
```

## 特殊情况处理

### 如果易支付要求不同的签名算法

有些易支付平台可能有特殊要求，例如：
- 空值参数不参与签名
- 需要URL编码
- 密钥位置不同

请查看你的易支付平台文档，如果有特殊要求，告诉我，我会修改代码。

## 下一步

1. 重新部署 Worker
2. 打开浏览器控制台
3. 测试支付流程
4. 将控制台输出的调试信息发给我
5. 我会帮你分析问题所在

## 联系易支付客服

如果签名正确但仍然无法支付，建议联系易支付平台客服：
1. 提供你的商户ID
2. 提供测试订单号
3. 询问具体的错误原因

他们可以在后台查看详细的错误日志。

