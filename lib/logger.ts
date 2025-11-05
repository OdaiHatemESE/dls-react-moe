/**
 * Structured logging utility with correlation ID support
 */

import { randomUUID } from 'crypto';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  studentId?: string;
  parentId?: string;
  endpoint?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
  duration?: number;
}

class Logger {
  private static formatLog(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  private static log(level: LogLevel, message: string, context?: LogContext, error?: Error, duration?: number): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
      ...(error && {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      }),
      ...(duration !== undefined && { duration }),
    };

    const formatted = this.formatLog(entry);

    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  static debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  static info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  static warn(message: string, context?: LogContext, error?: Error): void {
    this.log('warn', message, context, error);
  }

  static error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }

  static logDuration(message: string, durationMs: number, context?: LogContext): void {
    this.log('info', message, context, undefined, durationMs);
  }

  static generateCorrelationId(): string {
    return randomUUID();
  }
}

export default Logger;

/**
 * Creates a scoped logger with a correlation ID
 */
export function createScopedLogger(correlationId: string, baseContext: LogContext = {}) {
  const scopedContext = { ...baseContext, correlationId };

  return {
    debug: (message: string, additionalContext?: LogContext) =>
      Logger.debug(message, { ...scopedContext, ...additionalContext }),
    info: (message: string, additionalContext?: LogContext) =>
      Logger.info(message, { ...scopedContext, ...additionalContext }),
    warn: (message: string, additionalContext?: LogContext, error?: Error) =>
      Logger.warn(message, { ...scopedContext, ...additionalContext }, error),
    error: (message: string, additionalContext?: LogContext, error?: Error) =>
      Logger.error(message, { ...scopedContext, ...additionalContext }, error),
    logDuration: (message: string, durationMs: number, additionalContext?: LogContext) =>
      Logger.logDuration(message, durationMs, { ...scopedContext, ...additionalContext }),
  };
}
