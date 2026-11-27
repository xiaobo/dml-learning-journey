SELECT 地区, dt_month, AGG(净收入), AGG(销售成本), AGG(毛利), AGG(毛利率)
FROM MODEL
WHERE dt_month = '2025-02-01'
GROUP BY 地区, dt_month
