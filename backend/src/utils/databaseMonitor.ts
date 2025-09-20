import { DatabaseDiagnostics } from '../services/databaseDiagnostics';
import { EventEmitter } from 'events';

export interface MonitoringConfig {
  healthCheckInterval: number; // milliseconds
  performanceCheckInterval: number; // milliseconds
  alertThresholds: {
    maxConnectionTime: number; // milliseconds
    maxActiveConnections: number;
    maxSlowQueries: number;
    minBufferPoolHitRate: number; // percentage
  };
}

export interface MonitoringAlert {
  id: string;
  type: 'connection' | 'performance' | 'error' | 'resource';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  data: any;
  resolved: boolean;
  resolvedAt?: Date;
}

export class DatabaseMonitor extends EventEmitter {
  private dbDiagnostics: DatabaseDiagnostics;
  private config: MonitoringConfig;
  private healthCheckInterval?: NodeJS.Timeout | undefined;
  private performanceCheckInterval?: NodeJS.Timeout | undefined;
  private alerts: Map<string, MonitoringAlert> = new Map();
  private isMonitoring: boolean = false;

  constructor(config: Partial<MonitoringConfig> = {}) {
    super();
    this.dbDiagnostics = new DatabaseDiagnostics();
    this.config = {
      healthCheckInterval: 30000, // 30 seconds
      performanceCheckInterval: 60000, // 1 minute
      alertThresholds: {
        maxConnectionTime: 1000, // 1 second
        maxActiveConnections: 50,
        maxSlowQueries: 10,
        minBufferPoolHitRate: 95, // 95%
      },
      ...config,
    };
  }

  /**
   * Start monitoring the database
   */
  start(): void {
    if (this.isMonitoring) {
      console.warn('Database monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    console.log('Starting database monitoring...');

    // Start health check monitoring
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Health check monitoring error:', error);
        this.emit('error', error);
      }
    }, this.config.healthCheckInterval);

    // Start performance monitoring
    this.performanceCheckInterval = setInterval(async () => {
      try {
        await this.performPerformanceCheck();
      } catch (error) {
        console.error('Performance monitoring error:', error);
        this.emit('error', error);
      }
    }, this.config.performanceCheckInterval);

    this.emit('started');
  }

  /**
   * Stop monitoring the database
   */
  stop(): void {
    if (!this.isMonitoring) {
      console.warn('Database monitoring is not running');
      return;
    }

    this.isMonitoring = false;

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    if (this.performanceCheckInterval) {
      clearInterval(this.performanceCheckInterval);
      this.performanceCheckInterval = undefined;
    }

    console.log('Database monitoring stopped');
    this.emit('stopped');
  }

  /**
   * Perform health check and generate alerts if needed
   */
  private async performHealthCheck(): Promise<void> {
    const healthCheck = await this.dbDiagnostics.testConnectivity();
    
    // Check connection time
    if (healthCheck.latency > this.config.alertThresholds.maxConnectionTime) {
      this.createAlert({
        type: 'connection',
        severity: 'medium',
        message: `Database connection time exceeded threshold: ${healthCheck.latency}ms`,
        data: { latency: healthCheck.latency, threshold: this.config.alertThresholds.maxConnectionTime },
      });
    }

    // Check if connection failed
    if (!healthCheck.success) {
      this.createAlert({
        type: 'connection',
        severity: 'critical',
        message: 'Database connection failed',
        data: healthCheck,
      });
    }

    this.emit('healthCheck', healthCheck);
  }

  /**
   * Perform performance check and generate alerts if needed
   */
  private async performPerformanceCheck(): Promise<void> {
    const snapshot = await this.dbDiagnostics.capturePerformanceSnapshot();
    
    if (snapshot.error) {
      this.createAlert({
        type: 'performance',
        severity: 'high',
        message: 'Failed to capture performance snapshot',
        data: { error: snapshot.error },
      });
      return;
    }

    // Check active connections
    if (snapshot.connections.activeConnections > this.config.alertThresholds.maxActiveConnections) {
      this.createAlert({
        type: 'resource',
        severity: 'high',
        message: `High number of active connections: ${snapshot.connections.activeConnections}`,
        data: { 
          activeConnections: snapshot.connections.activeConnections,
          threshold: this.config.alertThresholds.maxActiveConnections,
        },
      });
    }

    // Check locked queries
    if (snapshot.connections.lockedQueries > 0) {
      this.createAlert({
        type: 'performance',
        severity: 'medium',
        message: `Queries are locked: ${snapshot.connections.lockedQueries}`,
        data: { lockedQueries: snapshot.connections.lockedQueries },
      });
    }

    this.emit('performanceCheck', snapshot);
  }

  /**
   * Create a new alert
   */
  private createAlert(alertData: Omit<MonitoringAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const alert: MonitoringAlert = {
      id: `${alertData.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      resolved: false,
      ...alertData,
    };

    this.alerts.set(alert.id, alert);
    this.emit('alert', alert);
    
    console.warn(`Database Alert [${alert.severity.toUpperCase()}]: ${alert.message}`, alert.data);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    this.alerts.set(alertId, alert);
    
    this.emit('alertResolved', alert);
    return true;
  }

  /**
   * Get all alerts
   */
  getAlerts(resolved?: boolean): MonitoringAlert[] {
    if (resolved === undefined) {
      return Array.from(this.alerts.values());
    }
    return Array.from(this.alerts.values()).filter(alert => alert.resolved === resolved);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: MonitoringAlert['severity']): MonitoringAlert[] {
    return Array.from(this.alerts.values()).filter(alert => alert.severity === severity);
  }

  /**
   * Clear resolved alerts older than specified days
   */
  clearOldAlerts(olderThanDays: number = 7): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let clearedCount = 0;
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt < cutoffDate) {
        this.alerts.delete(id);
        clearedCount++;
      }
    }
    
    return clearedCount;
  }

  /**
   * Get monitoring status
   */
  getStatus(): {
    isMonitoring: boolean;
    config: MonitoringConfig;
    alertCounts: {
      total: number;
      unresolved: number;
      bySeverity: Record<MonitoringAlert['severity'], number>;
    };
  } {
    const alerts = Array.from(this.alerts.values());
    const unresolvedAlerts = alerts.filter(alert => !alert.resolved);
    
    const bySeverity = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<MonitoringAlert['severity'], number>);

    return {
      isMonitoring: this.isMonitoring,
      config: this.config,
      alertCounts: {
        total: alerts.length,
        unresolved: unresolvedAlerts.length,
        bySeverity,
      },
    };
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  /**
   * Get current database performance metrics
   */
  async getCurrentMetrics(): Promise<{
    health: any;
    performance: any;
    connectivity: any;
  }> {
    const [health, performance, connectivity] = await Promise.all([
      this.dbDiagnostics.performHealthCheck(),
      this.dbDiagnostics.capturePerformanceSnapshot(),
      this.dbDiagnostics.testConnectivity(),
    ]);

    return { health, performance, connectivity };
  }
}

// Export a singleton instance
export const databaseMonitor = new DatabaseMonitor();
