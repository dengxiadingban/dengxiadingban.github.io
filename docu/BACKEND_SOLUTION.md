# 后端API实现方案（可选）

如果您需要更安全的支付方案，可以使用免费的Serverless服务来隐藏易支付密钥。

## 方案：使用Vercel Serverless Functions

### 1. 创建Vercel项目

在项目根目录创建 `api` 文件夹，并创建 `payment.js` 文件：

```javascript
// api/payment.js
const crypto = require('crypto');

// 易支付配置（存储在环境变量中，不会暴露）
const EPAY_CONFIG = {
    pid: process.env.EPAY_PID,
    key: process.env.EPAY_KEY,
    apiUrl: process.env.EPAY_API_URL
};

// 生成MD5签名
function generateSign(params, key) {
    const sortedKeys = Object.keys(params).sort();
    let signStr = '';
    
    for (const k of sortedKeys) {
        if (params[k] && k !== 'sign' && k !== 'sign_type') {
            signStr += k + '=' + params[k] + '&';
        }
    }
    
    signStr += key;
    return crypto.createHash('md5').update(signStr).digest('hex');
}

module.exports = async (req, res) => {
    // 设置CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { type, out_trade_no, name, money, return_url } = req.body;
        
        // 构建支付参数
        const params = {
            pid: EPAY_CONFIG.pid,
            type: type,
            out_trade_no: out_trade_no,
            notify_url: '',
            return_url: return_url,
            name: name,
            money: money,
            sitename: '商务咨询服务平台'
        };
        
        // 生成签名
        const sign = generateSign(params, EPAY_CONFIG.key);
        params.sign = sign;
        params.sign_type = 'MD5';
        
        // 构建支付URL
        const queryString = new URLSearchParams(params).toString();
        const payUrl = `${EPAY_CONFIG.apiUrl}?${queryString}`;
        
        return res.status(200).json({
            success: true,
            payUrl: payUrl
        });
        
    } catch (error) {
        console.error('Payment error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
};
```

### 2. 配置环境变量

在Vercel项目设置中添加环境变量：
- `EPAY_PID`: 你的易支付商户ID
- `EPAY_KEY`: 你的易支付密钥
- `EPAY_API_URL`: 你的易支付API地址

### 3. 修改前端配置

在 `script.js` 中修改配置：

```javascript
const EPAY_CONFIG = {
    pid: 'YOUR_PID',  // 可以公开
    payUrl: null,
    returnUrl: window.location.href,
    // 使用Vercel API
    apiUrl: 'https://your-project.vercel.app/api/payment'
};
```

### 4. 部署到Vercel

```bash
# 安装Vercel CLI
npm install -g vercel

# 登录Vercel
vercel login

# 部署项目
vercel --prod
```

## 方案：使用Cloudflare Workers

### 1. 创建Worker脚本

```javascript
// worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 处理CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }
  
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }
  
  try {
    const data = await request.json()
    
    // 从环境变量获取配置
    const EPAY_PID = EPAY_PID_ENV
    const EPAY_KEY = EPAY_KEY_ENV
    const EPAY_API_URL = EPAY_API_URL_ENV
    
    // 构建支付参数
    const params = {
      pid: EPAY_PID,
      type: data.type,
      out_trade_no: data.out_trade_no,
      return_url: data.return_url,
      name: data.name,
      money: data.money,
      sitename: '商务咨询服务平台'
    }
    
    // 生成签名
    const sign = await generateSign(params, EPAY_KEY)
    params.sign = sign
    params.sign_type = 'MD5'
    
    // 构建支付URL
    const queryString = new URLSearchParams(params).toString()
    const payUrl = `${EPAY_API_URL}?${queryString}`
    
    return new Response(JSON.stringify({
      success: true,
      payUrl: payUrl
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

async function generateSign(params, key) {
  const sortedKeys = Object.keys(params).sort()
  let signStr = ''
  
  for (const k of sortedKeys) {
    if (params[k] && k !== 'sign' && k !== 'sign_type') {
      signStr += k + '=' + params[k] + '&'
    }
  }
  
  signStr += key
  
  // 使用Web Crypto API生成MD5
  const encoder = new TextEncoder()
  const data = encoder.encode(signStr)
  const hashBuffer = await crypto.subtle.digest('MD5', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
```

### 2. 部署到Cloudflare

```bash
# 安装Wrangler CLI
npm install -g wrangler

# 登录Cloudflare
wrangler login

# 发布Worker
wrangler publish
```

## 总结

- **纯静态方案**：使用直接跳转模式，PID会暴露但密钥不会（当前已实现）
- **Serverless方案**：使用Vercel/Cloudflare Workers，完全隐藏密钥（需要额外配置）

推荐使用纯静态方案，因为：
1. 完全免费
2. 部署简单
3. PID本身是公开信息，不影响安全性
4. 易支付平台通常支持无签名的直接跳转

如果您的易支付平台必须要签名验证，则需要使用Serverless方案。

