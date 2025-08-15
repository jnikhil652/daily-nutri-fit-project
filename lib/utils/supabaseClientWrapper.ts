import { SupabaseClient, PostgrestQueryBuilder, AuthApi, GoTrueClient } from '@supabase/supabase-js';
import { SupabaseLogger, LoggerConfig, getDefaultLoggerConfig } from './supabaseLogger';

// Task 2.1: LoggedSupabaseClient wrapper class
export class LoggedSupabaseClient {
  private client: SupabaseClient;
  private logger: SupabaseLogger;

  constructor(client: SupabaseClient, config?: Partial<LoggerConfig>) {
    this.client = client;
    this.logger = new SupabaseLogger(config || getDefaultLoggerConfig());
  }

  // Proxy all database operations with logging
  from(table: string) {
    return new LoggedQueryBuilder(this.client.from(table), this.logger, table);
  }

  // Proxy auth operations with logging
  get auth() {
    return new LoggedAuth(this.client.auth, this.logger);
  }

  // Proxy RPC operations with logging
  async rpc(fn: string, args?: any, options?: any) {
    return this.loggedRPC(fn, args, options);
  }

  private async loggedRPC(functionName: string, params?: any, options?: any) {
    if (!this.logger.isEnabled()) {
      return this.client.rpc(functionName, params, options);
    }

    const startTime = performance.now();
    let metadata: any = { function: functionName };

    // Task 2.5: Add error handling and fallback mechanisms for metadata gathering
    try {
      const userResult = await this.client.auth.getUser();
      metadata.userId = userResult?.data?.user?.id;
    } catch (error) {
      // Fallback: continue without user info if auth fails
      metadata.userId = 'unavailable';
    }

    try {
      const sessionResult = await this.client.auth.getSession();
      metadata.sessionId = sessionResult?.data?.session?.access_token?.substring(0, 8);
    } catch (error) {
      // Fallback: continue without session info if auth fails
      metadata.sessionId = 'unavailable';
    }

    try {
      const response = await this.client.rpc(functionName, params, options);
      const duration = performance.now() - startTime;
      
      this.logger.logRPC(functionName, params, response, duration, metadata);
      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Fallback: ensure logging doesn't break the original error flow
      try {
        this.logger.logRPC(functionName, params, { error }, duration, metadata);
      } catch (loggingError) {
        // If logging fails, ensure we don't break the original functionality
        console.warn('Supabase logging failed:', loggingError);
      }
      
      throw error;
    }
  }

  // Proxy other client properties and methods
  get storage() {
    return this.client.storage;
  }

  get realtime() {
    return this.client.realtime;
  }

  get functions() {
    return this.client.functions;
  }

  // Logger configuration methods
  updateLoggerConfig(config: Partial<LoggerConfig>): void {
    this.logger.updateConfig(config);
  }

  getLoggerConfig(): LoggerConfig {
    return this.logger.getConfig();
  }

  getOriginalClient(): SupabaseClient {
    return this.client;
  }
}

// Task 2.2: LoggedQueryBuilder for database operations
export class LoggedQueryBuilder {
  private queryBuilder: any;
  private logger: SupabaseLogger;
  private table: string;
  private operation: string = '';
  private startTime: number = 0;
  private queryData: any = undefined;
  private filters: any = undefined;

  constructor(queryBuilder: any, logger: SupabaseLogger, table: string) {
    this.queryBuilder = queryBuilder;
    this.logger = logger;
    this.table = table;
  }

  // SELECT operations
  select(columns?: string, options?: any) {
    this.operation = 'select';
    this.startTime = performance.now();
    this.queryData = { columns, options };
    
    return this.createChainableQuery(this.queryBuilder.select(columns, options));
  }

  // INSERT operations
  insert(data: any, options?: any) {
    this.operation = 'insert';
    this.startTime = performance.now();
    this.queryData = data;
    
    return this.createChainableQuery(this.queryBuilder.insert(data, options));
  }

  // UPDATE operations
  update(data: any, options?: any) {
    this.operation = 'update';
    this.startTime = performance.now();
    this.queryData = data;
    
    return this.createChainableQuery(this.queryBuilder.update(data, options));
  }

  // DELETE operations
  delete(options?: any) {
    this.operation = 'delete';
    this.startTime = performance.now();
    
    return this.createChainableQuery(this.queryBuilder.delete(options));
  }

  // UPSERT operations
  upsert(data: any, options?: any) {
    this.operation = 'upsert';
    this.startTime = performance.now();
    this.queryData = data;
    
    return this.createChainableQuery(this.queryBuilder.upsert(data, options));
  }

  // Filter methods that can be chained
  eq(column: string, value: any) {
    this.addFilter('eq', { column, value });
    return this.createChainableQuery(this.queryBuilder.eq(column, value));
  }

  neq(column: string, value: any) {
    this.addFilter('neq', { column, value });
    return this.createChainableQuery(this.queryBuilder.neq(column, value));
  }

  gt(column: string, value: any) {
    this.addFilter('gt', { column, value });
    return this.createChainableQuery(this.queryBuilder.gt(column, value));
  }

  gte(column: string, value: any) {
    this.addFilter('gte', { column, value });
    return this.createChainableQuery(this.queryBuilder.gte(column, value));
  }

  lt(column: string, value: any) {
    this.addFilter('lt', { column, value });
    return this.createChainableQuery(this.queryBuilder.lt(column, value));
  }

  lte(column: string, value: any) {
    this.addFilter('lte', { column, value });
    return this.createChainableQuery(this.queryBuilder.lte(column, value));
  }

  like(column: string, pattern: string) {
    this.addFilter('like', { column, pattern });
    return this.createChainableQuery(this.queryBuilder.like(column, pattern));
  }

  ilike(column: string, pattern: string) {
    this.addFilter('ilike', { column, pattern });
    return this.createChainableQuery(this.queryBuilder.ilike(column, pattern));
  }

  is(column: string, value: any) {
    this.addFilter('is', { column, value });
    return this.createChainableQuery(this.queryBuilder.is(column, value));
  }

  in(column: string, values: any[]) {
    this.addFilter('in', { column, values });
    return this.createChainableQuery(this.queryBuilder.in(column, values));
  }

  contains(column: string, value: any) {
    this.addFilter('contains', { column, value });
    return this.createChainableQuery(this.queryBuilder.contains(column, value));
  }

  containedBy(column: string, value: any) {
    this.addFilter('containedBy', { column, value });
    return this.createChainableQuery(this.queryBuilder.containedBy(column, value));
  }

  rangeLt(column: string, range: string) {
    this.addFilter('rangeLt', { column, range });
    return this.createChainableQuery(this.queryBuilder.rangeLt(column, range));
  }

  rangeGt(column: string, range: string) {
    this.addFilter('rangeGt', { column, range });
    return this.createChainableQuery(this.queryBuilder.rangeGt(column, range));
  }

  rangeGte(column: string, range: string) {
    this.addFilter('rangeGte', { column, range });
    return this.createChainableQuery(this.queryBuilder.rangeGte(column, range));
  }

  rangeLte(column: string, range: string) {
    this.addFilter('rangeLte', { column, range });
    return this.createChainableQuery(this.queryBuilder.rangeLte(column, range));
  }

  rangeAdjacent(column: string, range: string) {
    this.addFilter('rangeAdjacent', { column, range });
    return this.createChainableQuery(this.queryBuilder.rangeAdjacent(column, range));
  }

  overlaps(column: string, value: any) {
    this.addFilter('overlaps', { column, value });
    return this.createChainableQuery(this.queryBuilder.overlaps(column, value));
  }

  textSearch(column: string, query: string, options?: any) {
    this.addFilter('textSearch', { column, query, options });
    return this.createChainableQuery(this.queryBuilder.textSearch(column, query, options));
  }

  match(query: Record<string, any>) {
    this.addFilter('match', query);
    return this.createChainableQuery(this.queryBuilder.match(query));
  }

  not(column: string, operator: string, value: any) {
    this.addFilter('not', { column, operator, value });
    return this.createChainableQuery(this.queryBuilder.not(column, operator, value));
  }

  or(filters: string, options?: any) {
    this.addFilter('or', { filters, options });
    return this.createChainableQuery(this.queryBuilder.or(filters, options));
  }

  filter(column: string, operator: string, value: any) {
    this.addFilter('filter', { column, operator, value });
    return this.createChainableQuery(this.queryBuilder.filter(column, operator, value));
  }

  // Ordering and limiting
  order(column: string, options?: any) {
    this.addFilter('order', { column, options });
    return this.createChainableQuery(this.queryBuilder.order(column, options));
  }

  limit(count: number, options?: any) {
    this.addFilter('limit', { count, options });
    return this.createChainableQuery(this.queryBuilder.limit(count, options));
  }

  range(from: number, to: number, options?: any) {
    this.addFilter('range', { from, to, options });
    return this.createChainableQuery(this.queryBuilder.range(from, to, options));
  }

  single() {
    this.addFilter('single', {});
    return this.createChainableQuery(this.queryBuilder.single());
  }

  maybeSingle() {
    this.addFilter('maybeSingle', {});
    return this.createChainableQuery(this.queryBuilder.maybeSingle());
  }

  // Helper methods
  private addFilter(type: string, data: any) {
    if (!this.filters) {
      this.filters = [];
    }
    this.filters.push({ type, data });
  }

  private createChainableQuery(query: any): any {
    const self = this;
    
    // Create a proxy that maintains the logging context
    const proxyQuery = new Proxy(query, {
      get(target, prop) {
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          // Handle Promise methods - execute with logging
          return function(onFulfilled?: any, onRejected?: any) {
            return self.executeWithLogging(target).then(onFulfilled, onRejected);
          };
        }
        
        // For other methods, continue chaining
        if (typeof target[prop] === 'function') {
          return (...args: any[]) => {
            const result = target[prop](...args);
            // If it returns a query builder, wrap it
            if (result && typeof result.then === 'function') {
              return self.createChainableQuery(result);
            }
            return result;
          };
        }
        
        return target[prop];
      }
    });

    return proxyQuery;
  }

  private async executeWithLogging(query: any) {
    if (!this.logger.isEnabled()) {
      return query;
    }

    try {
      const response = await query;
      const duration = performance.now() - this.startTime;
      
      const metadata = {
        table: this.table,
        filters: this.filters,
      };

      // Task 2.5: Add error handling and fallback mechanisms for logging
      try {
        // Log based on operation type
        switch (this.operation) {
          case 'select':
            this.logger.logSelect(this.table, this.queryData, response, duration, metadata);
            break;
          case 'insert':
          case 'upsert':
            this.logger.logInsert(this.table, this.queryData, response, duration, metadata);
            break;
          case 'update':
            this.logger.logUpdate(this.table, this.queryData, this.filters, response, duration, metadata);
            break;
          case 'delete':
            this.logger.logDelete(this.table, this.filters, response, duration, metadata);
            break;
          default:
            this.logger.logSelect(this.table, this.queryData, response, duration, metadata);
        }
      } catch (loggingError) {
        // Fallback: ensure logging doesn't break the original functionality
        console.warn('Supabase query logging failed:', loggingError);
      }

      return response;
    } catch (error) {
      const duration = performance.now() - this.startTime;
      
      // Fallback: ensure error logging doesn't break the original error flow
      try {
        this.logger.logError(`${this.operation}_${this.table}`, error, {
          table: this.table,
          operation: this.operation,
          data: this.queryData,
          filters: this.filters,
          duration,
        });
      } catch (loggingError) {
        // If error logging fails, ensure we don't break the original error
        console.warn('Supabase error logging failed:', loggingError);
      }
      
      throw error;
    }
  }
}

// Task 2.3: LoggedAuth wrapper for authentication operations
export class LoggedAuth {
  private auth: GoTrueClient;
  private logger: SupabaseLogger;

  constructor(auth: GoTrueClient, logger: SupabaseLogger) {
    this.auth = auth;
    this.logger = logger;
  }

  async signUp(credentials: any) {
    return this.logAuthOperation('signUp', credentials, () => this.auth.signUp(credentials));
  }

  async signInWithPassword(credentials: any) {
    return this.logAuthOperation('signInWithPassword', { email: credentials.email }, () => 
      this.auth.signInWithPassword(credentials)
    );
  }

  async signInWithOtp(credentials: any) {
    return this.logAuthOperation('signInWithOtp', { email: credentials.email }, () => 
      this.auth.signInWithOtp(credentials)
    );
  }

  async signOut() {
    return this.logAuthOperation('signOut', {}, () => this.auth.signOut());
  }

  async resetPasswordForEmail(email: string, options?: any) {
    return this.logAuthOperation('resetPasswordForEmail', { email }, () => 
      this.auth.resetPasswordForEmail(email, options)
    );
  }

  async updateUser(attributes: any) {
    return this.logAuthOperation('updateUser', attributes, () => this.auth.updateUser(attributes));
  }

  async setSession(accessToken: string, refreshToken: string) {
    return this.logAuthOperation('setSession', { hasTokens: true }, () => 
      this.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    );
  }

  async refreshSession(refreshToken?: string) {
    return this.logAuthOperation('refreshSession', { hasRefreshToken: !!refreshToken }, () => 
      this.auth.refreshSession({ refresh_token: refreshToken })
    );
  }

  async getUser() {
    return this.logAuthOperation('getUser', {}, () => this.auth.getUser());
  }

  async getSession() {
    return this.logAuthOperation('getSession', {}, () => this.auth.getSession());
  }

  // Proxy other auth methods and properties
  onAuthStateChange(callback: any) {
    return this.auth.onAuthStateChange(callback);
  }

  // Helper method for logging auth operations with fallback mechanisms
  private async logAuthOperation(operation: string, data: any, executor: () => Promise<any>) {
    if (!this.logger.isEnabled()) {
      return executor();
    }

    const startTime = performance.now();
    
    try {
      const response = await executor();
      const duration = performance.now() - startTime;
      
      // Task 2.5: Add error handling and fallback mechanisms for auth logging
      try {
        this.logger.logAuth(operation, data, response, duration, {
          operation,
          success: !response?.error,
        });
      } catch (loggingError) {
        // Fallback: ensure logging doesn't break the original auth functionality
        console.warn('Supabase auth logging failed:', loggingError);
      }
      
      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Fallback: ensure error logging doesn't break the original error flow
      try {
        this.logger.logAuth(operation, data, { error }, duration, {
          operation,
          success: false,
        });
      } catch (loggingError) {
        // If error logging fails, ensure we don't break the original error
        console.warn('Supabase auth error logging failed:', loggingError);
      }
      
      throw error;
    }
  }
}