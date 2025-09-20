import { PrismaClient } from '@prisma/client';
import { prisma } from '../prisma/client';

export interface DatabaseHealthCheck {
  timestamp: string;
  connectionPool: {
    acquisitionTime: number;
    ping: boolean;
    poolSize?: number;
    activeConnections?: number;
  };
  serverStatus: {
    version: string;
    connections: {
      total: number;
      maxUsed: number;
      maxAllowed: number;
      threadsConnected: number;
      threadsRunning: number;
      abortedConnects: number;
      connectionErrorsMaxConnections: number;
    };
  };
  performance: {
    slowQueries: number;
    questions: number;
    uptime: number;
    comSelect: number;
    comInsert: number;
    comUpdate: number;
    comDelete: number;
    activeLocks: number;
    bufferPool: {
      poolSize: number;
      poolData: number;
      poolPages: number;
      poolPagesData: number;
      poolPagesFree: number;
      poolPagesDirty: number;
      poolPagesFlushed: number;
      poolReadRequests: number;
      poolReads: number;
      poolWaitRequests: number;
      poolWriteRequests: number;
      poolWrites: number;
    };
  };
  errors: Array<{
    type: string;
    message: string;
    code?: string;
    errno?: number;
    timestamp: string;
  }>;
}

export interface ConnectionDiagnosis {
  errorCode: string;
  errorMessage: string;
  possibleCauses: string[];
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PerformanceSnapshot {
  timestamp: number;
  connections: {
    activeConnections: number;
    activeQueries: number;
    lockedQueries: number;
    avgQueryTime: number;
  };
  counters: {
    questions: number;
    comSelect: number;
    comInsert: number;
    comUpdate: number;
    comDelete: number;
    slowQueries: number;
    createdTmpTables: number;
    createdTmpDiskTables: number;
  };
  error?: string;
}

export interface PerformanceAnalysis {
  duration: number;
  averages: {
    activeConnections: number;
    activeQueries: number;
    lockedQueries: number;
  };
  rates: {
    queriesPerSecond: number;
    selectsPerSecond: number;
    insertsPerSecond: number;
    updatesPerSecond: number;
    deletesPerSecond: number;
  };
  alerts: string[];
  error?: string;
}

export class DatabaseDiagnostics {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Perform comprehensive database health check
   */
  async performHealthCheck(): Promise<DatabaseHealthCheck> {
    const results: DatabaseHealthCheck = {
      timestamp: new Date().toISOString(),
      connectionPool: {
        acquisitionTime: 0,
        ping: false,
      },
      serverStatus: {
        version: '',
        connections: {
          total: 0,
          maxUsed: 0,
          maxAllowed: 0,
          threadsConnected: 0,
          threadsRunning: 0,
          abortedConnects: 0,
          connectionErrorsMaxConnections: 0,
        },
      },
      performance: {
        slowQueries: 0,
        questions: 0,
        uptime: 0,
        comSelect: 0,
        comInsert: 0,
        comUpdate: 0,
        comDelete: 0,
        activeLocks: 0,
        bufferPool: {
          poolSize: 0,
          poolData: 0,
          poolPages: 0,
          poolPagesData: 0,
          poolPagesFree: 0,
          poolPagesDirty: 0,
          poolPagesFlushed: 0,
          poolReadRequests: 0,
          poolReads: 0,
          poolWaitRequests: 0,
          poolWriteRequests: 0,
          poolWrites: 0,
        },
      },
      errors: [],
    };

    try {
      // Test connection acquisition time
      const connectionStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1 as ping`;
      results.connectionPool.acquisitionTime = Date.now() - connectionStart;
      results.connectionPool.ping = true;

      // Get server version
      const versionResult = await this.prisma.$queryRaw<Array<{ version: string }>>`SELECT VERSION() as version`;
      results.serverStatus.version = versionResult[0]?.version || 'Unknown';

      // Get connection statistics
      const connectionStats = await this.prisma.$queryRaw<Array<{ Variable_name: string; Value: string }>>`
        SHOW GLOBAL STATUS WHERE Variable_name IN (
          'Connections', 'Max_used_connections', 'Threads_connected', 
          'Threads_running', 'Aborted_connects', 'Connection_errors_max_connections'
        )
      `;

      connectionStats.forEach(stat => {
        const value = parseInt(stat.Value, 10);
        switch (stat.Variable_name) {
          case 'Connections':
            results.serverStatus.connections.total = value;
            break;
          case 'Max_used_connections':
            results.serverStatus.connections.maxUsed = value;
            break;
          case 'Threads_connected':
            results.serverStatus.connections.threadsConnected = value;
            break;
          case 'Threads_running':
            results.serverStatus.connections.threadsRunning = value;
            break;
          case 'Aborted_connects':
            results.serverStatus.connections.abortedConnects = value;
            break;
          case 'Connection_errors_max_connections':
            results.serverStatus.connections.connectionErrorsMaxConnections = value;
            break;
        }
      });

      // Get max connections setting
      const maxConnectionsResult = await this.prisma.$queryRaw<Array<{ Value: string }>>`
        SHOW GLOBAL VARIABLES WHERE Variable_name = 'max_connections'
      `;
      results.serverStatus.connections.maxAllowed = parseInt(maxConnectionsResult[0]?.Value || '151', 10);

      // Get performance metrics
      const performanceStats = await this.prisma.$queryRaw<Array<{ Variable_name: string; Value: string }>>`
        SHOW GLOBAL STATUS WHERE Variable_name IN (
          'Slow_queries', 'Questions', 'Uptime', 'Com_select', 
          'Com_insert', 'Com_update', 'Com_delete'
        )
      `;

      performanceStats.forEach(stat => {
        const value = parseInt(stat.Value, 10);
        switch (stat.Variable_name) {
          case 'Slow_queries':
            results.performance.slowQueries = value;
            break;
          case 'Questions':
            results.performance.questions = value;
            break;
          case 'Uptime':
            results.performance.uptime = value;
            break;
          case 'Com_select':
            results.performance.comSelect = value;
            break;
          case 'Com_insert':
            results.performance.comInsert = value;
            break;
          case 'Com_update':
            results.performance.comUpdate = value;
            break;
          case 'Com_delete':
            results.performance.comDelete = value;
            break;
        }
      });

      // Check for active locks
      try {
        const lockStats = await this.prisma.$queryRaw<Array<{ active_locks: number }>>`
          SELECT COUNT(*) as active_locks 
          FROM INFORMATION_SCHEMA.INNODB_LOCKS
        `;
        results.performance.activeLocks = lockStats[0]?.active_locks || 0;
      } catch (lockError) {
        // INNODB_LOCKS might not be available in all MySQL versions
        results.performance.activeLocks = 0;
      }

      // Get buffer pool statistics
      const bufferStats = await this.prisma.$queryRaw<Array<{ Variable_name: string; Value: string }>>`
        SHOW GLOBAL STATUS WHERE Variable_name LIKE 'Innodb_buffer_pool%'
      `;

      bufferStats.forEach(stat => {
        const value = parseInt(stat.Value, 10);
        switch (stat.Variable_name) {
          case 'Innodb_buffer_pool_size':
            results.performance.bufferPool.poolSize = value;
            break;
          case 'Innodb_buffer_pool_data_pages':
            results.performance.bufferPool.poolPagesData = value;
            break;
          case 'Innodb_buffer_pool_pages_total':
            results.performance.bufferPool.poolPages = value;
            break;
          case 'Innodb_buffer_pool_pages_free':
            results.performance.bufferPool.poolPagesFree = value;
            break;
          case 'Innodb_buffer_pool_pages_dirty':
            results.performance.bufferPool.poolPagesDirty = value;
            break;
          case 'Innodb_buffer_pool_pages_flushed':
            results.performance.bufferPool.poolPagesFlushed = value;
            break;
          case 'Innodb_buffer_pool_read_requests':
            results.performance.bufferPool.poolReadRequests = value;
            break;
          case 'Innodb_buffer_pool_reads':
            results.performance.bufferPool.poolReads = value;
            break;
          case 'Innodb_buffer_pool_wait_free':
            results.performance.bufferPool.poolWaitRequests = value;
            break;
          case 'Innodb_buffer_pool_write_requests':
            results.performance.bufferPool.poolWriteRequests = value;
            break;
          case 'Innodb_buffer_pool_writes':
            results.performance.bufferPool.poolWrites = value;
            break;
        }
      });

    } catch (error: any) {
      results.errors.push({
        type: 'health_check_error',
        message: error.message,
        code: error.code,
        errno: error.errno,
        timestamp: new Date().toISOString(),
      });
    }

    return results;
  }

  /**
   * Diagnose specific connection issues
   */
  async diagnoseConnectionIssues(error: any): Promise<ConnectionDiagnosis> {
    const diagnosis: ConnectionDiagnosis = {
      errorCode: error.code || 'UNKNOWN',
      errorMessage: error.message || 'Unknown error',
      possibleCauses: [],
      recommendations: [],
      severity: 'low',
    };

    switch (error.code) {
      case 'ECONNREFUSED':
        diagnosis.severity = 'critical';
        diagnosis.possibleCauses = [
          'MySQL server is not running',
          'Wrong host or port configuration',
          'Firewall blocking the connection',
          'Network connectivity issues',
        ];
        diagnosis.recommendations = [
          'Check if MySQL service is running: sudo systemctl status mysql',
          'Verify host and port in connection configuration',
          'Test network connectivity: telnet <host> <port>',
          'Check firewall rules and security groups',
        ];
        break;

      case 'ER_ACCESS_DENIED_ERROR':
        diagnosis.severity = 'high';
        diagnosis.possibleCauses = [
          'Invalid username or password',
          'User doesn\'t have permission to access the database',
          'Host not allowed in user\'s host specification',
          'Authentication plugin mismatch',
        ];
        diagnosis.recommendations = [
          'Verify username and password are correct',
          'Check user permissions: SHOW GRANTS FOR \'user\'@\'host\'',
          'Verify user host permissions in mysql.user table',
          'Check authentication method compatibility',
        ];
        break;

      case 'ETIMEDOUT':
        diagnosis.severity = 'high';
        diagnosis.possibleCauses = [
          'Network latency or packet loss',
          'Connection timeout settings too low',
          'Server overloaded or slow queries',
          'Firewall dropping connections',
        ];
        diagnosis.recommendations = [
          'Increase connection timeout in pool configuration',
          'Check network latency and stability',
          'Analyze slow query log for performance issues',
          'Monitor server resource usage (CPU, memory, disk I/O)',
        ];
        break;

      case 'ER_TOO_MANY_CONNECTIONS':
        diagnosis.severity = 'critical';
        diagnosis.possibleCauses = [
          'Max connections limit reached',
          'Connection pool not releasing connections',
          'Application creating too many concurrent connections',
          'Long-running queries blocking connections',
        ];
        diagnosis.recommendations = [
          'Increase max_connections in MySQL configuration',
          'Review connection pool size and timeout settings',
          'Implement connection pooling properly',
          'Identify and optimize slow queries',
        ];
        break;

      case 'PROTOCOL_CONNECTION_LOST':
        diagnosis.severity = 'high';
        diagnosis.possibleCauses = [
          'Network interruption during query execution',
          'MySQL server restart or crash',
          'Query timeout exceeded',
          'Memory issues causing connection drop',
        ];
        diagnosis.recommendations = [
          'Implement connection retry logic',
          'Check MySQL error logs for server issues',
          'Monitor network stability',
          'Review query execution time and optimize long-running queries',
        ];
        break;

      case 'ER_LOCK_WAIT_TIMEOUT':
        diagnosis.severity = 'medium';
        diagnosis.possibleCauses = [
          'Long-running transactions holding locks',
          'Deadlock between concurrent transactions',
          'Inefficient query causing table locks',
          'Lock timeout setting too aggressive',
        ];
        diagnosis.recommendations = [
          'Identify blocking queries: SHOW ENGINE INNODB STATUS',
          'Optimize transaction logic to reduce lock time',
          'Increase innodb_lock_wait_timeout if appropriate',
          'Review query patterns for lock contention',
        ];
        break;

      case 'ER_LOCK_DEADLOCK':
        diagnosis.severity = 'medium';
        diagnosis.possibleCauses = [
          'Concurrent transactions accessing same resources in different order',
          'Missing indexes causing table-level locks',
          'Long-running transactions increasing deadlock probability',
        ];
        diagnosis.recommendations = [
          'Implement consistent ordering of resource access',
          'Add appropriate indexes to reduce lock scope',
          'Break large transactions into smaller ones',
          'Implement deadlock retry logic',
        ];
        break;

      case 'P1001':
        diagnosis.severity = 'critical';
        diagnosis.possibleCauses = [
          'Cannot connect to database server',
          'Database server is down or unreachable',
          'Network connectivity issues',
          'Authentication problems',
        ];
        diagnosis.recommendations = [
          'Check database server status',
          'Verify network connectivity',
          'Check database credentials',
          'Review connection string configuration',
        ];
        break;

      case 'P1008':
        diagnosis.severity = 'high';
        diagnosis.possibleCauses = [
          'Database operation timeout',
          'Long-running query exceeded timeout limit',
          'Database server overloaded',
          'Network latency issues',
        ];
        diagnosis.recommendations = [
          'Increase query timeout settings',
          'Optimize slow queries',
          'Check database server performance',
          'Review network connectivity',
        ];
        break;

      case 'P1017':
        diagnosis.severity = 'high';
        diagnosis.possibleCauses = [
          'Database server has closed the connection',
          'Connection pool exhausted',
          'Server restart or maintenance',
          'Network interruption',
        ];
        diagnosis.recommendations = [
          'Implement connection retry logic',
          'Check connection pool configuration',
          'Monitor database server status',
          'Review network stability',
        ];
        break;

      default:
        diagnosis.severity = 'medium';
        diagnosis.possibleCauses = ['Unknown database error'];
        diagnosis.recommendations = [
          'Check MySQL documentation for error code: ' + error.code,
          'Review MySQL error logs',
          'Enable general query log for debugging',
        ];
    }

    return diagnosis;
  }

  /**
   * Monitor real-time database performance
   */
  async monitorPerformance(durationSeconds: number = 60): Promise<PerformanceAnalysis> {
    const metrics: PerformanceSnapshot[] = [];
    const interval = 5000; // 5 seconds
    const iterations = Math.floor((durationSeconds * 1000) / interval);

    for (let i = 0; i < iterations; i++) {
      const snapshot = await this.capturePerformanceSnapshot();
      metrics.push(snapshot);

      if (i < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    return this.analyzePerformanceMetrics(metrics);
  }

  /**
   * Capture a performance snapshot
   */
  async capturePerformanceSnapshot(): Promise<PerformanceSnapshot> {
    try {
      const processlist = await this.prisma.$queryRaw<Array<{
        active_connections: number;
        active_queries: number;
        locked_queries: number;
        avg_query_time: number;
      }>>`
        SELECT 
          COUNT(*) as active_connections,
          SUM(CASE WHEN COMMAND != 'Sleep' THEN 1 ELSE 0 END) as active_queries,
          SUM(CASE WHEN STATE LIKE '%lock%' THEN 1 ELSE 0 END) as locked_queries,
          AVG(TIME) as avg_query_time
        FROM INFORMATION_SCHEMA.PROCESSLIST
      `;

      const status = await this.prisma.$queryRaw<Array<{ Variable_name: string; Value: string }>>`
        SHOW GLOBAL STATUS WHERE Variable_name IN (
          'Questions', 'Com_select', 'Com_insert', 'Com_update', 'Com_delete',
          'Slow_queries', 'Created_tmp_tables', 'Created_tmp_disk_tables'
        )
      `;

      const snapshot: PerformanceSnapshot = {
        timestamp: Date.now(),
        connections: processlist[0] ? {
          activeConnections: processlist[0].active_connections,
          activeQueries: processlist[0].active_queries,
          lockedQueries: processlist[0].locked_queries,
          avgQueryTime: processlist[0].avg_query_time,
        } : {
          activeConnections: 0,
          activeQueries: 0,
          lockedQueries: 0,
          avgQueryTime: 0,
        },
        counters: {
          questions: 0,
          comSelect: 0,
          comInsert: 0,
          comUpdate: 0,
          comDelete: 0,
          slowQueries: 0,
          createdTmpTables: 0,
          createdTmpDiskTables: 0,
        },
      };

      status.forEach(stat => {
        const value = parseInt(stat.Value, 10);
        switch (stat.Variable_name) {
          case 'Questions':
            snapshot.counters.questions = value;
            break;
          case 'Com_select':
            snapshot.counters.comSelect = value;
            break;
          case 'Com_insert':
            snapshot.counters.comInsert = value;
            break;
          case 'Com_update':
            snapshot.counters.comUpdate = value;
            break;
          case 'Com_delete':
            snapshot.counters.comDelete = value;
            break;
          case 'Slow_queries':
            snapshot.counters.slowQueries = value;
            break;
          case 'Created_tmp_tables':
            snapshot.counters.createdTmpTables = value;
            break;
          case 'Created_tmp_disk_tables':
            snapshot.counters.createdTmpDiskTables = value;
            break;
        }
      });

      return snapshot;

    } catch (error: any) {
      return {
        timestamp: Date.now(),
        connections: {
          activeConnections: 0,
          activeQueries: 0,
          lockedQueries: 0,
          avgQueryTime: 0,
        },
        counters: {
          questions: 0,
          comSelect: 0,
          comInsert: 0,
          comUpdate: 0,
          comDelete: 0,
          slowQueries: 0,
          createdTmpTables: 0,
          createdTmpDiskTables: 0,
        },
        error: error.message,
      };
    }
  }

  /**
   * Analyze performance metrics
   */
  analyzePerformanceMetrics(metrics: PerformanceSnapshot[]): PerformanceAnalysis {
    if (metrics.length < 2) {
      return { 
        duration: 0, 
        averages: { activeConnections: 0, activeQueries: 0, lockedQueries: 0 },
        rates: { queriesPerSecond: 0, selectsPerSecond: 0, insertsPerSecond: 0, updatesPerSecond: 0, deletesPerSecond: 0 },
        alerts: [],
        error: 'Insufficient data for analysis' 
      };
    }

    const analysis: PerformanceAnalysis = {
      duration: metrics.length > 0 && metrics[0] && metrics[metrics.length - 1] ? (metrics[metrics.length - 1]?.timestamp || 0) - (metrics[0]?.timestamp || 0) : 0,
      averages: {
        activeConnections: 0,
        activeQueries: 0,
        lockedQueries: 0,
      },
      rates: {
        queriesPerSecond: 0,
        selectsPerSecond: 0,
        insertsPerSecond: 0,
        updatesPerSecond: 0,
        deletesPerSecond: 0,
      },
      alerts: [],
    };

    // Calculate averages
    const validMetrics = metrics.filter(m => !m.error);
    if (validMetrics.length > 0) {
      analysis.averages = {
        activeConnections: validMetrics.reduce((sum, m) => sum + m.connections.activeConnections, 0) / validMetrics.length,
        activeQueries: validMetrics.reduce((sum, m) => sum + m.connections.activeQueries, 0) / validMetrics.length,
        lockedQueries: validMetrics.reduce((sum, m) => sum + m.connections.lockedQueries, 0) / validMetrics.length,
      };
    }

    // Calculate query rates (queries per second)
    const firstMetric = validMetrics[0];
    const lastMetric = validMetrics[validMetrics.length - 1];
    
    if (firstMetric && lastMetric) {
      const timeDiff = (lastMetric.timestamp - firstMetric.timestamp) / 1000;

      if (timeDiff > 0) {
        analysis.rates = {
          queriesPerSecond: (lastMetric.counters.questions - firstMetric.counters.questions) / timeDiff,
          selectsPerSecond: (lastMetric.counters.comSelect - firstMetric.counters.comSelect) / timeDiff,
          insertsPerSecond: (lastMetric.counters.comInsert - firstMetric.counters.comInsert) / timeDiff,
          updatesPerSecond: (lastMetric.counters.comUpdate - firstMetric.counters.comUpdate) / timeDiff,
          deletesPerSecond: (lastMetric.counters.comDelete - firstMetric.counters.comDelete) / timeDiff,
        };
      }
    }

    // Generate alerts
    if (analysis.averages.activeConnections > 50) {
      analysis.alerts.push('High average connection count detected');
    }

    if (analysis.averages.lockedQueries > 5) {
      analysis.alerts.push('High number of locked queries detected');
    }

    if (analysis.rates.queriesPerSecond > 1000) {
      analysis.alerts.push('High query rate detected - consider optimization');
    }

    return analysis;
  }

  /**
   * Test database connectivity with detailed diagnostics
   */
  async testConnectivity(): Promise<{
    success: boolean;
    latency: number;
    error?: string;
    details: any;
  }> {
    const startTime = Date.now();
    
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;
      
      return {
        success: true,
        latency,
        details: {
          message: 'Database connection successful',
          responseTime: `${latency}ms`,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error.message,
        details: {
          code: error.code,
          errno: error.errno,
          sqlState: error.sqlState,
        },
      };
    }
  }

  /**
   * Get database schema information
   */
  async getSchemaInfo(): Promise<{
    tables: Array<{
      name: string;
      rows: number;
      size: number;
      engine: string;
    }>;
    indexes: Array<{
      table: string;
      name: string;
      columns: string;
      unique: boolean;
    }>;
  }> {
    try {
      const tables = await this.prisma.$queryRaw<Array<{
        TABLE_NAME: string;
        TABLE_ROWS: number;
        DATA_LENGTH: number;
        ENGINE: string;
      }>>`
        SELECT 
          TABLE_NAME,
          TABLE_ROWS,
          ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS DATA_LENGTH,
          ENGINE
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY DATA_LENGTH DESC
      `;

      const indexes = await this.prisma.$queryRaw<Array<{
        TABLE_NAME: string;
        INDEX_NAME: string;
        COLUMN_NAME: string;
        NON_UNIQUE: number;
      }>>`
        SELECT 
          TABLE_NAME,
          INDEX_NAME,
          GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) as COLUMN_NAME,
          NON_UNIQUE
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE()
        GROUP BY TABLE_NAME, INDEX_NAME
        ORDER BY TABLE_NAME, INDEX_NAME
      `;

      return {
        tables: tables.map(table => ({
          name: table.TABLE_NAME,
          rows: table.TABLE_ROWS,
          size: table.DATA_LENGTH,
          engine: table.ENGINE,
        })),
        indexes: indexes.map(index => ({
          table: index.TABLE_NAME,
          name: index.INDEX_NAME,
          columns: index.COLUMN_NAME,
          unique: index.NON_UNIQUE === 0,
        })),
      };
    } catch (error: any) {
      throw new Error(`Failed to get schema information: ${error.message}`);
    }
  }
}
