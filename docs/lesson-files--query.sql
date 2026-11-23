SELECT region, AGG(sales), AGG(completed_sales), AGG(previous_sales), AGG(average_customer_sales), AGG(all_region_share)
FROM MODEL
WHERE dt_month = '2025-02-01'
GROUP BY region
