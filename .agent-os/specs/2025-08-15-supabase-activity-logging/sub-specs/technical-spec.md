# Technical Specification: Supabase Activity Console Logging

> Created: 2025-08-15
> Status: Planning

## Architecture Overview

Create a logging wrapper system that intercepts all Supabase operations and provides detailed console output for debugging and monitoring purposes. The system will be implemented as a middleware layer that wraps the existing Supabase client.

## Core Components

### 1. Logger Configuration

```typescript
interface LoggerConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  includeMetadata: boolean;
  includePerformance: boolean;
  includeStackTrace: boolean;
  colorize: boolean;
}
```

### 2. Log Entry Structure

```typescript
interface LogEntry {
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
```

### 3. Logging Wrapper Functions

#### Database Operations Logger
```typescript
class SupabaseLogger {
  private config: LoggerConfig;
  private client: SupabaseClient;

  // Wrap select operations
  logSelect(table: string, query: any, response: any, duration: number): void;
  
  // Wrap insert operations
  logInsert(table: string, data: any, response: any, duration: number): void;
  
  // Wrap update operations
  logUpdate(table: string, data: any, filters: any, response: any, duration: number): void;
  
  // Wrap delete operations
  logDelete(table: string, filters: any, response: any, duration: number): void;
  
  // Wrap RPC calls
  logRPC(functionName: string, params: any, response: any, duration: number): void;
  
  // Wrap auth operations
  logAuth(operation: string, data: any, response: any, duration: number): void;
}
```

## Implementation Strategy

### 1. Client Wrapper Approach

Create a proxy wrapper around the Supabase client that intercepts all operations:

```typescript
export class LoggedSupabaseClient {
  private client: SupabaseClient;
  private logger: SupabaseLogger;

  constructor(client: SupabaseClient, config?: LoggerConfig) {
    this.client = client;
    this.logger = new SupabaseLogger(config);
  }

  // Proxy all database operations
  from(table: string) {
    return new LoggedQueryBuilder(this.client.from(table), this.logger, table);
  }

  // Proxy auth operations
  get auth() {
    return new LoggedAuth(this.client.auth, this.logger);
  }

  // Proxy RPC operations
  rpc(fn: string, args?: any) {
    return this.loggedRPC(fn, args);
  }
}
```

### 2. Query Builder Wrapper

Wrap Supabase query builder to log operations:

```typescript
class LoggedQueryBuilder {
  private queryBuilder: any;
  private logger: SupabaseLogger;
  private table: string;
  private operation: string;
  private startTime: number;

  select(columns?: string) {
    this.operation = 'select';
    this.startTime = performance.now();
    return this.executeWithLogging(() => this.queryBuilder.select(columns));
  }

  insert(data: any) {
    this.operation = 'insert';
    this.startTime = performance.now();
    return this.executeWithLogging(() => this.queryBuilder.insert(data));
  }

  // Similar for update, delete, etc.
}
```

### 3. Console Output Format

#### Standard Log Format
```
[SUPABASE] 2025-08-15T10:30:45.123Z | SELECT | users | 45ms | ✓
├─ Query: select id, email, full_name from users where id = $1
├─ Data: ["user-123"]
├─ Response: { data: [{ id: "user-123", email: "user@example.com" }], error: null }
└─ Metadata: { user: "authenticated", session: "sess_abc123" }
```

#### Error Log Format
```
[SUPABASE] 2025-08-15T10:30:45.123Z | INSERT | orders | 120ms | ✗
├─ Query: insert into orders (user_id, total_amount) values ($1, $2)
├─ Data: ["user-123", 25.99]
├─ Error: duplicate key value violates unique constraint "orders_order_number_key"
├─ Stack: Error: insert failed at SupabaseLogger.logInsert (logger.ts:45)
└─ Metadata: { user: "user-123", session: "sess_abc123" }
```

## Integration Points

### 1. Main Supabase Client (`lib/supabase.ts`)

Replace the existing client with the logged version:

```typescript
import { LoggedSupabaseClient } from './utils/supabaseLogger';

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const supabase = new LoggedSupabaseClient(supabaseClient, {
  enabled: __DEV__, // Only enable in development
  logLevel: 'debug',
  includeMetadata: true,
  includePerformance: true,
  colorize: true,
});
```

### 2. Existing Service Files

No changes required - the logging wrapper will automatically capture all operations through the existing service files:
- `lib/cart.ts`
- `lib/orders.ts` 
- `services/razorpayService.ts`
- etc.

## Performance Considerations

1. **Development Only**: Logging only enabled in development mode
2. **Minimal Overhead**: Use performance.now() for timing measurements
3. **Async Logging**: Non-blocking console output
4. **Memory Management**: Avoid storing large objects in memory

## Configuration Options

### Environment-based Configuration

```typescript
const loggerConfig: LoggerConfig = {
  enabled: process.env.NODE_ENV === 'development',
  logLevel: (process.env.SUPABASE_LOG_LEVEL as any) || 'info',
  includeMetadata: process.env.SUPABASE_LOG_METADATA === 'true',
  includePerformance: process.env.SUPABASE_LOG_PERFORMANCE !== 'false',
  includeStackTrace: process.env.SUPABASE_LOG_STACK === 'true',
  colorize: process.env.SUPABASE_LOG_COLOR !== 'false',
};
```

## Security Considerations

1. **Data Sanitization**: Mask sensitive data in logs (passwords, tokens, etc.)
2. **Development Only**: Ensure logging is disabled in production
3. **PII Protection**: Avoid logging personally identifiable information
4. **Credential Masking**: Hide API keys and secrets in log output

## Testing Strategy

1. **Unit Tests**: Test logger functions independently
2. **Integration Tests**: Verify logging captures all operations correctly
3. **Performance Tests**: Ensure minimal impact on application performance
4. **Mock Tests**: Test with mocked Supabase responses