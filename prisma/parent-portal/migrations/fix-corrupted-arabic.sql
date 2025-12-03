-- Fix corrupted Arabic text in StudentActionConfig table
-- Run this AFTER you've applied the NVARCHAR migration

-- This script updates the most common actions with correct Arabic text
-- You can modify the WHERE clause to target specific actions

BEGIN TRANSACTION;

-- Update "Update Information" action (all education types)
UPDATE [StudentActionConfig]
SET 
  actionName = N'تحديث المعلومات',
  configJson = JSON_MODIFY(
    JSON_MODIFY(
      JSON_MODIFY(
        ISNULL(configJson, '{}'),
        '$.display.label.ar',
        N'تحديث المعلومات'
      ),
      '$.display.shortLabel.ar',
      N'تحديث'
    ),
    '$.display.description.ar',
    N'يمكن للآباء تحديث معلومات الطالب'
  )
WHERE actionKey = 'update-info'
  OR actionName LIKE '%?????%'
  OR actionName = 'Update Information';

-- Update "Sign Conduct" action (all education types)
UPDATE [StudentActionConfig]
SET 
  actionName = N'توقيع الميثاق',
  configJson = JSON_MODIFY(
    JSON_MODIFY(
      JSON_MODIFY(
        ISNULL(configJson, '{}'),
        '$.display.label.ar',
        N'توقيع الميثاق'
      ),
      '$.display.shortLabel.ar',
      N'توقيع'
    ),
    '$.display.description.ar',
    N'راجع ووقع على ميثاق السلوك المدرسي'
  )
WHERE actionKey = 'sign-conduct'
  OR actionName = 'Sign Conduct';

-- Update "Download Conduct" action (all education types)
UPDATE [StudentActionConfig]
SET 
  actionName = N'تحميل الميثاق',
  configJson = JSON_MODIFY(
    JSON_MODIFY(
      JSON_MODIFY(
        ISNULL(configJson, '{}'),
        '$.display.label.ar',
        N'تحميل الميثاق'
      ),
      '$.display.shortLabel.ar',
      N'تحميل'
    ),
    '$.display.description.ar',
    N'حمّل نسخة من اتفاقية السلوك الموقعة'
  )
WHERE actionKey = 'download-conduct'
  OR actionName = 'Download Conduct';

-- Update "View Profile" action (all education types)
UPDATE [StudentActionConfig]
SET 
  actionName = N'عرض الملف',
  configJson = JSON_MODIFY(
    JSON_MODIFY(
      JSON_MODIFY(
        ISNULL(configJson, '{}'),
        '$.display.label.ar',
        N'عرض الملف'
      ),
      '$.display.shortLabel.ar',
      N'عرض'
    ),
    '$.display.description.ar',
    N'استعرض معلومات ملف الطالب كاملة'
  )
WHERE actionKey = 'view-profile'
  OR actionName = 'View Profile';

-- Verify the updates
SELECT 
  id,
  educationType,
  actionName,
  actionKey,
  LEFT(configJson, 200) AS configJsonPreview
FROM [StudentActionConfig]
ORDER BY educationType, displayOrder;

-- If everything looks good, commit the transaction
-- COMMIT;

-- If something went wrong, rollback
-- ROLLBACK;

-- After reviewing the results above, uncomment either COMMIT or ROLLBACK
