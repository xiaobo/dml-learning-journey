SELECT 地区, AGG(销售额), AGG(已完成订单销售额), AGG(上月销售额), AGG(客户平均销售额), AGG(占全部地区销售额的比例)
FROM MODEL
WHERE dt_month = '2025-02-01'
GROUP BY 地区
