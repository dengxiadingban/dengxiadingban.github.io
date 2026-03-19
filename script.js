// 易支付配置（Cloudflare Workers模式）
const EPAY_CONFIG = {
    // 请替换为您的易支付商户ID（公开信息，可以暴露）
    pid: '1013',
    // 支付成功回调地址
    returnUrl: window.location.href,
    // Cloudflare Worker API地址（部署后替换为您的Worker地址）
    apiUrl: 'https://proud-bear-42.test228.deno.net'
};

// 客服QQ号配置
const CUSTOMER_QQ = '2871431784';

// 当前订单信息
let currentOrder = {
    serviceName: '',
    price: 0,
    serviceId: ''
};

// 密钥生成算法
function generateServiceKey(orderId, serviceName, timestamp, price) {
    // 使用自定义算法生成密钥
    // 这个算法结合了订单信息和时间戳，确保唯一性
    
    // 第一步：创建基础字符串
    const baseString = `${orderId}-${serviceName}-${timestamp}-${price}`;
    
    // 第二步：使用自定义哈希算法
    let hash = 0;
    for (let i = 0; i < baseString.length; i++) {
        const char = baseString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转换为32位整数
    }
    
    // 第三步：转换为正数并添加时间戳部分
    hash = Math.abs(hash);
    const timePart = timestamp.toString().slice(-6);
    
    // 第四步：生成最终密钥格式
    // 格式：服务ID-哈希值-时间戳后6位-价格编码
    const priceCode = Math.floor(price * 10).toString(36).toUpperCase();
    const hashCode = hash.toString(36).toUpperCase().padStart(8, '0');
    
    const key = `${currentOrder.serviceId.toUpperCase()}-${hashCode}-${timePart}-${priceCode}`;
    
    return key;
}

// 验证密钥的离线算法（供您参考，可以用其他语言实现）
function verifyServiceKey(key) {
    // 密钥格式：服务ID-哈希值-时间戳-价格编码
    const parts = key.split('-');
    if (parts.length !== 4) return false;
    
    const [serviceId, hashCode, timePart, priceCode] = parts;
    
    // 验证服务ID是否有效
    const validServices = ['SERVICE1', 'SERVICE2', 'SERVICE3'];
    if (!validServices.includes(serviceId)) return false;
    
    // 验证格式
    if (hashCode.length !== 8) return false;
    if (timePart.length !== 6) return false;
    
    // 可以添加更多验证逻辑，比如时间戳是否在合理范围内
    const timestamp = parseInt(timePart);
    if (isNaN(timestamp)) return false;
    
    return true;
}

// 处理购买按钮点击
function handlePurchase(serviceName, price, serviceId) {
    currentOrder = {
        serviceName: serviceName,
        price: price,
        serviceId: serviceId
    };
    
    // 显示支付弹窗
    document.getElementById('modalService').textContent = `服务：${serviceName}`;
    document.getElementById('modalPrice').textContent = `金额：¥${price}`;
    document.getElementById('paymentModal').style.display = 'block';
}

// 关闭支付弹窗
function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

// 关闭成功弹窗
function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
}

// 使用指定支付方式支付
function payWithMethod(method) {
    // 生成订单号
    const orderId = 'ORDER' + Date.now() + Math.floor(Math.random() * 1000);
    
    // 关闭支付方式选择弹窗
    closePaymentModal();
    
    // 显示加载提示
    const loadingMsg = document.createElement('div');
    loadingMsg.id = 'loadingMsg';
    loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:#fff;padding:20px 40px;border-radius:10px;z-index:10000;font-size:16px;';
    loadingMsg.textContent = '正在跳转到支付页面...';
    document.body.appendChild(loadingMsg);
    
    // 发送请求到Cloudflare Worker获取支付链接
    fetch(EPAY_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: method,
            out_trade_no: orderId,
            name: currentOrder.serviceName,
            money: currentOrder.price,
            return_url: EPAY_CONFIG.returnUrl,
            notify_url: '',
            sitename: '商务咨询服务平台'
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络请求失败: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        // 移除加载提示
        const loading = document.getElementById('loadingMsg');
        if (loading) loading.remove();
        
        // 调试信息：打印返回的数据
        console.log('Worker返回数据:', data);
        
        if (data.debug) {
            console.log('调试信息:');
            console.log('- 签名字符串:', data.debug.signString);
            console.log('- 签名值:', data.debug.sign);
            console.log('- 参数:', data.debug.params);
        }
        
        if (data.success && data.payUrl) {
            // 保存订单信息到localStorage
            localStorage.setItem('pendingOrder', JSON.stringify({
                orderId: orderId,
                serviceName: currentOrder.serviceName,
                price: currentOrder.price,
                serviceId: currentOrder.serviceId,
                timestamp: Date.now()
            }));
            
            console.log('即将跳转到支付页面:', data.payUrl);
            
            // 跳转到支付页面
            window.location.href = data.payUrl;
        } else {
            console.error('支付请求失败:', data);
            alert('支付请求失败：' + (data.error || '未知错误'));
        }
    })
    .catch(error => {
        // 移除加载提示
        const loading = document.getElementById('loadingMsg');
        if (loading) loading.remove();
        
        console.error('支付请求错误:', error);
        alert('支付请求失败，请检查网络连接或稍后重试\n错误信息: ' + error.message);
    });
}

// 生成易支付签名（仅在使用后端API时需要，静态托管不使用）
function generateSign(params, key) {
    // 此函数仅在配置了后端API时使用
    // 静态托管模式下不需要此函数
    const sortedKeys = Object.keys(params).sort();
    let signStr = '';
    
    for (const k of sortedKeys) {
        if (params[k] && k !== 'sign' && k !== 'sign_type') {
            signStr += k + '=' + params[k] + '&';
        }
    }
    
    signStr += key;
    return md5(signStr);
}

// MD5函数（仅在使用后端API时需要）
function md5(string) {
    // 如果使用后端API模式，需要引入crypto-js库
    // <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
    // return CryptoJS.MD5(string).toString();
    
    // 静态托管模式下不需要MD5
    console.warn('静态托管模式下不需要MD5签名');
    return '';
}

// 模拟支付成功（实际应用中应该通过URL参数判断）
function simulatePaymentSuccess(orderId) {
    // 生成服务密钥
    const timestamp = Date.now();
    const serviceKey = generateServiceKey(
        orderId,
        currentOrder.serviceName,
        timestamp,
        currentOrder.price
    );
    
    // 显示成功弹窗
    document.getElementById('serviceKey').textContent = serviceKey;
    document.getElementById('successModal').style.display = 'block';
    
    // 可以将订单信息保存到localStorage
    saveOrderToLocal(orderId, serviceKey);
}

// 保存订单到本地存储
function saveOrderToLocal(orderId, serviceKey) {
    const order = {
        orderId: orderId,
        serviceName: currentOrder.serviceName,
        price: currentOrder.price,
        serviceId: currentOrder.serviceId,
        serviceKey: serviceKey,
        timestamp: Date.now(),
        customerQQ: CUSTOMER_QQ
    };
    
    // 获取现有订单
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
}

// 检查URL参数，判断是否是支付回调
function checkPaymentCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // 易支付回调参数示例：trade_no, out_trade_no, type, name, money, trade_status
    const tradeStatus = urlParams.get('trade_status');
    const outTradeNo = urlParams.get('out_trade_no');
    
    if (tradeStatus === 'TRADE_SUCCESS' && outTradeNo) {
        // 支付成功，从localStorage获取订单信息
        const pendingOrder = localStorage.getItem('pendingOrder');
        
        if (pendingOrder) {
            const orderData = JSON.parse(pendingOrder);
            
            // 验证订单号是否匹配
            if (orderData.orderId === outTradeNo) {
                currentOrder = {
                    serviceName: orderData.serviceName,
                    price: orderData.price,
                    serviceId: orderData.serviceId
                };
                
                // 显示支付成功页面
                simulatePaymentSuccess(outTradeNo);
                
                // 清除待处理订单
                localStorage.removeItem('pendingOrder');
            }
        } else {
            // 如果没有找到订单信息，尝试从URL参数获取
            const name = urlParams.get('name');
            const money = urlParams.get('money');
            
            // 根据订单名称匹配服务
            let serviceId = 'service1';
            if (name && name.includes('公司业务')) {
                serviceId = 'service2';
            } else if (name && name.includes('代理记账')) {
                serviceId = 'service3';
            }
            
            currentOrder = {
                serviceName: name || '未知服务',
                price: parseFloat(money) || 0,
                serviceId: serviceId
            };
            
            simulatePaymentSuccess(outTradeNo);
        }
        
        // 清除URL参数
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// 页面加载时检查是否是支付回调
window.addEventListener('load', () => {
    checkPaymentCallback();
});

// 点击弹窗外部关闭弹窗
window.onclick = function(event) {
    const paymentModal = document.getElementById('paymentModal');
    const successModal = document.getElementById('successModal');
    
    if (event.target === paymentModal) {
        closePaymentModal();
    }
    if (event.target === successModal) {
        closeSuccessModal();
    }
}

