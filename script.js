// ============================================================
// 易支付配置（密钥和签名全部在 Worker 中处理）
// ============================================================
const EPAY_CONFIG = {
  workerUrl: window.location.origin + '/api/epay',
  notifyUrl: window.location.origin + '/notify_success.txt',
  returnUrl: window.location.href.split('?')[0],
  pid: null,
};

const CUSTOMER_QQ  = '2871431784';
let   currentOrder = null;
let   pollTimer    = null;
let   pollCount    = 0;
const POLL_MAX      = 72;    // 72 × 5s = 6 分钟
const POLL_INTERVAL = 5000;

// ============================================================
// 工具函数
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

function showModal(id) { document.getElementById(id).style.display = 'block'; }
function hideModal(id) { document.getElementById(id).style.display = 'none'; }
function closePaymentModal() { hideModal('paymentModal'); }
function closeSuccessModal()  { hideModal('successModal'); }
function closeQrModal()       { stopPoll(); hideModal('qrModal'); }

function genOrderId() {
  const base = Date.now().toString() + Math.floor(Math.random() * 900 + 100);
  const last  = parseInt(base.slice(-1));
  const even  = last % 2 === 0 ? last : (last + 1 > 9 ? 0 : last + 1);
  return base.slice(0, -1) + even;
}

function generateServiceKey(orderId, serviceId, price) {
  const ts   = Date.now();
  const base = `${orderId}-${serviceId}-${ts}-${price}`;
  let h = 0;
  for (let i = 0; i < base.length; i++) { h = ((h << 5) - h) + base.charCodeAt(i); h |= 0; }
  return [
    serviceId.toUpperCase(),
    Math.abs(h).toString(36).toUpperCase().padStart(8, '0'),
    ts.toString().slice(-6),
    Math.floor(price * 10).toString(36).toUpperCase()
  ].join('-');
}

// ============================================================
// Worker API 封装
// ============================================================
async function workerFetch(path, options = {}) {
  const resp = await fetch(`${EPAY_CONFIG.workerUrl}${path}`, options);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
  return resp.json();
}

// ============================================================
// 初始化：从 Worker 获取 PID 配置
// ============================================================
async function initConfig() {
  try {
    const data = await workerFetch('/config');
    if (data.code === 1) EPAY_CONFIG.pid = data.pid;
  } catch (err) {
    console.error('获取配置失败:', err);
  }
}

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
// 发起支付（签名由 Worker 生成，带重试）
// ============================================================
async function payWithMethod(method) {
  if (!EPAY_CONFIG.pid) {
    alert('支付配置未初始化，请刷新页面重试');
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
    device:       'pc',
  };

  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // 1. 请求 Worker 签名 + 下单（一步完成）
      const data = await workerFetch('/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
      });

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
        ts:          Date.now(),
      }));

      const { qrcode = '', payurl = '' } = data;
      if      (qrcode) showQrModal(qrcode, method, orderId);
      else if (payurl) showPayUrlModal(payurl, orderId);
      else             alert('易支付未返回支付信息，请稍后重试');
      return;
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        showLoading(`正在创建订单…（重试 ${attempt}/${MAX_RETRIES - 1}）`);
        await new Promise(r => setTimeout(r, 1000 * attempt));
      } else {
        hideLoading();
        alert(`网络错误，请重试\n${err.message}`);
      }
    }
  }
}

// ============================================================
// 支付弹窗
// ============================================================
function showQrModal(qrcodeUrl, method, orderId) {
  const label = method === 'alipay' ? '支付宝' : '微信';
  document.getElementById('qrTip').textContent         = `请使用${label}「扫一扫」完成支付`;
  document.getElementById('qrJumpArea').style.display   = 'none';
  document.getElementById('qrCanvasArea').style.display = 'block';
  const container = document.getElementById('qrCodeContainer');
  container.innerHTML = '';
  new QRCode(container, { text: qrcodeUrl, width: 200, height: 200, correctLevel: QRCode.CorrectLevel.M });
  showModal('qrModal');
  startPoll(orderId);
}

function showPayUrlModal(payurl, orderId) {
  document.getElementById('qrTip').textContent          = '点击下方按钮跳转至支付宝完成支付';
  document.getElementById('qrCanvasArea').style.display = 'none';
  document.getElementById('qrJumpArea').style.display   = 'block';
  document.getElementById('jumpPayBtn').href             = payurl;
  showModal('qrModal');
  startPoll(orderId);
}

// ============================================================
// 订单轮询
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
  if (++pollCount > POLL_MAX) {
    stopPoll();
    const tip = document.getElementById('qrTip');
    tip.textContent = '订单已超时，请重新下单';
    tip.style.color = '#d32f2f';
    localStorage.removeItem('pendingOrder');
    setTimeout(() => closeQrModal(), 3000);
    return;
  }
  try {
    const data = await workerFetch(
      `/api.php?act=order&pid=${EPAY_CONFIG.pid}&out_trade_no=${orderId}`
    );
    if (data.code === 1 && String(data.status) === '1') {
      stopPoll();
      closeQrModal();
      showSuccess(orderId);
    }
  } catch (_) { /* 网络抖动，忽略 */ }
}

// ============================================================
// 支付成功
// ============================================================
function showSuccess(orderId) {
  let serviceId = 'service1', price = 0, serviceName = '';
  const raw = localStorage.getItem('pendingOrder');
  if (raw) {
    try {
      const o = JSON.parse(raw);
      serviceId   = o.serviceId   || serviceId;
      price       = o.price       || price;
      serviceName = o.serviceName || serviceName;
    } catch (_) {}
    localStorage.removeItem('pendingOrder');
  }
  const key = generateServiceKey(orderId, serviceId, price);
  document.getElementById('serviceKey').textContent = key;
  document.getElementById('successQQ').textContent  = CUSTOMER_QQ;
  showModal('successModal');
  const orders = JSON.parse(localStorage.getItem('orders') || '[]');
  orders.push({ orderId, serviceName, price, serviceId, key, ts: Date.now(), qq: CUSTOMER_QQ });
  localStorage.setItem('orders', JSON.stringify(orders));
}

// ============================================================
// 页面初始化
// ============================================================
function checkReturnCallback() {
  const p = new URLSearchParams(window.location.search);
  if (p.get('trade_status') === 'TRADE_SUCCESS' && p.get('out_trade_no')) {
    window.history.replaceState({}, document.title, window.location.pathname);
    showSuccess(p.get('out_trade_no'));
  }
}

window.addEventListener('load', async () => {
  await initConfig();
  checkReturnCallback();
});

window.onclick = (e) => {
  if (e.target === document.getElementById('paymentModal'))  closePaymentModal();
  if (e.target === document.getElementById('qrModal'))       closeQrModal();
  if (e.target === document.getElementById('successModal'))  closeSuccessModal();
};
