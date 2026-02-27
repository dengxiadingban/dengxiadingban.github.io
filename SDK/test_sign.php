<?php
// 测试易支付签名

$params = array(
    'pid' => '1013',
    'type' => 'wxpay',
    'out_trade_no' => 'ORDER1772194917982956',
    'notify_url' => '',
    'return_url' => 'https://dengxiadingban.github.io/',
    'name' => '个体工商户业务咨询',
    'money' => '19.9'
);

$key = 'O6vYiY855iuZxDdzLMX7XIVXilyUhYZB';
$targetSign = '27e8444764931073c256ff30798efdcb';

echo "=== 易支付签名测试（PHP版本） ===\n\n";
echo "目标签名: $targetSign\n\n";

// 按照SDK的逻辑生成签名
ksort($params);
$signstr = '';

echo "参数排序和拼接：\n";
foreach($params as $k => $v){
    echo "  $k = \"$v\"";
    if($k != "sign" && $k != "sign_type" && $v!=''){
        $signstr .= $k.'='.$v.'&';
        echo " ✓ 参与签名\n";
    } else {
        echo " ✗ 不参与签名（";
        if($v == '') echo "空值";
        if($k == "sign" || $k == "sign_type") echo "签名字段";
        echo "）\n";
    }
}

$signstr = substr($signstr, 0, -1);
echo "\n签名字符串（不含密钥）:\n$signstr\n\n";

$signstr .= $key;
echo "签名字符串（含密钥）:\n$signstr\n\n";

$sign = md5($signstr);
echo "MD5结果: $sign\n";
echo "目标签名: $targetSign\n";
echo "是否匹配: " . ($sign === $targetSign ? '✓ 是' : '✗ 否') . "\n\n";

if($sign !== $targetSign) {
    echo "❌ 签名不匹配！\n\n";
    echo "可能的原因：\n";
    echo "1. 密钥不正确（请检查易支付后台的商户密钥）\n";
    echo "2. 参数值有差异\n";
    echo "3. 字符编码问题\n";
}
?>

