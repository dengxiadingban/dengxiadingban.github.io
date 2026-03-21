// ============================================================
// 易支付配置
// key 和 pid 通过 config.js 注入（部署时由构建脚本自动替换）
// ============================================================
const EPAY_CONFIG = {
  apiUrl:    'https://epay.aceyun.cn',
  get pid()  { return (window.EPAY_CONFIG_INJECTED?.pid || '1013'); },
  get key()  { return (window.EPAY_CONFIG_INJECTED?.key || ''); },
  notifyUrl: window.location.origin + '/notify_success.txt',
  returnUrl: window.location.href.split('?')[0]
};

const CUSTOMER_QQ   = '2871431784';
let   currentOrder  = null;
let   pollTimer     = null;
let   pollCount     = 0;
const POLL_MAX       = 72;    // 72 次 x 5s = 6 分钟
const POLL_INTERVAL  = 5000;

// ============================================================
// MD5 纯JS实现
// ============================================================
function md5(str) {
  function safeAdd(x, y) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function rol(n, c) { return (n << c) | (n >>> (32 - c)); }
  function cmn(q, a, b, x, s, t) { return safeAdd(rol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b); }
  function ff(a,b,c,d,x,s,t){ return cmn((b&c)|(~b&d),a,b,x,s,t); }
  function gg(a,b,c,d,x,s,t){ return cmn((b&d)|(c&~d),a,b,x,s,t); }
  function hh(a,b,c,d,x,s,t){ return cmn(b^c^d,a,b,x,s,t); }
  function ii(a,b,c,d,x,s,t){ return cmn(c^(b|~d),a,b,x,s,t); }
  function s2b(s) {
    const bin = [], mask = 0xff;
    for (let i = 0; i < s.length * 8; i += 8)
      bin[i >> 5] |= (s.charCodeAt(i / 8) & mask) << (i % 32);
    return bin;
  }
  function b2h(b) {
    const t = '0123456789abcdef'; let s = '';
    for (let i = 0; i < b.length * 4; i++)
      s += t[(b[i>>2] >> (i%4*8+4)) & 0xf] + t[(b[i>>2] >> (i%4*8)) & 0xf];
    return s;
  }
  function core(x, len) {
    x[len >> 5] |= 0x80 << (len % 32);
    x[((len + 64) >>> 9 << 4) + 14] = len;
    let a=1732584193, b=-271733879, c=-1732584194, d=271733878;
    for (let i = 0; i < x.length; i += 16) {
      const oa=a, ob=b, oc=c, od=d;
      a=ff(a,b,c,d,x[i+0], 7,-680876936);  d=ff(d,a,b,c,x[i+1],12,-389564586);
      c=ff(c,d,a,b,x[i+2],17, 606105819);  b=ff(b,c,d,a,x[i+3],22,-1044525330);
      a=ff(a,b,c,d,x[i+4], 7,-176418897);  d=ff(d,a,b,c,x[i+5],12,1200080426);
      c=ff(c,d,a,b,x[i+6],17,-1473231341); b=ff(b,c,d,a,x[i+7],22,-45705983);
      a=ff(a,b,c,d,x[i+8], 7,1770035416);  d=ff(d,a,b,c,x[i+9],12,-1958414417);
      c=ff(c,d,a,b,x[i+10],17,-42063);     b=ff(b,c,d,a,x[i+11],22,-1990404162);
      a=ff(a,b,c,d,x[i+12],7,1804603682);  d=ff(d,a,b,c,x[i+13],12,-40341101);
      c=ff(c,d,a,b,x[i+14],17,-1502002290);b=ff(b,c,d,a,x[i+15],22,1236535329);
      a=gg(a,b,c,d,x[i+1], 5,-165796510);  d=gg(d,a,b,c,x[i+6], 9,-1069501632);
      c=gg(c,d,a,b,x[i+11],14,643717713);  b=gg(b,c,d,a,x[i+0],20,-373897302);
      a=gg(a,b,c,d,x[i+5], 5,-701558691);  d=gg(d,a,b,c,x[i+10],9,38016083);
      c=gg(c,d,a,b,x[i+15],14,-660478335); b=gg(b,c,d,a,x[i+4],20,-405537848);
      a=gg(a,b,c,d,x[i+9], 5,568446438);   d=gg(d,a,b,c,x[i+14],9,-1019803690);
      c=gg(c,d,a,b,x[i+3],14,-187363961);  b=gg(b,c,d,a,x[i+8],20,1163531501);
      a=gg(a,b,c,d,x[i+13],5,-1444681467); d=gg(d,a,b,c,x[i+2], 9,-51403784);
      c=gg(c,d,a,b,x[i+7],14,1735328473);  b=gg(b,c,d,a,x[i+12],20,-1926607734);
      a=hh(a,b,c,d,x[i+5], 4,-378558);     d=hh(d,a,b,c,x[i+8],11,-2022574463);
      c=hh(c,d,a,b,x[i+11],16,1839030562); b=hh(b,c,d,a,x[i+14],23,-35309556);
      a=hh(a,b,c,d,x[i+1], 4,-1530992060); d=hh(d,a,b,c,x[i+4],11,1272893353);
      c=hh(c,d,a,b,x[i+7],16,-155497632);  b=hh(b,c,d,a,x[i+10],23,-1094730640);
      a=hh(a,b,c,d,x[i+13],4,681279174);   d=hh(d,a,b,c,x[i+0],11,-358537222);
      c=hh(c,d,a,b,x[i+3],16,-722521979);  b=hh(b,c,d,a,x[i+6],23,76029189);
      a=hh(a,b,c,d,x[i+9], 4,-640364487);  d=hh(d,a,b,c,x[i+12],11,-421815835);
      c=hh(c,d,a,b,x[i+15],16,530742520);  b=hh(b,c,d,a,x[i+2],23,-995338651);
      a=ii(a,b,c,d,x[i+0], 6,-198630844);  d=ii(d,a,b,c,x[i+7],10,1126891415);
      c=ii(c,d,a,b,x[i+14],15,-1416354905);b=ii(b,c,d,a,x[i+5],21,-57434055);
      a=ii(a,b,c,d,x[i+12],6,1700485571);  d=ii(d,a,b,c,x[i+3],10,-1894986606);
      c=ii(c,d,a,b,x[i+10],15,-1051523);   b=ii(b,c,d,a,x[i+1],21,-2054922799);
      a=ii(a,b,c,d,x[i+8], 6,1873313359);  d=ii(d,a,b,c,x[i+15],10,-30611744);
      c=ii(c,d,a,b,x[i+6],15,-1560198380); b=ii(b,c,d,a,x[i+13],21,1309151649);
      a=ii(a,b,c,d,x[i+4], 6,-145523070);  d=ii(d,a,b,c,x[i+11],10,-1120210379);
      c=ii(c,d,a,b,x[i+2],15,718787259);   b=ii(b,c,d,a,x[i+9],21,-343485551);
      a=safeAdd(a,oa); b=safeAdd(b,ob); c=safeAdd(c,oc); d=safeAdd(d,od);
    }
    return [a,b,c,d];
  }
  const enc = unescape(encodeURIComponent(str));
  return b2h(core(s2b(enc), enc.length * 8));
}

// ============================================================
// 易支付签名（ASCII升序排序，拼接key后MD5）
// ============================================================
function generateSign(params) {
  const pairs = Object.entries(params)
    .filter(([k, v]) => v !== '' && v != null && k !== 'sign' && k !== 'sign_type')
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  return md5(pairs.map(([k, v]) => `${k}=${v}`).join('&') + EPAY_CONFIG.key);
}

// ============================================================
// 订单号（末尾偶数 → 易支付路由到伪装站）
// ============================================================
function genOrderId() {
  const base = Date.now().toString() + Math.floor(Math.random() * 900 + 100);
  const last  = parseInt(base.slice(-1));
  const even  = last % 2 === 0 ? last : (last + 1 > 9 ? 0 : last + 1);
  return base.slice(0, -1) + even;
}

// ============================================================
// 服务密钥生成
// ============================================================
function generateServiceKey(orderId, serviceId, price) {
  const ts   = Date.now();
  const base = `${orderId}-${serviceId}-${ts}-${price}`;
  let h = 0;
  for (let i = 0; i < base.length; i++) { h = ((h << 5) - h) + base.charCodeAt(i); h |= 0; }
  h = Math.abs(h);
  return [
    serviceId.toUpperCase(),
    h.toString(36).toUpperCase().padStart(8, '0'),
    ts.toString().slice(-6),
    Math.floor(price * 10).toString(36).toUpperCase()
  ].join('-');
}

// ============================================================
// Loading 遮罩
// ============================================================
function showLoading(msg) {
  let el = document.getElementById('loadingOverlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'loadingOverlay';
    el.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:9999;';
    el.innerHTML = `<div style="background:#fff;border-radius:14px;padding:36px 52px;text-align:center;">
      <div style="width:42px;height:42px;border:4px solid #e8f5e9;border-top-color:#4caf50;border-radius:50%;animation:_ld .8s linear infinite;margin:0 auto 18px"></div>
      <p id="loadingMsg" style="margin:0;font-size:15px;color:#444"></p></div>`;
    const s = document.createElement('style');
    s.textContent = '@keyframes _ld{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
    document.body.appendChild(el);
  }
  document.getElementById('loadingMsg').textContent = msg;
  el.style.display = 'flex';
}
function hideLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) el.style.display = 'none';
}

// ============================================================
// Modal 辅助
// ============================================================
function showModal(id) { document.getElementById(id).style.display = 'block'; }
function hideModal(id) { document.getElementById(id).style.display = 'none'; }
function closePaymentModal() { hideModal('paymentModal'); }
function closeSuccessModal() { hideModal('successModal'); }
function closeQrModal() { stopPoll(); hideModal('qrModal'); }

// ============================================================
// 购买按钮入口
// ============================================================
function handlePurchase(serviceName, price, serviceId) {
  currentOrder = { serviceName, price, serviceId };
  document.getElementById('modalService').textContent = `服务：${serviceName}`;
  document.getElementById('modalPrice').textContent   = `金额：¥${price}`;
  showModal('paymentModal');
}

// ============================================================
// 发起支付 → 直连易支付 mapi.php（带重试机制）
// ============================================================
async function payWithMethod(method) {
  if (!EPAY_CONFIG.key) {
    alert('支付配置未初始化，请联系管理员');
    return;
  }
  hideModal('paymentModal');
  showLoading('正在创建订单…');
  const orderId = genOrderId();
  const params = {
    pid:          EPAY_CONFIG.pid,
    type:         method,
    out_trade_no: orderId,
    notify_url:   EPAY_CONFIG.notifyUrl,
    return_url:   EPAY_CONFIG.returnUrl,
    name:         currentOrder.serviceName,
    money:        currentOrder.price.toFixed(2),
    clientip:     '127.0.0.1',
    device:       'pc'
  };
  params.sign      = generateSign(params);
  params.sign_type = 'MD5';
  
  // 重试机制：最多重试3次
  let retryCount = 0;
  const maxRetries = 3;
  
  async function attemptPayment() {
    try {
      const resp = await fetch(`${EPAY_CONFIG.apiUrl}/mapi.php`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    new URLSearchParams(params).toString(),
        timeout: 10000
      });
      
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }
      
      const data = await resp.json();
      hideLoading();
      
      if (data.code !== 1) {
        alert('下单失败：' + (data.msg || '未知错误'));
        return;
      }
      
      localStorage.setItem('pendingOrder', JSON.stringify({
        orderId,
        serviceName: currentOrder.serviceName,
        price:       currentOrder.price,
        serviceId:   currentOrder.serviceId,
        method,
        ts:          Date.now()
      }));
      
      const qrcode = data.qrcode || '';
      const payurl = data.payurl  || '';
      if      (qrcode) showQrModal(qrcode, method, orderId);
      else if (payurl) showPayUrlModal(payurl, orderId);
      else             alert('易支付未返回支付信息，请稍后重试');
    } catch (err) {
      retryCount++;
      if (retryCount < maxRetries) {
        showLoading(`正在创建订单…（重试 ${retryCount}/${maxRetries - 1}）`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        return attemptPayment();
      } else {
        hideLoading();
        alert(`网络错误，请重试\n${err.message}`);
      }
    }
  }
  
  return attemptPayment();
}

// ============================================================
// 二维码弹窗
// ============================================================
function showQrModal(qrcodeUrl, method, orderId) {
  const label = method === 'alipay' ? '支付宝' : '微信';
  document.getElementById('qrTip').textContent = `请使用${label}「扫一扫」完成支付`;
  document.getElementById('qrJumpArea').style.display   = 'none';
  document.getElementById('qrCanvasArea').style.display = 'block';
  const container = document.getElementById('qrCodeContainer');
  container.innerHTML = '';
  new QRCode(container, { text: qrcodeUrl, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M });
  showModal('qrModal');
  startPoll(orderId);
}

// ============================================================
// 跳转链接弹窗（payurl 场景）
// ============================================================
function showPayUrlModal(payurl, orderId) {
  document.getElementById('qrTip').textContent = '点击下方按钮跳转至支付宝完成支付';
  document.getElementById('qrCanvasArea').style.display = 'none';
  document.getElementById('qrJumpArea').style.display   = 'block';
  document.getElementById('jumpPayBtn').href = payurl;
  showModal('qrModal');
  startPoll(orderId);
}

// ============================================================
// 轮询订单状态（每5秒查询易支付 api.php）
// ============================================================
function startPoll(orderId) {
  stopPoll();
  pollCount = 0;
  pollTimer = setInterval(() => pollOrder(orderId), POLL_INTERVAL);
}
function stopPoll() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}
async function pollOrder(orderId) {
  pollCount++;
  if (pollCount > POLL_MAX) {
    stopPoll();
    document.getElementById('qrTip').textContent = '订单已超时，请重新下单';
    document.getElementById('qrTip').style.color = '#d32f2f';
    // 清理超时订单
    localStorage.removeItem('pendingOrder');
    // 3秒后自动关闭弹窗
    setTimeout(() => {
      closeQrModal();
    }, 3000);
    return;
  }
  try {
    const url = `${EPAY_CONFIG.apiUrl}/api.php?act=order&pid=${EPAY_CONFIG.pid}&key=${EPAY_CONFIG.key}&out_trade_no=${orderId}`;
    const resp = await fetch(url, { timeout: 5000 });
    const data = await resp.json();
    if (data.code === 1 && String(data.status) === '1') {
      stopPoll();
      closeQrModal();
      showSuccess(orderId);
    }
  } catch (_) { /* 网络抖动，忽略继续轮询 */ }
}

// ============================================================
// 支付成功 → 生成密钥并显示
// ============================================================
function showSuccess(orderId) {
  const raw = localStorage.getItem('pendingOrder');
  let serviceId = 'service1', price = 0, serviceName = '';
  if (raw) {
    try {
      const o    = JSON.parse(raw);
      serviceId   = o.serviceId   || serviceId;
      price       = o.price       || price;
      serviceName = o.serviceName || serviceName;
    } catch(_) {}
    localStorage.removeItem('pendingOrder');
  }
  const key = generateServiceKey(orderId, serviceId, price);
  document.getElementById('serviceKey').textContent = key;
  document.getElementById('successQQ').textContent  = CUSTOMER_QQ;
  showModal('successModal');
  // 本地存档
  const orders = JSON.parse(localStorage.getItem('orders') || '[]');
  orders.push({ orderId, serviceName, price, serviceId, key, ts: Date.now(), qq: CUSTOMER_QQ });
  localStorage.setItem('orders', JSON.stringify(orders));
}

// ============================================================
// 页面加载：处理易支付 return_url 回跳
// ============================================================
function checkReturnCallback() {
  const p            = new URLSearchParams(window.location.search);
  const tradeStatus  = p.get('trade_status');
  const outTradeNo   = p.get('out_trade_no');
  if (tradeStatus === 'TRADE_SUCCESS' && outTradeNo) {
    window.history.replaceState({}, document.title, window.location.pathname);
    showSuccess(outTradeNo);
  }
}

window.addEventListener('load', checkReturnCallback);

// 点击弹窗背景关闭
window.onclick = function(e) {
  if (e.target === document.getElementById('paymentModal'))  closePaymentModal();
  if (e.target === document.getElementById('qrModal'))       closeQrModal();
  if (e.target === document.getElementById('successModal'))  closeSuccessModal();
};