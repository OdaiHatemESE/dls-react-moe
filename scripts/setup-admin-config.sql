-- Add first admin user to the system
-- Replace the values below with your actual admin details

-- Example 1: Add admin user
INSERT INTO AdminUser (emirateId, name, email, isActive, createdBy, createdAt, updatedAt)
VALUES (
  '784198791735438',  -- Replace with actual Emirates ID (numbers only, no dashes)
  'System Administrator',  -- Admin name
  'odai.abughaith@moe.gov.ae',  -- Admin email (optional)
  1,  -- isActive (1 = true, 0 = false)
  'system',  -- Created by
  GETDATE(),  -- Current timestamp
  GETDATE()   -- Current timestamp
);

-- Example 2: Add multiple admin users
INSERT INTO AdminUser (emirateId, name, email, isActive, createdBy, createdAt, updatedAt)
VALUES 
  ('7841111111111111', 'Admin One', 'admin1@moe.gov.ae', 1, 'system', GETDATE(), GETDATE()),
  ('7842222222222222', 'Admin Two', 'admin2@moe.gov.ae', 1, 'system', GETDATE(), GETDATE()),
  ('7843333333333333', 'Admin Three', NULL, 1, 'system', GETDATE(), GETDATE());

-- Verify the admin users were added
SELECT * FROM AdminUser;

-- Create a sample update period
INSERT INTO UpdatePeriodConfig (name, startDate, endDate, isEnabled, description, createdBy, createdAt, updatedAt)
VALUES (
  'Initial Update Period',
  DATEADD(day, -7, GETDATE()),  -- Start 7 days ago
  DATEADD(day, 30, GETDATE()),  -- End 30 days from now
  1,  -- Enabled
  'First testing period for information updates',
  'system',
  GETDATE(),
  GETDATE()
);

-- Create sample student actions for Public education
INSERT INTO StudentActionConfig (educationType, actionName, actionKey, isEnabled, displayOrder, description, createdBy, createdAt, updatedAt)
VALUES 
  ('Public', 'Update Contact Information', 'update_contact', 1, 1, 'Update phone and email addresses', 'system', GETDATE(), GETDATE()),
  ('Public', 'Update Address', 'update_address', 1, 2, 'Update residential address', 'system', GETDATE(), GETDATE()),
  ('Public', 'Upload Documents', 'upload_documents', 1, 3, 'Upload required documents', 'system', GETDATE(), GETDATE());

-- Create sample student actions for Private education
INSERT INTO StudentActionConfig (educationType, actionName, actionKey, isEnabled, displayOrder, description, createdBy, createdAt, updatedAt)
VALUES 
  ('Private', 'Update Contact Information', 'update_contact', 1, 1, 'Update phone and email addresses', 'system', GETDATE(), GETDATE()),
  ('Private', 'Update Emergency Contact', 'update_emergency', 1, 2, 'Update emergency contact details', 'system', GETDATE(), GETDATE());

-- Verify everything was created
SELECT 'Admin Users' AS TableName, COUNT(*) AS RecordCount FROM AdminUser
UNION ALL
SELECT 'Update Periods', COUNT(*) FROM UpdatePeriodConfig
UNION ALL
SELECT 'Student Actions', COUNT(*) FROM StudentActionConfig;
