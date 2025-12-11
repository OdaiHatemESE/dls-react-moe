-- =============================================
-- API Resilience Metrics Table
-- Database: Parent Portal (Shared between .NET and Next.js/Prisma)
-- Purpose: Store API performance metrics for monitoring and analytics
-- Created: December 11, 2025
-- =============================================

-- Drop table if exists (for clean reinstall)
-- CAUTION: This will delete all existing metrics data!
-- IF OBJECT_ID('dbo.ApiMetrics', 'U') IS NOT NULL
--     DROP TABLE dbo.ApiMetrics;
-- GO

-- Create the ApiMetrics table
CREATE TABLE dbo.ApiMetrics (
    -- Primary Key
    Id INT IDENTITY(1,1) NOT NULL,
    
    -- Endpoint Information
    Endpoint NVARCHAR(500) NOT NULL,              -- API endpoint path (e.g., '/api/PP/student/[id]')
    ServiceName NVARCHAR(100) NULL,               -- Service name (PP, IDH, OneRoster, etc.)
    
    -- Timestamp (indexed for time-series queries)
    Timestamp DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    AggregationPeriod NVARCHAR(20) NOT NULL,      -- 'hourly', 'daily', 'realtime'
    
    -- Request Counts
    TotalRequests INT NOT NULL DEFAULT 0,
    SuccessfulRequests INT NOT NULL DEFAULT 0,
    FailedRequests INT NOT NULL DEFAULT 0,
    
    -- Error Breakdown
    TimeoutErrors INT NOT NULL DEFAULT 0,
    CircuitBreakerRejections INT NOT NULL DEFAULT 0,
    NetworkErrors INT NOT NULL DEFAULT 0,
    
    -- Retry Statistics
    TotalRetries INT NOT NULL DEFAULT 0,
    SuccessfulRetries INT NOT NULL DEFAULT 0,
    
    -- Response Time Metrics (in milliseconds)
    AvgResponseTime FLOAT NOT NULL DEFAULT 0,
    MinResponseTime FLOAT NOT NULL DEFAULT 0,
    MaxResponseTime FLOAT NOT NULL DEFAULT 0,
    P50ResponseTime FLOAT NULL,                   -- Median (50th percentile)
    P95ResponseTime FLOAT NULL,                   -- 95th percentile
    P99ResponseTime FLOAT NULL,                   -- 99th percentile
    
    -- HTTP Status Code Breakdown (JSON format)
    -- Example: {"200": 150, "404": 5, "500": 2, "504": 3}
    StatusCodeBreakdown NVARCHAR(MAX) NULL,
    
    -- Metadata
    CreatedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2(7) NOT NULL DEFAULT GETUTCDATE(),
    
    -- Primary Key Constraint
    CONSTRAINT PK_ApiMetrics PRIMARY KEY CLUSTERED (Id ASC)
        WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON)
);
GO

-- =============================================
-- Indexes for Performance
-- =============================================

-- Index for time-series queries (most common query pattern)
CREATE NONCLUSTERED INDEX IX_ApiMetrics_Timestamp_Endpoint 
ON dbo.ApiMetrics (Timestamp DESC, Endpoint)
INCLUDE (TotalRequests, SuccessfulRequests, FailedRequests, AvgResponseTime, P95ResponseTime);
GO

-- Index for endpoint-specific queries
CREATE NONCLUSTERED INDEX IX_ApiMetrics_Endpoint_Timestamp 
ON dbo.ApiMetrics (Endpoint, Timestamp DESC)
INCLUDE (TotalRequests, SuccessfulRequests, AvgResponseTime);
GO

-- Index for aggregation period queries (hourly/daily rollups)
CREATE NONCLUSTERED INDEX IX_ApiMetrics_AggregationPeriod_Timestamp 
ON dbo.ApiMetrics (AggregationPeriod, Timestamp DESC);
GO

-- Index for service-level queries
CREATE NONCLUSTERED INDEX IX_ApiMetrics_ServiceName_Timestamp 
ON dbo.ApiMetrics (ServiceName, Timestamp DESC)
WHERE ServiceName IS NOT NULL;
GO

-- =============================================
-- Default Constraints
-- =============================================

-- Note: DEFAULT constraints are already defined in CREATE TABLE statement
-- No need to add them separately

-- Auto-update UpdatedAt timestamp
-- Note: This requires a trigger (see below)

-- =============================================
-- Trigger: Auto-Update UpdatedAt
-- =============================================

CREATE OR ALTER TRIGGER TR_ApiMetrics_UpdatedAt
ON dbo.ApiMetrics
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE dbo.ApiMetrics
    SET UpdatedAt = GETUTCDATE()
    FROM dbo.ApiMetrics m
    INNER JOIN inserted i ON m.Id = i.Id;
END;
GO

-- =============================================
-- Sample Data Retention Policy (Optional)
-- =============================================

-- Keep realtime data for 7 days
-- Keep hourly aggregations for 90 days
-- Keep daily aggregations for 2 years

-- Create stored procedure for cleanup
CREATE OR ALTER PROCEDURE dbo.CleanupOldApiMetrics
    @RetentionDaysRealtime INT = 7,
    @RetentionDaysHourly INT = 90,
    @RetentionDaysDaily INT = 730
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @DeletedCount INT = 0;
    
    -- Delete old realtime data
    DELETE FROM dbo.ApiMetrics
    WHERE AggregationPeriod = 'realtime'
      AND Timestamp < DATEADD(DAY, -@RetentionDaysRealtime, GETUTCDATE());
    
    SET @DeletedCount = @DeletedCount + @@ROWCOUNT;
    
    -- Delete old hourly data
    DELETE FROM dbo.ApiMetrics
    WHERE AggregationPeriod = 'hourly'
      AND Timestamp < DATEADD(DAY, -@RetentionDaysHourly, GETUTCDATE());
    
    SET @DeletedCount = @DeletedCount + @@ROWCOUNT;
    
    -- Delete old daily data
    DELETE FROM dbo.ApiMetrics
    WHERE AggregationPeriod = 'daily'
      AND Timestamp < DATEADD(DAY, -@RetentionDaysDaily, GETUTCDATE());
    
    SET @DeletedCount = @DeletedCount + @@ROWCOUNT;
    
    -- Return count of deleted rows
    SELECT @DeletedCount AS DeletedRows;
END;
GO

-- =============================================
-- Helper Views for Common Queries
-- =============================================

-- View: Last 24 Hours Summary by Endpoint
CREATE OR ALTER VIEW vw_ApiMetrics_Last24Hours
AS
SELECT 
    Endpoint,
    ServiceName,
    SUM(TotalRequests) AS TotalRequests,
    SUM(SuccessfulRequests) AS SuccessfulRequests,
    SUM(FailedRequests) AS FailedRequests,
    CASE 
        WHEN SUM(TotalRequests) > 0 
        THEN CAST(SUM(SuccessfulRequests) AS FLOAT) / SUM(TotalRequests) * 100 
        ELSE 0 
    END AS SuccessRate,
    AVG(AvgResponseTime) AS AvgResponseTime,
    MAX(P95ResponseTime) AS P95ResponseTime,
    MAX(P99ResponseTime) AS P99ResponseTime,
    SUM(TimeoutErrors) AS TotalTimeouts,
    SUM(CircuitBreakerRejections) AS TotalCircuitBreakerRejections,
    MAX(Timestamp) AS LastRecorded
FROM dbo.ApiMetrics
WHERE Timestamp >= DATEADD(HOUR, -24, GETUTCDATE())
GROUP BY Endpoint, ServiceName;
GO

-- View: Current Hour Summary
CREATE OR ALTER VIEW vw_ApiMetrics_CurrentHour
AS
SELECT 
    Endpoint,
    ServiceName,
    SUM(TotalRequests) AS TotalRequests,
    SUM(SuccessfulRequests) AS SuccessfulRequests,
    SUM(FailedRequests) AS FailedRequests,
    AVG(AvgResponseTime) AS AvgResponseTime,
    MAX(P95ResponseTime) AS P95ResponseTime,
    SUM(TimeoutErrors) AS TimeoutErrors
FROM dbo.ApiMetrics
WHERE Timestamp >= DATEADD(HOUR, -1, GETUTCDATE())
GROUP BY Endpoint, ServiceName;
GO

-- =============================================
-- Sample Insert Queries (for testing)
-- =============================================

-- Insert sample realtime metric
INSERT INTO dbo.ApiMetrics 
    (Endpoint, ServiceName, AggregationPeriod, TotalRequests, SuccessfulRequests, 
     FailedRequests, AvgResponseTime, P95ResponseTime, P99ResponseTime)
VALUES 
    ('/api/PP/student/[id]', 'PP', 'realtime', 100, 95, 5, 1250.5, 2100.0, 3500.0);

-- Insert sample hourly aggregation
INSERT INTO dbo.ApiMetrics 
    (Endpoint, ServiceName, AggregationPeriod, Timestamp, TotalRequests, SuccessfulRequests, 
     FailedRequests, TimeoutErrors, AvgResponseTime, P95ResponseTime, P99ResponseTime)
VALUES 
    ('/api/PP/student/[id]', 'PP', 'hourly', DATEADD(HOUR, -1, GETUTCDATE()), 
     1500, 1450, 50, 12, 1850.3, 4200.0, 8500.0);

GO

-- =============================================
-- Sample Query: Get endpoint health scores
-- =============================================

-- Query to calculate health scores (similar to your metrics tracker)
SELECT 
    Endpoint,
    ServiceName,
    SUM(TotalRequests) AS TotalRequests,
    
    -- Availability Score (40%)
    CASE 
        WHEN SUM(TotalRequests) > 0 
        THEN (CAST(SUM(SuccessfulRequests) AS FLOAT) / SUM(TotalRequests)) * 40 
        ELSE 0 
    END AS AvailabilityScore,
    
    -- Performance Score (30%) - Based on P95 vs 2s baseline
    CASE 
        WHEN MAX(P95ResponseTime) <= 2000 THEN 30
        WHEN MAX(P95ResponseTime) > 2000 THEN GREATEST(0, 30 - ((MAX(P95ResponseTime) - 2000) / 2000 * 30))
        ELSE 30
    END AS PerformanceScore,
    
    -- Reliability Score (20%) - Based on retry success rate
    CASE 
        WHEN SUM(TotalRetries) > 0 
        THEN (CAST(SUM(SuccessfulRetries) AS FLOAT) / SUM(TotalRetries)) * 20 
        ELSE 20 
    END AS ReliabilityScore,
    
    -- Resilience Score (10%) - Based on circuit breaker rejections
    CASE 
        WHEN SUM(TotalRequests) > 0 
        THEN GREATEST(0, 10 - (CAST(SUM(CircuitBreakerRejections) AS FLOAT) / SUM(TotalRequests) * 100))
        ELSE 10 
    END AS ResilienceScore,
    
    -- Total Health Score (0-100)
    CASE 
        WHEN SUM(TotalRequests) > 0 
        THEN (CAST(SUM(SuccessfulRequests) AS FLOAT) / SUM(TotalRequests)) * 40 
        ELSE 0 
    END +
    CASE 
        WHEN MAX(P95ResponseTime) <= 2000 THEN 30
        WHEN MAX(P95ResponseTime) > 2000 THEN GREATEST(0, 30 - ((MAX(P95ResponseTime) - 2000) / 2000 * 30))
        ELSE 30
    END +
    CASE 
        WHEN SUM(TotalRetries) > 0 
        THEN (CAST(SUM(SuccessfulRetries) AS FLOAT) / SUM(TotalRetries)) * 20 
        ELSE 20 
    END +
    CASE 
        WHEN SUM(TotalRequests) > 0 
        THEN GREATEST(0, 10 - (CAST(SUM(CircuitBreakerRejections) AS FLOAT) / SUM(TotalRequests) * 100))
        ELSE 10 
    END AS HealthScore
    
FROM dbo.ApiMetrics
WHERE Timestamp >= DATEADD(HOUR, -24, GETUTCDATE())
GROUP BY Endpoint, ServiceName
ORDER BY HealthScore ASC;  -- Worst endpoints first
GO

-- =============================================
-- Grant Permissions (adjust based on your security model)
-- =============================================

-- Grant permissions to application user
-- GRANT SELECT, INSERT, UPDATE ON dbo.ApiMetrics TO [YourAppUser];
-- GRANT EXECUTE ON dbo.CleanupOldApiMetrics TO [YourAppUser];
-- GO

PRINT 'API Metrics table, indexes, views, and procedures created successfully!';
PRINT 'Table: dbo.ApiMetrics';
PRINT 'Views: vw_ApiMetrics_Last24Hours, vw_ApiMetrics_CurrentHour';
PRINT 'Stored Procedures: CleanupOldApiMetrics';
GO
