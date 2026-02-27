# Cloudflare Workers 部署指南

本指南将帮助你部署易支付签名服务到Cloudflare Workers，实现安全的支付功能。

## 前置准备

1. 注册 Cloudflare 账号：https://dash.cloudflare.com/sign-up
2. 安装 Node.js（如果还没有）：https://nodejs.org/

## 步骤一：安装 Wrangler CLI

Wrangler 是 Cloudflare Workers 的命令行工具。

```bash
# 使用 npm 安装
npm install -g wrangler

# 或使用 yarn
yarn global add wrangler
```

验证安装：
```bash
wrangler --version
```

## 步骤二：登录 Cloudflare

```bash
wrangler login
```

这会打开浏览器，让你授权 Wrangler 访问你的 Cloudflare 账号。

## 步骤三：修改配置文件

编辑 `wrangler.toml` 文件，修改 Worker 名称（可选）：

```toml
name = "business-consulting-payment"  # 可以改成你喜欢的名字
main = "worker.js"
compatibility_date = "2024-01-01"
```

**注意**：不要在 `wrangler.toml` 中填写真实的密钥！

## 步骤四：部署 Worker

在项目目录下运行：

```bash
wrangler deploy
```

部署成功后，你会看到类似这样的输出：

```
✨ Success! Uploaded 1 file (0.xx sec)
Published business-consulting-payment (0.xx sec)
  https://business-consulting-payment.your-subdomain.workers.dev
```

**记下这个 URL**，这就是你的 Worker API 地址！

## 步骤五：配置环境变量

环境变量用于存储易支付的敏感信息（PID、KEY、API地址）。

### 方法1：通过 Cloudflare Dashboard（推荐）

1. 访问 Cloudflare Dashboard：https://dash.cloudflare.com/
2. 进入 **Workers & Pages**
3. 找到你的 Worker（`business-consulting-payment`）
4. 点击 **Settings** -> **Variables**
5. 在 **Environment Variables** 部分，添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `EPAY_PID_ENV` | 你的易支付商户ID | 例如：10001 |
| `EPAY_KEY_ENV` | 你的易支付密钥 | 例如：abcd1234... |
| `EPAY_API_URL_ENV` | 你的易支付API地址 | 例如：https://pay.example.com/submit.php |

6. 点击 **Save and Deploy**

### 方法2：通过命令行

```bash
# 设置 PID
wrangler secret put EPAY_PID_ENV
# 输入你的易支付商户ID后按回车

# 设置 KEY
wrangler secret put EPAY_KEY_ENV
# 输入你的易支付密钥后按回车

# 设置 API URL
wrangler secret put EPAY_API_URL_ENV
# 输入你的易支付API地址后按回车
```

## 步骤六：修改前端配置

编辑 `script.js` 文件，将 Worker URL 填入配置：

```javascript
const EPAY_CONFIG = {
    pid: 'YOUR_PID',  // 你的易支付商户ID（可以公开）
    returnUrl: window.location.href,
    // 替换为你的 Worker 地址
    apiUrl: 'https://business-consulting-payment.your-subdomain.workers.dev'
};
```

## 步骤七：测试支付功能

1. 将修改后的前端代码部署到 GitHub Pages
2. 访问你的网站
3. 点击"立即购买"按钮
4. 选择支付方式
5. 应该会正常跳转到易支付页面

## 验证 Worker 是否正常工作

你可以使用 curl 测试 Worker：

```bash
curl -X POST https://business-consulting-payment.dengxia.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "type": "alipay",
    "out_trade_no": "TEST123456",
    "name": "测试订单",
    "money": "0.01",
    "return_url": "https://example.com"
  }'
```

如果配置正确，应该返回包含 `payUrl` 的 JSON 响应。

## 常见问题

### Q1: 部署后提示 "EPAY_PID_ENV is not defined"

**解决方法**：环境变量没有配置。请按照步骤五配置环境变量。

### Q2: 支付时提示 "CORS error"

**解决方法**：Worker 代码已经包含 CORS 头，如果还有问题，检查浏览器控制台的具体错误信息。

### Q3: 如何查看 Worker 日志？

```bash
wrangler tail
```

这会实时显示 Worker 的日志输出。

### Q4: 如何更新 Worker？

修改 `worker.js` 后，重新运行：

```bash
wrangler deploy
```

### Q5: Cloudflare Workers 免费吗？

是的！免费计划包括：
- 每天 100,000 次请求
- 10ms CPU 时间/请求
- 对于个人网站完全够用

## 安全性说明

✅ **优点**：
- 易支付密钥完全隐藏在 Cloudflare 服务器端
- 前端代码不包含任何敏感信息
- 环境变量加密存储
- 完全免费

✅ **最佳实践**：
- 定期更换易支付密钥
- 监控 Worker 的请求日志
- 可以添加请求频率限制防止滥用

## 自定义域名（可选）

如果你有自己的域名，可以将 Worker 绑定到自定义域名：

1. 在 Cloudflare Dashboard 中进入你的 Worker
2. 点击 **Triggers** -> **Custom Domains**
3. 添加你的域名（例如：api.yourdomain.com）
4. 更新前端配置中的 `apiUrl`

## 下一步

完成部署后：
1. 测试完整的支付流程
2. 部署前端到 GitHub Pages
3. 在易支付后台配置回调地址
4. 开始接受真实订单！

## 需要帮助？

- Cloudflare Workers 文档：https://developers.cloudflare.com/workers/
- Wrangler 文档：https://developers.cloudflare.com/workers/wrangler/
- 易支付文档：查看你的易支付平台提供的文档

祝你部署顺利！🚀

