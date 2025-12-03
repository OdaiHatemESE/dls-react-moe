-- Migration to fix Arabic text encoding in StudentActionConfig table
-- Convert VARCHAR columns to NVARCHAR to support Unicode characters

-- Update actionName column to NVARCHAR
ALTER TABLE [StudentActionConfig] 
ALTER COLUMN [actionName] NVARCHAR(255) NOT NULL;

-- Update description column to NVARCHAR
ALTER TABLE [StudentActionConfig] 
ALTER COLUMN [description] NVARCHAR(MAX) NULL;

-- Update configJson column to NVARCHAR
ALTER TABLE [StudentActionConfig] 
ALTER COLUMN [configJson] NVARCHAR(MAX) NULL;

GO
