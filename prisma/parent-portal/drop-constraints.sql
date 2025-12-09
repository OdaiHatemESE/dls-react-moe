-- Drop default constraints for IsPrimary columns
IF EXISTS (SELECT * FROM sys.default_constraints WHERE name = 'DF__ParentCon__IsPri__28B808A7')
    ALTER TABLE ParentContact DROP CONSTRAINT DF__ParentCon__IsPri__28B808A7;

IF EXISTS (SELECT * FROM sys.default_constraints WHERE object_id = OBJECT_ID(N'[dbo].[DF__StudentAd__IsPri__XXX]') AND parent_object_id = OBJECT_ID(N'[dbo].[StudentAddress]'))
    ALTER TABLE StudentAddress DROP CONSTRAINT [DF__StudentAd__IsPri__XXX];

IF EXISTS (SELECT * FROM sys.default_constraints WHERE object_id = OBJECT_ID(N'[dbo].[DF__StudentCo__IsPri__XXX]') AND parent_object_id = OBJECT_ID(N'[dbo].[StudentContact]'))
    ALTER TABLE StudentContact DROP CONSTRAINT [DF__StudentCo__IsPri__XXX];

-- Find and drop all default constraints on IsPrimary columns
DECLARE @sql NVARCHAR(MAX) = '';

SELECT @sql = @sql + 'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';'
FROM sys.default_constraints
WHERE parent_object_id IN (OBJECT_ID('ParentContact'), OBJECT_ID('StudentAddress'), OBJECT_ID('StudentContact'))
AND COL_NAME(parent_object_id, parent_column_id) = 'IsPrimary';

EXEC sp_executesql @sql;

-- Drop referenceId constraint from Notification if exists
DECLARE @notifSql NVARCHAR(MAX) = '';

SELECT @notifSql = @notifSql + 'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';'
FROM sys.default_constraints
WHERE parent_object_id = OBJECT_ID('Notification')
AND COL_NAME(parent_object_id, parent_column_id) = 'referenceId';

IF @notifSql <> ''
    EXEC sp_executesql @notifSql;
