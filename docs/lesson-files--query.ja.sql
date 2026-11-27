SELECT 地域, AGG(売上高), AGG(完了注文の売上高), AGG(前月売上高), AGG(顧客当たり平均売上高), AGG(全地域の売上に占める割合)
FROM MODEL
WHERE dt_month = '2025-02-01'
GROUP BY 地域
