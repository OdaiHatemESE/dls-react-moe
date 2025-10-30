-- Add AcademicYearConfig table for managing active academic year
-- Run this against your parent portal database

CREATE TABLE AcademicYearConfig (
    id INT IDENTITY(1,1) PRIMARY KEY,
    academicYear VARCHAR(20) UNIQUE NOT NULL,
    yearValue INT NOT NULL,
    isActive BIT NOT NULL DEFAULT 0,
    description VARCHAR(MAX),
    createdBy VARCHAR(64),
    createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
);

-- Insert default academic years (2025-2026 to 2030-2031)
INSERT INTO AcademicYearConfig (academicYear, yearValue, isActive, description, createdBy, createdAt, updatedAt)
VALUES 
    ('2025-2026', 2026, 1, 'Academic year 2025-2026', 'system', GETDATE(), GETDATE()),
    ('2026-2027', 2027, 0, 'Academic year 2026-2027', 'system', GETDATE(), GETDATE()),
    ('2027-2028', 2028, 0, 'Academic year 2027-2028', 'system', GETDATE(), GETDATE()),
    ('2028-2029', 2029, 0, 'Academic year 2028-2029', 'system', GETDATE(), GETDATE()),
    ('2029-2030', 2030, 0, 'Academic year 2029-2030', 'system', GETDATE(), GETDATE()),
    ('2030-2031', 2031, 0, 'Academic year 2030-2031', 'system', GETDATE(), GETDATE());

-- Create index on isActive for faster queries
CREATE INDEX IX_AcademicYearConfig_isActive ON AcademicYearConfig(isActive);
