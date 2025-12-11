-- Add Circuit Breaker Metrics Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CircuitBreakerMetrics')
BEGIN
    CREATE TABLE [dbo].[CircuitBreakerMetrics] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [Name] NVARCHAR(100) NOT NULL,
        [State] NVARCHAR(20) NOT NULL,
        [Failures] INT NOT NULL DEFAULT 0,
        [Successes] INT NOT NULL DEFAULT 0,
        [Rejections] INT NOT NULL DEFAULT 0,
        [LastFailureTime] DATETIME2 NULL,
        [LastSuccessTime] DATETIME2 NULL,
        [NextAttemptTime] DATETIME2 NULL,
        [Timestamp] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    
    CREATE NONCLUSTERED INDEX [IX_CircuitBreakerMetrics_Name_Timestamp] 
    ON [dbo].[CircuitBreakerMetrics] ([Name], [Timestamp] DESC);
    
    PRINT 'Created CircuitBreakerMetrics table';
END
ELSE
BEGIN
    PRINT 'CircuitBreakerMetrics table already exists';
END
GO

-- Add Queue Metrics Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'QueueMetrics')
BEGIN
    CREATE TABLE [dbo].[QueueMetrics] (
        [Id] INT IDENTITY(1,1) PRIMARY KEY,
        [QueueName] NVARCHAR(100) NOT NULL,
        [CurrentPending] INT NOT NULL DEFAULT 0,
        [CurrentQueueSize] INT NOT NULL DEFAULT 0,
        [SuccessfulRequests] INT NOT NULL DEFAULT 0,
        [FailedRequests] INT NOT NULL DEFAULT 0,
        [RetriedRequests] INT NOT NULL DEFAULT 0,
        [SuccessRate] NVARCHAR(20) NULL,
        [Timestamp] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );
    
    CREATE NONCLUSTERED INDEX [IX_QueueMetrics_QueueName_Timestamp] 
    ON [dbo].[QueueMetrics] ([QueueName], [Timestamp] DESC);
    
    PRINT 'Created QueueMetrics table';
END
ELSE
BEGIN
    PRINT 'QueueMetrics table already exists';
END
GO

PRINT 'Resilience metrics tables migration completed';
