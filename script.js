let   currentOrder = null;
let   pollTimer    = null;
let   pollCount    = 0;
const POLL_MAX      = 72;    
const POLL_INTERVAL = 5000;

function _h(str) {
  const _sa = (x, y) => { const l = (x & 0xffff) + (y & 0xffff); return ((x >> 16) + (y >> 16) + (l >> 16)) << 16 | l & 0xffff; };
  const _r  = (n, c) => n << c | n >>> 32 - c;
  const _c  = (q, a, b, x, s, t) => _sa(_r(_sa(_sa(a, q), _sa(x, t)), s), b);
  const _ff = (a,b,c,d,x,s,t) => _c(b&c|~b&d,a,b,x,s,t);
  const _gg = (a,b,c,d,x,s,t) => _c(b&d|c&~d,a,b,x,s,t);
  const _hh = (a,b,c,d,x,s,t) => _c(b^c^d,a,b,x,s,t);
  const _ii = (a,b,c,d,x,s,t) => _c(c^(b|~d),a,b,x,s,t);
  const _s2b = s => { const b = []; for (let i = 0; i < s.length * 8; i += 8) b[i >> 5] |= (s.charCodeAt(i / 8) & 0xff) << i % 32; return b; };
  const _b2h = b => { const t = '0123456789abcdef'; let s = ''; for (let i = 0; i < b.length * 4; i++) s += t[b[i>>2]>>(i%4*8+4)&0xf]+t[b[i>>2]>>i%4*8&0xf]; return s; };
  const _core = (x, len) => {
    x[len >> 5] |= 0x80 << len % 32;
    x[(len + 64 >>> 9 << 4) + 14] = len;
    let a=1732584193,b=-271733879,c=-1732584194,d=271733878;
    for (let i = 0; i < x.length; i += 16) {
      const [oa,ob,oc,od]=[a,b,c,d];
      a=_ff(a,b,c,d,x[i+ 0], 7,-680876936);  d=_ff(d,a,b,c,x[i+ 1],12,-389564586);
      c=_ff(c,d,a,b,x[i+ 2],17, 606105819);  b=_ff(b,c,d,a,x[i+ 3],22,-1044525330);
      a=_ff(a,b,c,d,x[i+ 4], 7,-176418897);  d=_ff(d,a,b,c,x[i+ 5],12,1200080426);
      c=_ff(c,d,a,b,x[i+ 6],17,-1473231341); b=_ff(b,c,d,a,x[i+ 7],22,-45705983);
      a=_ff(a,b,c,d,x[i+ 8], 7,1770035416);  d=_ff(d,a,b,c,x[i+ 9],12,-1958414417);
      c=_ff(c,d,a,b,x[i+10],17,-42063);      b=_ff(b,c,d,a,x[i+11],22,-1990404162);
      a=_ff(a,b,c,d,x[i+12], 7,1804603682);  d=_ff(d,a,b,c,x[i+13],12,-40341101);
      c=_ff(c,d,a,b,x[i+14],17,-1502002290); b=_ff(b,c,d,a,x[i+15],22,1236535329);
      a=_gg(a,b,c,d,x[i+ 1], 5,-165796510);  d=_gg(d,a,b,c,x[i+ 6], 9,-1069501632);
      c=_gg(c,d,a,b,x[i+11],14, 643717713);  b=_gg(b,c,d,a,x[i+ 0],20,-373897302);
      a=_gg(a,b,c,d,x[i+ 5], 5,-701558691);  d=_gg(d,a,b,c,x[i+10], 9,38016083);
      c=_gg(c,d,a,b,x[i+15],14,-660478335);  b=_gg(b,c,d,a,x[i+ 4],20,-405537848);
      a=_gg(a,b,c,d,x[i+ 9], 5, 568446438);  d=_gg(d,a,b,c,x[i+14], 9,-1019803690);
      c=_gg(c,d,a,b,x[i+ 3],14,-187363961);  b=_gg(b,c,d,a,x[i+ 8],20,1163531501);
      a=_gg(a,b,c,d,x[i+13], 5,-1444681467); d=_gg(d,a,b,c,x[i+ 2], 9,-51403784);
      c=_gg(c,d,a,b,x[i+ 7],14,1735328473);  b=_gg(b,c,d,a,x[i+12],20,-1926607734);
      a=_hh(a,b,c,d,x[i+ 5], 4,-378558);     d=_hh(d,a,b,c,x[i+ 8],11,-2022574463);
      c=_hh(c,d,a,b,x[i+11],16,1839030562);  b=_hh(b,c,d,a,x[i+14],23,-35309556);
      a=_hh(a,b,c,d,x[i+ 1], 4,-1530992060); d=_hh(d,a,b,c,x[i+ 4],11,1272893353);
      c=_hh(c,d,a,b,x[i+ 7],16,-155497632);  b=_hh(b,c,d,a,x[i+10],23,-1094730640);
      a=_hh(a,b,c,d,x[i+13], 4, 681279174);  d=_hh(d,a,b,c,x[i+ 0],11,-358537222);
      c=_hh(c,d,a,b,x[i+ 3],16,-722521979);  b=_hh(b,c,d,a,x[i+ 6],23,76029189);
      a=_hh(a,b,c,d,x[i+ 9], 4,-640364487);  d=_hh(d,a,b,c,x[i+12],11,-421815835);
      c=_hh(c,d,a,b,x[i+15],16, 530742520);  b=_hh(b,c,d,a,x[i+ 2],23,-995338651);
      a=_ii(a,b,c,d,x[i+ 0], 6,-198630844);  d=_ii(d,a,b,c,x[i+ 7],10,1126891415);
      c=_ii(c,d,a,b,x[i+14],15,-1416354905); b=_ii(b,c,d,a,x[i+ 5],21,-57434055);
      a=_ii(a,b,c,d,x[i+12], 6,1700485571);  d=_ii(d,a,b,c,x[i+ 3],10,-1894986606);
      c=_ii(c,d,a,b,x[i+10],15,-1051523);    b=_ii(b,c,d,a,x[i+ 1],21,-2054922799);
      a=_ii(a,b,c,d,x[i+ 8], 6,1873313359);  d=_ii(d,a,b,c,x[i+15],10,-30611744);
      c=_ii(c,d,a,b,x[i+ 6],15,-1560198380); b=_ii(b,c,d,a,x[i+13],21,1309151649);
      a=_ii(a,b,c,d,x[i+ 4], 6,-145523070);  d=_ii(d,a,b,c,x[i+11],10,-1120210379);
      c=_ii(c,d,a,b,x[i+ 2],15, 718787259);  b=_ii(b,c,d,a,x[i+ 9],21,-343485551);
      a=_sa(a,oa); b=_sa(b,ob); c=_sa(c,oc); d=_sa(d,od);
    }
    return [a,b,c,d];
  };
  const enc = unescape(encodeURIComponent(str));
  return _b2h(_core(_s2b(enc), enc.length * 8));
}

function _sg(params) {
  const str = Object.entries(params)
    .filter(([k, v]) => v !== '' && v != null && k !== 'sign' && k !== 'sign_type')
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return _h(str + _0xb27e);
}

function _oid() {
  const base = Date.now().toString() + Math.floor(Math.random() * 900 + 100);
  const last  = parseInt(base.slice(-1));
  const even  = last % 2 === 0 ? last : (last + 1 > 9 ? 0 : last + 1);
  return base.slice(0, -1) + even;
}

function _sk(orderId, serviceId, price) {
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

function showModal(id)  { document.getElementById(id).style.display = 'block'; }
function hideModal(id)  { document.getElementById(id).style.display = 'none'; }
function closePaymentModal() { hideModal('paymentModal'); }
function closeSuccessModal() { hideModal('successModal'); }
function closeQrModal()      { stopPoll(); hideModal('qrModal'); }

function handlePurchase(serviceName, price, serviceId) {
  currentOrder = { serviceName, price, serviceId };
  document.getElementById('modalService').textContent = `服务：${serviceName}`;
  document.getElementById('modalPrice').textContent   = `金额：¥${price}`;
  showModal('paymentModal');
}

function payWithMethod(method) {
  hideModal('paymentModal');

  const orderId = _oid();
  const money   = currentOrder.price.toFixed(2);
  const name    = currentOrder.serviceName;

  const notifyUrl = window.location.origin + '/notify.txt';
  const returnUrl = window.location.href.split('?')[0];

  const params = {
    pid:          _0xaf3c,
    type:         method,
    out_trade_no: orderId,
    notify_url:   notifyUrl,
    return_url:   returnUrl,
    name:         name,
    money:        money,
  };
  const sign = _sg(params);

  localStorage.setItem('pendingOrder', JSON.stringify({
    orderId,
    serviceName: currentOrder.serviceName,
    price:       currentOrder.price,
    serviceId:   currentOrder.serviceId,
    method,
    ts:          Date.now(),
  }));

  document.getElementById('_fp').value  = _0xaf3c;
  document.getElementById('_ft').value  = method;
  document.getElementById('_fo').value  = orderId;
  document.getElementById('_fn').value  = notifyUrl;
  document.getElementById('_fr').value  = returnUrl;
  document.getElementById('_fna').value = name;
  document.getElementById('_fm').value  = money;
  document.getElementById('_fs').value  = sign;
  document.getElementById('_payForm').submit();
}

function _dx(data, key) {
  return data.map(n => String.fromCharCode(n ^ key)).join('');
}

const _0xaf3c = _dx([38, 39, 38, 36], 23);
const _0xb27e = _dx([92, 95, 103, 71, 119, 92, 121, 96, 112, 37, 119, 119, 103, 121, 38, 37, 38, 125, 89, 93, 64, 66, 37, 125, 89, 95, 74, 106, 38, 105, 121, 121], 19);
const _0xd19a = _dx([47, 37, 42, 44, 41, 46, 44, 42, 37, 41], 29);

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
    return;
  }
  try {
    const url  = `https://epay.aceyun.cn/api.php?act=order&pid=${_0xaf3c}&key=${_0xb27e}&out_trade_no=${orderId}`;
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.code === 1 && String(data.status) === '1') {
      stopPoll();
      showSuccess(orderId);
    }
  } catch (_) { /* 网络抖动，忽略 */ }
}

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
  const key = _sk(orderId, serviceId, price);
  document.getElementById('serviceKey').textContent = key;
  document.getElementById('successQQ').textContent  = _0xd19a;
  showModal('successModal');
  const orders = JSON.parse(localStorage.getItem('orders') || '[]');
  orders.push({ orderId, serviceName, price, serviceId, key, ts: Date.now(), qq: _0xd19a });
  localStorage.setItem('orders', JSON.stringify(orders));
}

window.addEventListener('load', () => {
  const p = new URLSearchParams(window.location.search);
  if (p.get('trade_status') === 'TRADE_SUCCESS' && p.get('out_trade_no')) {
    window.history.replaceState({}, document.title, window.location.pathname);
    showSuccess(p.get('out_trade_no'));
  }
});

window.onclick = (e) => {
  if (e.target === document.getElementById('paymentModal')) closePaymentModal();
  if (e.target === document.getElementById('successModal')) closeSuccessModal();
};
  