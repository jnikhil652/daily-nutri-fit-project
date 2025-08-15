import { SupabaseClient } from '@supabase/supabase-js';

// Task 1.1: Logger configuration interface and types
export interface LoggerConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  includeMetadata: boolean;
  includePerformance: boolean;
  includeStackTrace: boolean;
  colorize: boolean;
}

export interface LogEntry {
  timestamp: string;
  operation: string;
  table?: string;
  method: 'select' | 'insert' | 'update' | 'delete' | 'rpc' | 'auth';
  query?: string;
  data?: any;
  response?: any;
  error?: any;
  duration?: number;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type DatabaseOperation = 'select' | 'insert' | 'update' | 'delete' | 'rpc' | 'auth';

// Task 1.2: Base SupabaseLogger class with console formatting
export class SupabaseLogger {
  private config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      enabled: __DEV__,
      logLevel: 'debug',
      includeMetadata: true,
      includePerformance: true,
      includeStackTrace: false,
      colorize: true,
      ...config,
    };
  }

  // Task 1.3: Performance timing utilities
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatDuration(duration: number): string {
    if (duration < 1000) {
      return `${Math.round(duration)}ms`;
    }
    return `${(duration / 1000).toFixed(2)}s`;
  }

  // Task 1.4: Data sanitization for sensitive information
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'auth', 'authorization',
      'email', 'phone', 'ssn', 'credit_card', 'card_number'
    ];

    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;
      
      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
      }

      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const keyLower = key.toLowerCase();
        const isSensitive = sensitiveFields.some(field => keyLower.includes(field));
        
        if (isSensitive && typeof value === 'string') {
          result[key] = '***REDACTED***';
        } else if (typeof value === 'object' && value !== null) {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    return sanitizeObject(sanitized);
  }

  // Task 1.5: Colorized console output for better readability
  private getColorCode(level: LogLevel, isSuccess: boolean = true): string {
    if (!this.config.colorize) return '';

    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[34m',  // Blue
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
      success: '\x1b[32m', // Green
      reset: '\x1b[0m',   // Reset
      dim: '\x1b[2m',     // Dim
      bright: '\x1b[1m',  // Bright
    };

    if (!isSuccess) return colors.error;
    return colors[level] || colors.info;
  }

  private formatConsoleOutput(entry: LogEntry, isSuccess: boolean = true): void {
    if (!this.config.enabled) return;

    const color = this.getColorCode(this.config.logLevel, isSuccess);
    const reset = this.config.colorize ? '\x1b[0m' : '';
    const dim = this.config.colorize ? '\x1b[2m' : '';
    const bright = this.config.colorize ? '\x1b[1m' : '';
    
    const statusIcon = isSuccess ? '✓' : '✗';
    const durationStr = entry.duration ? this.formatDuration(entry.duration) : 'N/A';
    
    // Header line
    console.log(
      `${color}[SUPABASE]${reset} ${dim}${entry.timestamp}${reset} | ` +
      `${bright}${entry.method.toUpperCase()}${reset} | ` +
      `${entry.table || entry.operation} | ` +
      `${durationStr} | ${statusIcon}`
    );

    // Query/Operation details
    if (entry.query) {
      console.log(`${dim}├─ Query: ${entry.query}${reset}`);
    }

    // Data (sanitized)
    if (entry.data !== undefined) {
      const sanitizedData = this.sanitizeData(entry.data);
      console.log(`${dim}├─ Data:${reset}`, sanitizedData);
    }

    // Response or Error
    if (entry.error) {
      console.log(`${dim}├─ Error: ${entry.error.message || entry.error}${reset}`);
      if (this.config.includeStackTrace && entry.error.stack) {
        console.log(`${dim}├─ Stack: ${entry.error.stack}${reset}`);
      }
    } else if (entry.response) {
      console.log(`${dim}├─ Response:${reset}`, this.sanitizeData(entry.response));
    }

    // Metadata
    if (this.config.includeMetadata && entry.metadata) {
      console.log(`${dim}└─ Metadata:${reset}`, entry.metadata);
    } else {
      console.log(`${dim}└─${reset}`);
    }

    console.log(''); // Empty line for readability
  }

  // Public logging methods for different operations
  logSelect(table: string, query: any, response: any, duration: number, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      operation: 'database_select',
      table,
      method: 'select',
      query: JSON.stringify(query),
      response,
      duration,
      metadata,
    };

    this.formatConsoleOutput(entry, !response?.error);
  }

  logInsert(table: string, data: any, response: any, duration: number, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      operation: 'database_insert',
      table,
      method: 'insert',
      data,
      response,
      duration,
      metadata,
    };

    this.formatConsoleOutput(entry, !response?.error);
  }

  logUpdate(table: string, data: any, filters: any, response: any, duration: number, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      operation: 'database_update',
      table,
      method: 'update',
      data,
      query: JSON.stringify(filters),
      response,
      duration,
      metadata,
    };

    this.formatConsoleOutput(entry, !response?.error);
  }

  logDelete(table: string, filters: any, response: any, duration: number, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      operation: 'database_delete',
      table,
      method: 'delete',
      query: JSON.stringify(filters),
      response,
      duration,
      metadata,
    };

    this.formatConsoleOutput(entry, !response?.error);
  }

  logRPC(functionName: string, params: any, response: any, duration: number, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      operation: `rpc_${functionName}`,
      method: 'rpc',
      data: params,
      response,
      duration,
      metadata,
    };

    this.formatConsoleOutput(entry, !response?.error);
  }

  logAuth(operation: string, data: any, response: any, duration: number, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      operation: `auth_${operation}`,
      method: 'auth',
      data,
      response,
      duration,
      metadata,
    };

    this.formatConsoleOutput(entry, !response?.error);
  }

  logError(operation: string, error: any, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      operation,
      method: 'select', // Default method for errors
      error,
      metadata,
    };

    this.formatConsoleOutput(entry, false);
  }

  // Configuration methods
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }
}

// Default logger configuration based on environment
export const getDefaultLoggerConfig = (): LoggerConfig => ({
  enabled: __DEV__ || process.env.NODE_ENV === 'development',
  logLevel: (process.env.EXPO_PUBLIC_SUPABASE_LOG_LEVEL as LogLevel) || 'debug',
  includeMetadata: process.env.EXPO_PUBLIC_SUPABASE_LOG_METADATA !== 'false',
  includePerformance: process.env.EXPO_PUBLIC_SUPABASE_LOG_PERFORMANCE !== 'false',
  includeStackTrace: process.env.EXPO_PUBLIC_SUPABASE_LOG_STACK === 'true',
  colorize: process.env.EXPO_PUBLIC_SUPABASE_LOG_COLOR !== 'false',
});