SELECT 地域, dt_month, AGG(年初来粗利率), AGG(前年同期の年初来粗利率), AGG(粗利率の前年差ポイント)
FROM MODEL
WHERE dt_month = '2025-02-01'
GROUP BY 地域, dt_month
