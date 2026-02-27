# 部署到 GitHub Pages 指南

本指南将帮助你将商务咨询服务网站部署到 GitHub Pages。

## 前置准备

1. GitHub 账号
2. Git 已安装（下载：https://git-scm.com/）

## 步骤一：创建 GitHub 仓库

1. 访问 GitHub：https://github.com/
2. 点击右上角的 **+** -> **New repository**
3. 填写仓库信息：
   - Repository name: `business-consulting`（或其他名称）
   - Description: 商务咨询服务平台
   - Public（公开）
   - 不要勾选 "Initialize this repository with a README"
4. 点击 **Create repository**

## 步骤二：初始化本地仓库

在项目目录下打开终端（PowerShell），运行以下命令：

```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: 商务咨询服务平台"

# 设置主分支名称
git branch -M main

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/your-username/business-consulting.git

# 推送到 GitHub
git push -u origin main
```

**注意**：将 `your-username` 替换为你的 GitHub 用户名。

## 步骤三：启用 GitHub Pages

1. 在 GitHub 仓库页面，点击 **Settings**
2. 在左侧菜单找到 **Pages**
3. 在 **Source** 部分：
   - Branch: 选择 `main`
   - Folder: 选择 `/ (root)`
4. 点击 **Save**

等待几分钟后，你的网站就会发布到：
```
https://your-username.github.io/business-consulting/
```

## 步骤四：配置前端

在部署前，确保已经正确配置了 Cloudflare Worker 地址。

编辑 `script.js`：

```javascript
const EPAY_CONFIG = {
    pid: 'YOUR_PID',  // 你的易支付商户ID
    returnUrl: 'https://your-username.github.io/business-consulting/',  // 你的 GitHub Pages 地址
    apiUrl: 'https://business-consulting-payment.your-subdomain.workers.dev'  // 你的 Worker 地址
};
```

编辑 `index.html` 页脚部分，修改：
- 公司名称
- 客服QQ号（两处）
- ICP备案号

## 步骤五：更新网站

每次修改代码后，运行以下命令更新网站：

```bash
# 添加修改的文件
git add .

# 提交修改
git commit -m "更新说明"

# 推送到 GitHub
git push
```

GitHub Pages 会自动重新部署，通常需要 1-2 分钟。

## 步骤六：配置易支付回调地址

在你的易支付平台后台，配置回调地址为：

```
https://your-username.github.io/business-consulting/
```

## 步骤七：测试完整流程

1. 访问你的 GitHub Pages 网站
2. 选择一个服务，点击"立即购买"
3. 选择支付方式
4. 应该会跳转到易支付页面
5. 完成支付后返回网站
6. 查看是否显示密钥和客服QQ

## 自定义域名（可选）

如果你有自己的域名，可以绑定到 GitHub Pages：

1. 在仓库根目录创建 `CNAME` 文件
2. 文件内容为你的域名，例如：`www.yourdomain.com`
3. 在域名服务商处添加 DNS 记录：
   - 类型：CNAME
   - 名称：www（或 @）
   - 值：your-username.github.io
4. 在 GitHub Pages 设置中填入自定义域名

## 文件结构

确保以下文件都已上传到 GitHub：

```
business_consulting/
├── index.html          # 主页面
├── style.css           # 样式文件
├── script.js           # JavaScript 逻辑
├── verify_key.py       # 密钥验证工具（可选）
├── README.md           # 说明文档
├── CLOUDFLARE_DEPLOY.md  # Cloudflare 部署指南
└── GITHUB_DEPLOY.md    # 本文件
```

**不需要上传的文件**：
- `worker.js`（这个在 Cloudflare 部署）
- `wrangler.toml`（这个在 Cloudflare 部署）
- `package.json`（这个在 Cloudflare 部署）
- `BACKEND_SOLUTION.md`（可选，仅供参考）

## 创建 .gitignore（可选）

如果不想上传某些文件，创建 `.gitignore` 文件：

```
# Node modules
node_modules/

# Cloudflare Worker 相关（这些不需要在 GitHub Pages 中）
worker.js
wrangler.toml
package.json
package-lock.json

# 临时文件
*.log
.DS_Store
```

## 常见问题

### Q1: 网站显示 404

**解决方法**：
- 检查 GitHub Pages 是否已启用
- 确认分支选择正确（main）
- 等待几分钟让 GitHub 完成部署

### Q2: 支付跳转失败

**解决方法**：
- 检查浏览器控制台的错误信息
- 确认 Cloudflare Worker 已正确部署
- 确认 `script.js` 中的 `apiUrl` 配置正确

### Q3: 支付成功后没有显示密钥

**解决方法**：
- 检查易支付回调地址是否配置正确
- 查看浏览器控制台是否有 JavaScript 错误
- 确认易支付返回的参数格式

### Q4: 如何查看网站访问统计？

可以使用免费的统计服务：
- Google Analytics
- 百度统计
- 51.la

### Q5: 网站加载慢怎么办？

GitHub Pages 在国内访问可能较慢，可以考虑：
- 使用 CDN 加速
- 使用国内的 Gitee Pages
- 使用 Vercel 或 Netlify 部署

## 安全检查清单

部署前请确认：

- [ ] 已部署 Cloudflare Worker
- [ ] Worker 环境变量已正确配置
- [ ] `script.js` 中的 `apiUrl` 指向正确的 Worker 地址
- [ ] `returnUrl` 设置为正确的 GitHub Pages 地址
- [ ] 客服QQ号已修改（两处）
- [ ] 页脚信息已修改（公司名称、备案号）
- [ ] 易支付回调地址已配置
- [ ] 测试支付流程正常

## 维护建议

1. **定期备份**：定期下载代码到本地
2. **监控订单**：每天检查易支付后台的订单
3. **更新密钥**：定期更换易支付密钥（记得更新 Worker 环境变量）
4. **客户服务**：及时回复客户的咨询

## 下一步

完成部署后：
1. 分享你的网站链接
2. 在社交媒体推广
3. 优化 SEO（添加 meta 标签）
4. 收集用户反馈并改进

祝你生意兴隆！💰

