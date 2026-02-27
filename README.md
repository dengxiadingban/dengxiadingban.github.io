# 商务咨询服务平台

一个基于纯前端技术的商务咨询服务付费网站，使用清新护眼的浅绿色主题配色。

## 功能特点

- ✅ 单页面设计，简洁美观
- ✅ 企业介绍展示
- ✅ 三种付费服务套餐
- ✅ 集成易支付（支持微信和支付宝）
- ✅ 独特的密钥生成算法
- ✅ 支付成功后自动生成服务密钥
- ✅ 响应式设计，支持移动端
- ✅ 完整的页脚信息（公司名称、备案号、版权声明）

## 服务套餐

1. **个体工商户业务咨询** - ¥19.9
2. **公司业务咨询** - ¥39.9
3. **代理记账与网站备案** - ¥99.9

## 使用说明

### 1. 配置易支付（静态托管安全模式）

打开 `script.js` 文件，修改以下配置：

```javascript
const EPAY_CONFIG = {
    pid: 'YOUR_PID',           // 替换为您的易支付商户ID（可以公开）
    payUrl: 'https://pay.example.com/pay.php',  // 替换为您的易支付支付页面地址
    returnUrl: window.location.href,
    apiUrl: null  // 静态托管模式设置为null
};
```

**重要说明**：
- 静态托管模式使用**直接跳转**方式，不需要在前端暴露易支付密钥
- 只需要配置商户ID（PID）和支付页面地址
- 这种方式适合大多数易支付平台，安全且简单

### 2. 配置客服QQ号

在 `script.js` 中修改客服QQ号：

```javascript
const CUSTOMER_QQ = '123456789';  // 替换为您的客服QQ号
```

同时在 `index.html` 中也需要修改（第88行和页脚部分）：

```html
<div class="qq-box">123456789</div>
```

### 3. 修改页脚信息

在 `index.html` 的页脚部分修改：

```html
<footer class="footer">
    <div class="footer-content">
        <div class="footer-section">
            <h4>您的公司名称</h4>  <!-- 修改公司名称 -->
            <p>专业 · 高效 · 贴心</p>
        </div>
        <!-- ... -->
    </div>
    <div class="footer-bottom">
        <p>© 2026 您的公司名称 All Rights Reserved</p>  <!-- 修改版权信息 -->
        <p><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">京ICP备12345678号-1</a></p>  <!-- 修改备案号 -->
    </div>
</footer>
```

### 4. 部署到GitHub Pages

```bash
# 1. 初始化Git仓库
git init
git add .
git commit -m "Initial commit"

# 2. 创建GitHub仓库并推送
git remote add origin https://github.com/your-username/your-repo.git
git branch -M main
git push -u origin main

# 3. 在GitHub仓库设置中启用GitHub Pages
# Settings -> Pages -> Source: main branch -> Save
```

访问地址：`https://your-username.github.io/your-repo/`

## 安全性说明

### 静态托管模式（当前实现）

✅ **优点**：
- 不暴露易支付密钥（KEY）
- 只暴露商户ID（PID），这是公开信息
- 完全免费，部署简单
- 适合大多数易支付平台

❌ **限制**：
- 需要易支付平台支持无签名的直接跳转模式
- 如果平台强制要求签名验证，需要使用后端方案

### 后端API模式（可选）

如果您的易支付平台必须要签名验证，可以使用免费的Serverless服务：
- Vercel Functions
- Cloudflare Workers
- AWS Lambda

详细实现方案请查看 `BACKEND_SOLUTION.md` 文件。

## 密钥生成算法

密钥格式：`SERVICE1-0A1B2C3D-123456-JK`
- 第一部分：服务ID（SERVICE1/SERVICE2/SERVICE3）
- 第二部分：8位哈希值
- 第三部分：时间戳后6位
- 第四部分：价格编码

### 密钥验证（离线）

使用 `verify_key.py` 可以离线验证客户提供的密钥是否有效：

```bash
python verify_key.py
```

或者使用Python代码：

```python
from verify_key import verify_service_key

key = "SERVICE1-0A1B2C3D-123456-JK"
result = verify_service_key(key)

if result['valid']:
    print(f"密钥有效 - {result['service_name']}")
else:
    print(f"密钥无效 - {result['error']}")
```

## 工作流程

1. 用户浏览网站，选择需要的服务
2. 点击"立即购买"按钮
3. 选择支付方式（微信或支付宝）
4. 跳转到易支付完成支付
5. 支付成功后返回网站
6. 自动生成唯一服务密钥
7. 显示客服QQ号和密钥
8. 用户添加客服QQ并发送密钥开始服务

## 技术栈

- HTML5
- CSS3（使用CSS变量和现代布局）
- 原生JavaScript（无需框架）
- 易支付API

## 浏览器兼容性

- Chrome/Edge（推荐）
- Firefox
- Safari
- 移动端浏览器

## 自定义配色

如需修改配色方案，编辑 `style.css` 中的CSS变量：

```css
:root {
    --primary-green: #a8e6cf;      /* 主色调 */
    --secondary-green: #dcedc8;    /* 次要色 */
    --accent-green: #81c784;       /* 强调色 */
    --dark-green: #66bb6a;         /* 深色 */
    --light-bg: #f1f8f4;           /* 浅色背景 */
}
```

## 文件说明

- `index.html` - 主页面
- `style.css` - 样式文件
- `script.js` - JavaScript逻辑
- `verify_key.py` - Python密钥验证工具
- `README.md` - 使用说明
- `BACKEND_SOLUTION.md` - 后端API实现方案（可选）

## 常见问题

### Q: 如何确保密钥不被伪造？

A: 密钥使用特定算法生成，包含订单信息、时间戳和哈希值。虽然算法在前端可见，但伪造成本较高。您可以通过验证工具快速识别无效密钥。

### Q: 用户可以伪造支付成功吗？

A: 在纯前端架构中，理论上可以。但由于：
1. 用户需要提供密钥才能获得服务
2. 您可以通过易支付后台核对订单
3. 服务是人工提供的，可以在提供前验证

实际风险较低。如需更高安全性，建议使用后端验证方案。

### Q: GitHub Pages支持易支付回调吗？

A: GitHub Pages是静态托管，不支持服务器端回调。但易支付的前端回调（return_url）完全支持，足够完成支付流程。

## 许可证

本项目仅供学习和商业使用。

## 联系方式

如有问题，请联系客服QQ：123456789

