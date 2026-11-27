SELECT 地域, dt_month, AGG(純売上高), AGG(売上原価), AGG(粗利益), AGG(粗利率)
FROM MODEL
WHERE dt_month = '2025-02-01'
GROUP BY 地域, dt_month
