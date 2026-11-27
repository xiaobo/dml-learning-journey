SELECT Region, dt_month, AGG(BruttomargeSeitJahresbeginn), AGG(BruttomargeImVorjahreszeitraum), AGG(MargenänderungInProzentpunkten)
FROM MODEL
WHERE dt_month = '2025-02-01'
GROUP BY Region, dt_month
