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
    
    // 调试信息：记录收到的请求
    console.log('收到支付请求:', JSON.stringify(data))
    
    // 从环境变量获取易支付配置
    const EPAY_PID = EPAY_PID_ENV
    const EPAY_KEY = EPAY_KEY_ENV
    const EPAY_API_URL = EPAY_API_URL_ENV
    
    // 调试信息：检查环境变量
    console.log('环境变量检查:', {
      hasPID: !!EPAY_PID,
      hasKEY: !!EPAY_KEY,
      hasURL: !!EPAY_API_URL,
      apiUrl: EPAY_API_URL
    })
    
    // 验证必需参数
    if (!data.type || !data.out_trade_no || !data.name || !data.money || !data.return_url) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters',
        debug: {
          hasType: !!data.type,
          hasOrderNo: !!data.out_trade_no,
          hasName: !!data.name,
          hasMoney: !!data.money,
          hasReturnUrl: !!data.return_url
        }
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
    const signResult = await generateSign(params, EPAY_KEY)
    params.sign = signResult.sign
    params.sign_type = 'MD5'
    
    // 调试信息：记录签名过程
    console.log('签名信息:', {
      signString: signResult.signString,
      sign: signResult.sign
    })
    
    // 构建支付URL
    const queryString = new URLSearchParams(params).toString()
    const payUrl = `${EPAY_API_URL}?${queryString}`
    
    console.log('生成的支付URL:', payUrl)
    
    // 返回支付链接（包含调试信息）
    return new Response(JSON.stringify({
      success: true,
      payUrl: payUrl,
      orderId: data.out_trade_no,
      debug: {
        signString: signResult.signString,
        sign: signResult.sign,
        params: params
      }
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
      error: 'Internal server error: ' + error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}

// MD5 实现（因为 Web Crypto API 不支持 MD5）
function md5(string) {
  function rotateLeft(value, shift) {
    return (value << shift) | (value >>> (32 - shift));
  }
  
  function addUnsigned(x, y) {
    const lsw = (x & 0xFFFF) + (y & 0xFFFF);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  }
  
  function md5F(x, y, z) { return (x & y) | ((~x) & z); }
  function md5G(x, y, z) { return (x & z) | (y & (~z)); }
  function md5H(x, y, z) { return x ^ y ^ z; }
  function md5I(x, y, z) { return y ^ (x | (~z)); }
  
  function md5FF(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(md5F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  
  function md5GG(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(md5G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  
  function md5HH(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(md5H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  
  function md5II(a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(md5I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  
  function convertToWordArray(string) {
    let wordArray = [];
    for (let i = 0; i < string.length * 8; i += 8) {
      wordArray[i >> 5] |= (string.charCodeAt(i / 8) & 0xFF) << (i % 32);
    }
    return wordArray;
  }
  
  function utf8Encode(string) {
    string = string.replace(/\r\n/g, "\n");
    let utftext = "";
    for (let n = 0; n < string.length; n++) {
      const c = string.charCodeAt(n);
      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if ((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }
    return utftext;
  }
  
  string = utf8Encode(string);
  const x = convertToWordArray(string);
  let a = 0x67452301;
  let b = 0xEFCDAB89;
  let c = 0x98BADCFE;
  let d = 0x10325476;
  
  const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  const S41 = 6, S42 = 10, S43 = 15, S44 = 21;
  
  x[string.length >> 2] |= 0x80 << ((string.length % 4) * 8);
  x[(((string.length + 8) >> 6) << 4) + 14] = string.length * 8;
  
  for (let i = 0; i < x.length; i += 16) {
    const olda = a, oldb = b, oldc = c, oldd = d;
    
    a = md5FF(a, b, c, d, x[i + 0], S11, 0xD76AA478);
    d = md5FF(d, a, b, c, x[i + 1], S12, 0xE8C7B756);
    c = md5FF(c, d, a, b, x[i + 2], S13, 0x242070DB);
    b = md5FF(b, c, d, a, x[i + 3], S14, 0xC1BDCEEE);
    a = md5FF(a, b, c, d, x[i + 4], S11, 0xF57C0FAF);
    d = md5FF(d, a, b, c, x[i + 5], S12, 0x4787C62A);
    c = md5FF(c, d, a, b, x[i + 6], S13, 0xA8304613);
    b = md5FF(b, c, d, a, x[i + 7], S14, 0xFD469501);
    a = md5FF(a, b, c, d, x[i + 8], S11, 0x698098D8);
    d = md5FF(d, a, b, c, x[i + 9], S12, 0x8B44F7AF);
    c = md5FF(c, d, a, b, x[i + 10], S13, 0xFFFF5BB1);
    b = md5FF(b, c, d, a, x[i + 11], S14, 0x895CD7BE);
    a = md5FF(a, b, c, d, x[i + 12], S11, 0x6B901122);
    d = md5FF(d, a, b, c, x[i + 13], S12, 0xFD987193);
    c = md5FF(c, d, a, b, x[i + 14], S13, 0xA679438E);
    b = md5FF(b, c, d, a, x[i + 15], S14, 0x49B40821);
    
    a = md5GG(a, b, c, d, x[i + 1], S21, 0xF61E2562);
    d = md5GG(d, a, b, c, x[i + 6], S22, 0xC040B340);
    c = md5GG(c, d, a, b, x[i + 11], S23, 0x265E5A51);
    b = md5GG(b, c, d, a, x[i + 0], S24, 0xE9B6C7AA);
    a = md5GG(a, b, c, d, x[i + 5], S21, 0xD62F105D);
    d = md5GG(d, a, b, c, x[i + 10], S22, 0x2441453);
    c = md5GG(c, d, a, b, x[i + 15], S23, 0xD8A1E681);
    b = md5GG(b, c, d, a, x[i + 4], S24, 0xE7D3FBC8);
    a = md5GG(a, b, c, d, x[i + 9], S21, 0x21E1CDE6);
    d = md5GG(d, a, b, c, x[i + 14], S22, 0xC33707D6);
    c = md5GG(c, d, a, b, x[i + 3], S23, 0xF4D50D87);
    b = md5GG(b, c, d, a, x[i + 8], S24, 0x455A14ED);
    a = md5GG(a, b, c, d, x[i + 13], S21, 0xA9E3E905);
    d = md5GG(d, a, b, c, x[i + 2], S22, 0xFCEFA3F8);
    c = md5GG(c, d, a, b, x[i + 7], S23, 0x676F02D9);
    b = md5GG(b, c, d, a, x[i + 12], S24, 0x8D2A4C8A);
    
    a = md5HH(a, b, c, d, x[i + 5], S31, 0xFFFA3942);
    d = md5HH(d, a, b, c, x[i + 8], S32, 0x8771F681);
    c = md5HH(c, d, a, b, x[i + 11], S33, 0x6D9D6122);
    b = md5HH(b, c, d, a, x[i + 14], S34, 0xFDE5380C);
    a = md5HH(a, b, c, d, x[i + 1], S31, 0xA4BEEA44);
    d = md5HH(d, a, b, c, x[i + 4], S32, 0x4BDECFA9);
    c = md5HH(c, d, a, b, x[i + 7], S33, 0xF6BB4B60);
    b = md5HH(b, c, d, a, x[i + 10], S34, 0xBEBFBC70);
    a = md5HH(a, b, c, d, x[i + 13], S31, 0x289B7EC6);
    d = md5HH(d, a, b, c, x[i + 0], S32, 0xEAA127FA);
    c = md5HH(c, d, a, b, x[i + 3], S33, 0xD4EF3085);
    b = md5HH(b, c, d, a, x[i + 6], S34, 0x4881D05);
    a = md5HH(a, b, c, d, x[i + 9], S31, 0xD9D4D039);
    d = md5HH(d, a, b, c, x[i + 12], S32, 0xE6DB99E5);
    c = md5HH(c, d, a, b, x[i + 15], S33, 0x1FA27CF8);
    b = md5HH(b, c, d, a, x[i + 2], S34, 0xC4AC5665);
    
    a = md5II(a, b, c, d, x[i + 0], S41, 0xF4292244);
    d = md5II(d, a, b, c, x[i + 7], S42, 0x432AFF97);
    c = md5II(c, d, a, b, x[i + 14], S43, 0xAB9423A7);
    b = md5II(b, c, d, a, x[i + 5], S44, 0xFC93A039);
    a = md5II(a, b, c, d, x[i + 12], S41, 0x655B59C3);
    d = md5II(d, a, b, c, x[i + 3], S42, 0x8F0CCC92);
    c = md5II(c, d, a, b, x[i + 10], S43, 0xFFEFF47D);
    b = md5II(b, c, d, a, x[i + 1], S44, 0x85845DD1);
    a = md5II(a, b, c, d, x[i + 8], S41, 0x6FA87E4F);
    d = md5II(d, a, b, c, x[i + 15], S42, 0xFE2CE6E0);
    c = md5II(c, d, a, b, x[i + 6], S43, 0xA3014314);
    b = md5II(b, c, d, a, x[i + 13], S44, 0x4E0811A1);
    a = md5II(a, b, c, d, x[i + 4], S41, 0xF7537E82);
    d = md5II(d, a, b, c, x[i + 11], S42, 0xBD3AF235);
    c = md5II(c, d, a, b, x[i + 2], S43, 0x2AD7D2BB);
    b = md5II(b, c, d, a, x[i + 9], S44, 0xEB86D391);
    
    a = addUnsigned(a, olda);
    b = addUnsigned(b, oldb);
    c = addUnsigned(c, oldc);
    d = addUnsigned(d, oldd);
  }
  
  const temp = [a, b, c, d];
  let result = '';
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      result += ((temp[i] >> (j * 8)) & 0xFF).toString(16).padStart(2, '0');
    }
  }
  return result;
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
  
  // 使用MD5生成签名
  const sign = md5(signStr)
  
  return {
    sign: sign,
    signString: signStr
  }
}

