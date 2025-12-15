-- Check if Zones table has ManhalCode column and sample data
SELECT TOP 10 
    Id, 
    TitleEn, 
    TitleAr, 
    RegionId, 
    ManhalCode,
    IsActive
FROM Zones 
WHERE IsActive = 1 OR IsActive = CAST(1 AS bit)
ORDER BY Id;
