SELECT region, dt_month, AGG(net_revenue), AGG(sales_cost), AGG(gross_profit), AGG(gross_margin)
FROM MODEL
WHERE dt_month = '2025-02-01'
GROUP BY region, dt_month
