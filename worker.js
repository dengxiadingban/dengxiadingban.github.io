/**
 * Cloudflare Worker — 易支付代理
 *
 * 环境变量（在 Cloudflare Dashboard → Workers → Settings → Variables 中设置）：
 *   EPAY_PID : 易支付商户 ID
 *   EPAY_KEY : 易支付商户密钥（设置为 Secret）
 *
 * 路由：
 *   GET  /api/epay/config          → 返回 PID 给前端
 *   POST /api/epay/submit          → 签名 + 转发下单（mapi.php）
 *   GET  /api/epay/api.php?...     → 透传订单查询（api.php）
 */

const EPAY_ORIGIN = 'https://epay.aceyun.cn';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age':       '86400',
};

// ─── 响应构建 ────────────────────────────────────────────────
const jsonResp = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
  });

const errResp = (msg, status = 500) =>
  jsonResp({ code: 0, msg }, status);

// ─── MD5（纯 JS，运行在 Worker 中）──────────────────────────
function md5(str) {
  const safeAdd = (x, y) => { const l = (x & 0xffff) + (y & 0xffff); return ((x >> 16) + (y >> 16) + (l >> 16)) << 16 | l & 0xffff; };
  const rol     = (n, c) => n << c | n >>> 32 - c;
  const cmn     = (q, a, b, x, s, t) => safeAdd(rol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  const ff = (a,b,c,d,x,s,t) => cmn(b&c|~b&d,a,b,x,s,t);
  const gg = (a,b,c,d,x,s,t) => cmn(b&d|c&~d,a,b,x,s,t);
  const hh = (a,b,c,d,x,s,t) => cmn(b^c^d,a,b,x,s,t);
  const ii = (a,b,c,d,x,s,t) => cmn(c^(b|~d),a,b,x,s,t);

  const s2b = s => {
    const b = [];
    for (let i = 0; i < s.length * 8; i += 8) b[i >> 5] |= (s.charCodeAt(i / 8) & 0xff) << i % 32;
    return b;
  };
  const b2h = b => {
    const h = '0123456789abcdef'; let s = '';
    for (let i = 0; i < b.length * 4; i++) s += h[b[i>>2] >> (i%4*8+4) & 0xf] + h[b[i>>2] >> i%4*8 & 0xf];
    return s;
  };
  const core = (x, len) => {
    x[len >> 5] |= 0x80 << len % 32;
    x[(len + 64 >>> 9 << 4) + 14] = len;
    let a=1732584193,b=-271733879,c=-1732584194,d=271733878;
    for (let i = 0; i < x.length; i += 16) {
      const [oa,ob,oc,od]=[a,b,c,d];
      a=ff(a,b,c,d,x[i+ 0], 7,-680876936);  d=ff(d,a,b,c,x[i+ 1],12,-389564586);
      c=ff(c,d,a,b,x[i+ 2],17, 606105819);  b=ff(b,c,d,a,x[i+ 3],22,-1044525330);
      a=ff(a,b,c,d,x[i+ 4], 7,-176418897);  d=ff(d,a,b,c,x[i+ 5],12,1200080426);
      c=ff(c,d,a,b,x[i+ 6],17,-1473231341); b=ff(b,c,d,a,x[i+ 7],22,-45705983);
      a=ff(a,b,c,d,x[i+ 8], 7,1770035416);  d=ff(d,a,b,c,x[i+ 9],12,-1958414417);
      c=ff(c,d,a,b,x[i+10],17,-42063);      b=ff(b,c,d,a,x[i+11],22,-1990404162);
      a=ff(a,b,c,d,x[i+12], 7,1804603682);  d=ff(d,a,b,c,x[i+13],12,-40341101);
      c=ff(c,d,a,b,x[i+14],17,-1502002290); b=ff(b,c,d,a,x[i+15],22,1236535329);
      a=gg(a,b,c,d,x[i+ 1], 5,-165796510);  d=gg(d,a,b,c,x[i+ 6], 9,-1069501632);
      c=gg(c,d,a,b,x[i+11],14, 643717713);  b=gg(b,c,d,a,x[i+ 0],20,-373897302);
      a=gg(a,b,c,d,x[i+ 5], 5,-701558691);  d=gg(d,a,b,c,x[i+10], 9,38016083);
      c=gg(c,d,a,b,x[i+15],14,-660478335);  b=gg(b,c,d,a,x[i+ 4],20,-405537848);
      a=gg(a,b,c,d,x[i+ 9], 5, 568446438);  d=gg(d,a,b,c,x[i+14], 9,-1019803690);
      c=gg(c,d,a,b,x[i+ 3],14,-187363961);  b=gg(b,c,d,a,x[i+ 8],20,1163531501);
      a=gg(a,b,c,d,x[i+13], 5,-1444681467); d=gg(d,a,b,c,x[i+ 2], 9,-51403784);
      c=gg(c,d,a,b,x[i+ 7],14,1735328473);  b=gg(b,c,d,a,x[i+12],20,-1926607734);
      a=hh(a,b,c,d,x[i+ 5], 4,-378558);     d=hh(d,a,b,c,x[i+ 8],11,-2022574463);
      c=hh(c,d,a,b,x[i+11],16,1839030562);  b=hh(b,c,d,a,x[i+14],23,-35309556);
      a=hh(a,b,c,d,x[i+ 1], 4,-1530992060); d=hh(d,a,b,c,x[i+ 4],11,1272893353);
      c=hh(c,d,a,b,x[i+ 7],16,-155497632);  b=hh(b,c,d,a,x[i+10],23,-1094730640);
      a=hh(a,b,c,d,x[i+13], 4, 681279174);  d=hh(d,a,b,c,x[i+ 0],11,-358537222);
      c=hh(c,d,a,b,x[i+ 3],16,-722521979);  b=hh(b,c,d,a,x[i+ 6],23,76029189);
      a=hh(a,b,c,d,x[i+ 9], 4,-640364487);  d=hh(d,a,b,c,x[i+12],11,-421815835);
      c=hh(c,d,a,b,x[i+15],16, 530742520);  b=hh(b,c,d,a,x[i+ 2],23,-995338651);
      a=ii(a,b,c,d,x[i+ 0], 6,-198630844);  d=ii(d,a,b,c,x[i+ 7],10,1126891415);
      c=ii(c,d,a,b,x[i+14],15,-1416354905); b=ii(b,c,d,a,x[i+ 5],21,-57434055);
      a=ii(a,b,c,d,x[i+12], 6,1700485571);  d=ii(d,a,b,c,x[i+ 3],10,-1894986606);
      c=ii(c,d,a,b,x[i+10],15,-1051523);    b=ii(b,c,d,a,x[i+ 1],21,-2054922799);
      a=ii(a,b,c,d,x[i+ 8], 6,1873313359);  d=ii(d,a,b,c,x[i+15],10,-30611744);
      c=ii(c,d,a,b,x[i+ 6],15,-1560198380); b=ii(b,c,d,a,x[i+13],21,1309151649);
      a=ii(a,b,c,d,x[i+ 4], 6,-145523070);  d=ii(d,a,b,c,x[i+11],10,-1120210379);
      c=ii(c,d,a,b,x[i+ 2],15, 718787259);  b=ii(b,c,d,a,x[i+ 9],21,-343485551);
      a=safeAdd(a,oa); b=safeAdd(b,ob); c=safeAdd(c,oc); d=safeAdd(d,od);
    }
    return [a,b,c,d];
  };
  const enc = unescape(encodeURIComponent(str));
  return b2h(core(s2b(enc), enc.length * 8));
}

// ─── 签名生成 ────────────────────────────────────────────────
function generateSign(params, key) {
  const str = Object.entries(params)
    .filter(([k, v]) => v !== '' && v != null && k !== 'sign' && k !== 'sign_type')
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return md5(str + key);
}

// ─── 路由处理 ────────────────────────────────────────────────
async function handleConfig(env) {
  return jsonResp({ code: 1, pid: env.EPAY_PID ?? '' });
}

async function handleSubmit(request, env) {
  if (!env.EPAY_KEY || !env.EPAY_PID) {
    return errResp('支付配置未设置，请联系管理员', 503);
  }
  let params;
  try {
    params = await request.json();
  } catch (_) {
    return errResp('请求体解析失败', 400);
  }

  // 注入 PID 并生成签名
  params.pid       = env.EPAY_PID;
  params.sign      = generateSign(params, env.EPAY_KEY);
  params.sign_type = 'MD5';

  // 转发到易支付
  const epayResp = await fetch(`${EPAY_ORIGIN}/mapi.php`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams(params).toString(),
  });
  const text = await epayResp.text();
  return new Response(text, {
    status: epayResp.status,
    headers: {
      'Content-Type': epayResp.headers.get('Content-Type') || 'application/json',
      'Cache-Control': 'no-store',
      ...CORS,
    },
  });
}

async function handleProxy(url, env) {
  // 注入 key 到订单查询参数
  url.searchParams.set('key', env.EPAY_KEY ?? '');
  const epayUrl = new URL(url.pathname.replace('/api/epay', ''), EPAY_ORIGIN);
  epayUrl.search = url.search;

  const epayResp = await fetch(epayUrl.toString());
  const text     = await epayResp.text();
  return new Response(text, {
    status: epayResp.status,
    headers: {
      'Content-Type': epayResp.headers.get('Content-Type') || 'application/json',
      'Cache-Control': 'no-store',
      ...CORS,
    },
  });
}

// ─── 入口 ────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url      = new URL(request.url);
    const pathname = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    try {
      if (pathname === '/api/epay/config')           return handleConfig(env);
      if (pathname === '/api/epay/submit')            return handleSubmit(request, env);
      if (pathname.startsWith('/api/epay/'))          return handleProxy(url, env);
      return errResp('Not Found', 404);
    } catch (err) {
      console.error('Worker error:', err);
      return errResp(`代理错误: ${err.message}`);
    }
  },
};
