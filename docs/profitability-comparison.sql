SELECT region, dt_month, AGG(gross_margin_ytd), AGG(gross_margin_prior_ytd), AGG(margin_change_pp)
FROM MODEL
WHERE dt_month = '2025-02-01'
GROUP BY region, dt_month
