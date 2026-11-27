SELECT Region, dt_month, AGG(Nettoerlös), AGG(Umsatzkosten), AGG(Rohertrag), AGG(Bruttomarge)
FROM MODEL
WHERE dt_month = '2025-02-01'
GROUP BY Region, dt_month
