SELECT 地区, dt_month, AGG(本年累计毛利率)
FROM MODEL
WHERE dt_month = '2025-02-01'
GROUP BY 地区, dt_month
