// Cloudflare Worker - 易支付签名服务
// 部署到 Cloudflare Workers 以安全地处理支付签名

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 处理CORS预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      }
    })
  }
  
  // 只允许POST请求
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
  
  try {
    // 解析请求数据
    const data = await request.json()
    
    // 从环境变量获取易支付配置
    const EPAY_PID = EPAY_PID_ENV
    const EPAY_KEY = EPAY_KEY_ENV
    const EPAY_API_URL = EPAY_API_URL_ENV
    
    // 验证必需参数
    if (!data.type || !data.out_trade_no || !data.name || !data.money || !data.return_url) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    }
    
    // 构建支付参数
    const params = {
      pid: EPAY_PID,
      type: data.type,
      out_trade_no: data.out_trade_no,
      notify_url: data.notify_url || '',
      return_url: data.return_url,
      name: data.name,
      money: data.money.toString(),
      sitename: data.sitename || '商务咨询服务平台'
    }
    
    // 生成签名
    const sign = await generateSign(params, EPAY_KEY)
    params.sign = sign
    params.sign_type = 'MD5'
    
    // 构建支付URL
    const queryString = new URLSearchParams(params).toString()
    const payUrl = `${EPAY_API_URL}?${queryString}`
    
    // 返回支付链接
    return new Response(JSON.stringify({
      success: true,
      payUrl: payUrl,
      orderId: data.out_trade_no
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
    
  } catch (error) {
    console.error('Payment error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error: ' + error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

// 生成易支付MD5签名
async function generateSign(params, key) {
  // 按键名排序
  const sortedKeys = Object.keys(params).sort()
  let signStr = ''
  
  // 拼接签名字符串
  for (const k of sortedKeys) {
    if (params[k] !== '' && params[k] !== null && params[k] !== undefined && k !== 'sign' && k !== 'sign_type') {
      signStr += k + '=' + params[k] + '&'
    }
  }
  
  // 添加密钥
  signStr += key
  
  // 使用Web Crypto API生成MD5哈希
  const encoder = new TextEncoder()
  const data = encoder.encode(signStr)
  const hashBuffer = await crypto.subtle.digest('MD5', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

