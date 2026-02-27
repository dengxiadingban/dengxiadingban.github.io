# 快速开始指南

欢迎使用商务咨询服务平台！本指南将帮助你快速部署网站。

## 🚀 快速部署流程

### 第一步：部署 Cloudflare Worker（处理支付签名）

1. **安装 Wrangler CLI**
```bash
npm install -g wrangler
```

2. **登录 Cloudflare**
```bash
wrangler login
```

3. **部署 Worker**
```bash
wrangler deploy
```

4. **配置环境变量**
   - 访问 Cloudflare Dashboard
   - 进入你的 Worker -> Settings -> Variables
   - 添加三个环境变量：
     - `EPAY_PID_ENV`: 你的易支付商户ID
     - `EPAY_KEY_ENV`: 你的易支付密钥
     - `EPAY_API_URL_ENV`: 你的易支付API地址

5. **记录 Worker URL**
   - 例如：`https://business-consulting-payment.xxx.workers.dev`

📖 详细说明：查看 `CLOUDFLARE_DEPLOY.md`

---

### 第二步：配置前端代码

1. **修改 `script.js`**
```javascript
const EPAY_CONFIG = {
    pid: 'YOUR_PID',  // 你的易支付商户ID
    returnUrl: window.location.href,
    apiUrl: 'https://your-worker.workers.dev'  // 你的 Worker URL
};

const CUSTOMER_QQ = '123456789';  // 你的客服QQ号
```

2. **修改 `index.html`**
   - 第88行：修改客服QQ号
   - 页脚部分：修改公司名称、客服QQ、ICP备案号

---

### 第三步：部署到 GitHub Pages

1. **创建 GitHub 仓库**
   - 访问 https://github.com/new
   - 创建新仓库（Public）

2. **推送代码**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

3. **启用 GitHub Pages**
   - 仓库 Settings -> Pages
   - Source: main branch
   - Save

4. **等待部署完成**
   - 访问：`https://your-username.github.io/your-repo/`

📖 详细说明：查看 `GITHUB_DEPLOY.md`

---

### 第四步：配置易支付回调

在你的易支付平台后台，设置回调地址为：
```
https://your-username.github.io/your-repo/
```

---

### 第五步：测试

1. 访问你的网站
2. 点击"立即购买"
3. 选择支付方式
4. 完成支付流程
5. 验证是否显示密钥

---

## 📁 文件说明

### 前端文件（部署到 GitHub Pages）
- `index.html` - 主页面
- `style.css` - 样式文件
- `script.js` - JavaScript 逻辑

### 后端文件（部署到 Cloudflare Workers）
- `worker.js` - Worker 代码
- `wrangler.toml` - Worker 配置
- `package.json` - 项目配置

### 工具文件
- `verify_key.py` - Python 密钥验证工具

### 文档文件
- `README.md` - 项目说明
- `QUICKSTART.md` - 本文件
- `CLOUDFLARE_DEPLOY.md` - Cloudflare 详细部署指南
- `GITHUB_DEPLOY.md` - GitHub Pages 详细部署指南
- `BACKEND_SOLUTION.md` - 后端方案说明（参考）

---

## ✅ 部署检查清单

部署前请确认：

- [ ] Cloudflare Worker 已部署
- [ ] Worker 环境变量已配置（PID、KEY、API_URL）
- [ ] `script.js` 中的 `apiUrl` 已更新为 Worker URL
- [ ] `script.js` 中的客服QQ号已修改
- [ ] `index.html` 中的客服QQ号已修改（两处）
- [ ] `index.html` 页脚信息已修改
- [ ] GitHub Pages 已启用
- [ ] 易支付回调地址已配置
- [ ] 测试支付流程正常

---

## 🔧 常用命令

### Cloudflare Worker
```bash
# 部署 Worker
wrangler deploy

# 查看日志
wrangler tail

# 设置环境变量
wrangler secret put EPAY_KEY_ENV
```

### Git / GitHub
```bash
# 更新网站
git add .
git commit -m "更新说明"
git push

# 查看状态
git status
```

### Python 密钥验证
```bash
# 运行验证工具
python verify_key.py
```

---

## 🆘 遇到问题？

### 支付跳转失败
- 检查 Worker 是否部署成功
- 检查环境变量是否配置正确
- 查看浏览器控制台错误信息
- 运行 `wrangler tail` 查看 Worker 日志

### 支付成功后没有显示密钥
- 检查易支付回调地址是否正确
- 检查浏览器控制台是否有 JavaScript 错误
- 确认易支付返回参数格式

### GitHub Pages 显示 404
- 等待几分钟让 GitHub 完成部署
- 检查 Pages 设置中的分支是否正确
- 确认文件已成功推送到 GitHub

---

## 📞 技术架构

```
用户浏览器
    ↓
GitHub Pages (静态网站)
    ↓
Cloudflare Worker (签名服务)
    ↓
易支付平台
    ↓
返回支付结果
    ↓
显示密钥和客服QQ
```

**安全性**：
- ✅ 易支付密钥完全隐藏在 Cloudflare 服务器
- ✅ 前端代码不包含任何敏感信息
- ✅ 完全免费（Cloudflare + GitHub Pages）

---

## 💡 下一步优化

部署成功后，你可以考虑：

1. **自定义域名**：绑定自己的域名
2. **SEO优化**：添加 meta 标签，提高搜索排名
3. **统计分析**：接入 Google Analytics
4. **客服系统**：添加在线客服插件
5. **支付方式**：增加更多支付选项

---

## 📚 相关资源

- Cloudflare Workers 文档：https://developers.cloudflare.com/workers/
- GitHub Pages 文档：https://docs.github.com/pages
- Git 教程：https://git-scm.com/book/zh/v2

---

## 🎉 完成！

恭喜你完成部署！现在你可以开始接受订单了。

记得：
- 定期检查易支付后台的订单
- 及时回复客户的咨询
- 妥善保管密钥验证工具

祝生意兴隆！💰

