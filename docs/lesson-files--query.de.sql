SELECT Region, AGG(Umsatz), AGG(UmsatzAbgeschlossenerBestellungen), AGG(Vormonatsumsatz), AGG(DurchschnittsumsatzJeKunde), AGG(UmsatzanteilAllerRegionen)
FROM MODEL
WHERE dt_month = '2025-02-01'
GROUP BY Region
