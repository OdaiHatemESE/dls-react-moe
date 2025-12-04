-- Check if StateID, CityID, RegionID, SectorID columns exist in the IDH table
-- Run this against your PP database

SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    CHARACTER_MAXIMUM_LENGTH
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'IDH' 
  OR TABLE_NAME = 'Idh'
  OR TABLE_NAME = 'idh'
ORDER BY ORDINAL_POSITION;

-- Alternative: Check all tables that might contain IDH data
SELECT 
    TABLE_NAME,
    COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE COLUMN_NAME IN ('StateID', 'CityID', 'RegionID', 'SectorID')
ORDER BY TABLE_NAME, COLUMN_NAME;
