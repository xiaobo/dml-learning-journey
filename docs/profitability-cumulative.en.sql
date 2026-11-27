SELECT region, dt_month, AGG(gross_margin_ytd)
FROM MODEL
WHERE dt_month = '2025-02-01'
GROUP BY region, dt_month
