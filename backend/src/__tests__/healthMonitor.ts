import axios from 'axios';
import mysql from 'mysql2/promise';
// import { PrismaClient } from '@prisma/client';

// System Health Monitor for Grip Invest Mini Platform
export class GripInvestHealthMonitor {
  private config: any;
  private healthStatus: any;
  private alertThresholds: any;

  constructor(config: any) {
    this.config = {
      frontend: {
        baseUrl: config.frontend?.baseUrl || 'http://localhost:3000',
        timeout: config.frontend?.timeout || 10000
      },
      backend: {
        baseUrl: config.backend?.baseUrl || 'http://localhost:8080',
        timeout: config.backend?.timeout || 10000
      },
      database: {
        host: config.database?.host || 'localhost',
        port: config.database?.port || 3307,
        user: config.database?.user || 'root',
        password: config.database?.password || 'password',
        database: config.database?.database || 'grip_invest'
      },
      ...config
    };
    
    this.healthStatus = {
      frontend: 'unknown',
      backend: 'unknown',
      database: 'unknown',
      overall: 'unknown',
      lastCheck: null
    };
    
    this.alertThresholds = {
      responseTime: 5000,
      errorRate: 0.05,
      memoryUsage: 0.85,
      cpuUsage: 0.80
    };
  }

  async performHealthCheck() {
    console.log('💊 [Health Monitor] Performing system-wide health check...');
    
    const checks = await Promise.allSettled([
      this.checkFrontendHealth(),
      this.checkBackendHealth(),
      this.checkDatabaseHealth()
    ]);
    
    const results = {
      frontend: checks[0].status === 'fulfilled' ? checks[0].value : { status: 'error', error: checks[0].reason },
      backend: checks[1].status === 'fulfilled' ? checks[1].value : { status: 'error', error: checks[1].reason },
      database: checks[2].status === 'fulfilled' ? checks[2].value : { status: 'error', error: checks[2].reason },
      timestamp: new Date().toISOString()
    };
    
    this.updateHealthStatus(results);
    return this.generateHealthReport(results);
  }

  async checkFrontendHealth() {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(this.config.frontend.baseUrl, {
        timeout: this.config.frontend.timeout
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: response.status === 200 ? 'healthy' : 'degraded',
        responseTime,
        statusCode: response.status,
        contentLength: response.headers['content-length'],
        lastModified: response.headers['last-modified']
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  async checkBackendHealth() {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${this.config.backend.baseUrl}/api/v1/health`, {
        timeout: this.config.backend.timeout
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: response.data?.status === 'healthy' ? 'healthy' : 'degraded',
        responseTime,
        details: response.data,
        version: response.data?.version,
        uptime: response.data?.uptime
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  async checkDatabaseHealth() {
    const startTime = Date.now();
    
    try {
      const connection = await mysql.createConnection({
        host: this.config.database.host,
        port: this.config.database.port,
        user: this.config.database.user,
        password: this.config.database.password,
        database: this.config.database.database
      });
      
      // Test basic connectivity
      await connection.execute('SELECT 1 as health_check');
      
      // Check connection pool status
      const [status] = await connection.execute(`
        SHOW GLOBAL STATUS WHERE Variable_name IN (
          'Threads_connected', 'Max_used_connections', 'Slow_queries'
        )
      `);
      
      const responseTime = Date.now() - startTime;
      await connection.end();
      
      const statusMap: any = {};
      (status as any[]).forEach(row => {
        statusMap[row.Variable_name] = row.Value;
      });
      
      return {
        status: 'healthy',
        responseTime,
        connections: statusMap.Threads_connected,
        maxConnections: statusMap.Max_used_connections,
        slowQueries: statusMap.Slow_queries
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  updateHealthStatus(results: any) {
    this.healthStatus.frontend = results.frontend.status;
    this.healthStatus.backend = results.backend.status;
    this.healthStatus.database = results.database.status;
    this.healthStatus.lastCheck = results.timestamp;
    
    // Determine overall health
    const statuses = [results.frontend.status, results.backend.status, results.database.status];
    if (statuses.includes('unhealthy')) {
      this.healthStatus.overall = 'unhealthy';
    } else if (statuses.includes('degraded')) {
      this.healthStatus.overall = 'degraded';
    } else {
      this.healthStatus.overall = 'healthy';
    }
  }

  generateHealthReport(results: any) {
    return {
      overall: this.healthStatus.overall,
      timestamp: results.timestamp,
      components: {
        frontend: results.frontend,
        backend: results.backend,
        database: results.database
      },
      alerts: this.generateHealthAlerts(results),
      recommendations: this.generateHealthRecommendations(results)
    };
  }

  generateHealthAlerts(results: any) {
    const alerts = [];
    
    // Response time alerts
    Object.entries(results).forEach(([component, data]: [string, any]) => {
      if (data.responseTime > this.alertThresholds.responseTime) {
        alerts.push({
          severity: 'warning',
          component,
          message: `High response time: ${data.responseTime}ms`,
          threshold: this.alertThresholds.responseTime
        });
      }
    });
    
    // Component health alerts
    if (results.frontend.status === 'unhealthy') {
      alerts.push({
        severity: 'critical',
        component: 'frontend',
        message: 'Frontend application is not accessible',
        error: results.frontend.error
      });
    }
    
    if (results.backend.status === 'unhealthy') {
      alerts.push({
        severity: 'critical',
        component: 'backend',
        message: 'Backend API is not responding',
        error: results.backend.error
      });
    }
    
    if (results.database.status === 'unhealthy') {
      alerts.push({
        severity: 'critical',
        component: 'database',
        message: 'Database connection failed',
        error: results.database.error
      });
    }
    
    return alerts;
  }

  generateHealthRecommendations(results: any) {
    const recommendations = [];
    
    if (results.backend.responseTime > 2000) {
      recommendations.push({
        priority: 'medium',
        component: 'backend',
        issue: 'Slow API response time',
        action: 'Investigate database query performance and API endpoint optimization'
      });
    }
    
    if (results.database.slowQueries > 10) {
      recommendations.push({
        priority: 'high',
        component: 'database',
        issue: 'Multiple slow queries detected',
        action: 'Review slow query log and add appropriate indexes'
      });
    }
    
    return recommendations;
  }

  // Continuous monitoring
  async startContinuousMonitoring(intervalMs = 60000) {
    console.log(`🔄 [Health Monitor] Starting continuous monitoring every ${intervalMs}ms`);
    
    const monitor = async () => {
      try {
        const report = await this.performHealthCheck();
        
        // Log critical alerts
        if (report.alerts.some((alert: any) => alert.severity === 'critical')) {
          console.error('🚨 [Health Monitor] Critical alerts detected:', report.alerts);
        }
        
        // Log warnings
        const warnings = report.alerts.filter((alert: any) => alert.severity === 'warning');
        if (warnings.length > 0) {
          console.warn('⚠️ [Health Monitor] Warnings:', warnings);
        }
        
      } catch (error: any) {
        console.error('❌ [Health Monitor] Monitoring error:', error.message);
      }
    };
    
    // Initial check
    await monitor();
    
    // Set up interval
    const interval = setInterval(monitor, intervalMs);
    
    return {
      stop: () => {
        clearInterval(interval);
        console.log('🛑 [Health Monitor] Continuous monitoring stopped');
      }
    };
  }
}
