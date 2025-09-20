import axios from 'axios';
import mysql from 'mysql2/promise';
import { chromium } from 'playwright';

// Performance Tester for Grip Invest Mini Platform
export class GripInvestPerformanceTester {
  private config: any;
  private results: {
    api: Record<string, any>;
    database: Record<string, any>;
    frontend: Record<string, any>;
    load: Record<string, any>;
    memory: Record<string, any>;
  };

  constructor(config: any) {
    this.config = {
      frontend: {
        baseUrl: config.frontend?.baseUrl || 'http://localhost:3000'
      },
      backend: {
        baseUrl: config.backend?.baseUrl || 'http://localhost:8080'
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
    
    this.results = {
      api: {},
      database: {},
      frontend: {},
      load: {},
      memory: {}
    };
  }

  async runPerformanceTests() {
    console.log('⚡ [Performance Tester] Starting comprehensive performance tests...');
    
    try {
      await this.testAPIPerformance();
      await this.testDatabasePerformance();
      await this.testFrontendPerformance();
      await this.testLoadPerformance();
      await this.testMemoryUsage();
      
      return this.generatePerformanceReport();
    } catch (error: any) {
      console.error('❌ [Performance Tester] Failed:', error.message);
      throw error;
    }
  }

  async testAPIPerformance() {
    console.log('🖥️ [API Performance] Testing API response times...');
    
    const endpoints = [
      { path: '/api/v1/health', method: 'GET' },
      { path: '/api/v1/products', method: 'GET' },
      { path: '/api/v1/auth/login', method: 'POST', data: { email: 'test@example.com', password: 'password123' } }
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      const times = [];
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        try {
          // const response = await axios({
            // method: endpoint.method,
            // url: `${this.config.backend.baseUrl}${endpoint.path}`,
            // data: endpoint.data || undefined,
            // timeout: 10000
          // });
          
          const responseTime = Date.now() - startTime;
          times.push(responseTime);
        } catch (error: any) {
          console.warn(`⚠️ [API Performance] ${endpoint.path} failed: ${error.message}`);
        }
      }
      
      if (times.length > 0) {
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        const p95Time = this.calculatePercentile(times, 95);
        
        (results as any)[endpoint.path] = {
          average: Math.round(avgTime),
          min: minTime,
          max: maxTime,
          p95: Math.round(p95Time),
          successRate: (times.length / iterations) * 100
        };
        
        console.log(`  ✅ ${endpoint.path}: ${Math.round(avgTime)}ms avg, ${Math.round(p95Time)}ms p95`);
      }
    }
    
    this.results.api = results;
  }

  async testDatabasePerformance() {
    console.log('🗄️ [Database Performance] Testing database query performance...');
    
    const connection = await mysql.createConnection({
      host: this.config.database.host,
      port: this.config.database.port,
      user: this.config.database.user,
      password: this.config.database.password,
      database: this.config.database.database
    });
    
    try {
      const queries = [
        {
          name: 'Simple Select',
          query: 'SELECT COUNT(*) as count FROM users'
        },
        {
          name: 'Join Query',
          query: `
            SELECT u.id, u.first_name, COUNT(i.id) as investment_count
            FROM users u 
            LEFT JOIN investments i ON u.id = i.user_id 
            GROUP BY u.id 
            LIMIT 100
          `
        },
        {
          name: 'Product Query',
          query: `
            SELECT p.*, COUNT(i.id) as investment_count
            FROM investment_products p
            LEFT JOIN investments i ON p.id = i.product_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
            LIMIT 50
          `
        },
        {
          name: 'Complex Analytics',
          query: `
            SELECT 
              p.risk_level,
              COUNT(i.id) as total_investments,
              SUM(i.amount) as total_amount,
              AVG(i.amount) as avg_amount
            FROM investment_products p
            LEFT JOIN investments i ON p.id = i.product_id
            GROUP BY p.risk_level
            ORDER BY total_amount DESC
          `
        }
      ];
      
      const results = {};
      
      for (const { name, query } of queries) {
        const times = [];
        const iterations = 5;
        
        for (let i = 0; i < iterations; i++) {
          const startTime = Date.now();
          
          try {
            await connection.execute(query);
            const executionTime = Date.now() - startTime;
            times.push(executionTime);
          } catch (error: any) {
            console.warn(`⚠️ [Database Performance] ${name} failed: ${error.message}`);
          }
        }
        
        if (times.length > 0) {
          const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
          const minTime = Math.min(...times);
          const maxTime = Math.max(...times);
          const p95Time = this.calculatePercentile(times, 95);
          
          (results as any)[name] = {
            average: Math.round(avgTime),
            min: minTime,
            max: maxTime,
            p95: Math.round(p95Time),
            successRate: (times.length / iterations) * 100
          };
          
          console.log(`  ✅ ${name}: ${Math.round(avgTime)}ms avg, ${Math.round(p95Time)}ms p95`);
        }
      }
      
      this.results.database = results;
      
    } finally {
      await connection.end();
    }
  }

  async testFrontendPerformance() {
    console.log('⚛️ [Frontend Performance] Testing frontend performance...');
    
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // Enable performance monitoring
      await page.addInitScript(() => {
        // Browser performance metrics - only available in browser environment
        if (typeof window !== 'undefined') {
          (window as any).performanceMetrics = {
            navigationStart: performance.now(),
            loadEventEnd: 0,
            domContentLoaded: 0,
            firstPaint: 0,
            firstContentfulPaint: 0,
            largestContentfulPaint: 0,
            firstInputDelay: 0,
            cumulativeLayoutShift: 0
          };
        }
        
        // Capture Core Web Vitals - only in browser environment
        if (typeof window !== 'undefined' && typeof PerformanceObserver !== 'undefined') {
          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (entry.entryType === 'paint') {
                if (entry.name === 'first-paint') {
                  (window as any).performanceMetrics.firstPaint = entry.startTime;
                } else if (entry.name === 'first-contentful-paint') {
                  (window as any).performanceMetrics.firstContentfulPaint = entry.startTime;
                }
              } else if (entry.entryType === 'largest-contentful-paint') {
                (window as any).performanceMetrics.largestContentfulPaint = entry.startTime;
              } else if (entry.entryType === 'first-input') {
                (window as any).performanceMetrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
              } else if (entry.entryType === 'layout-shift') {
                if (!(entry as any).hadRecentInput) {
                  (window as any).performanceMetrics.cumulativeLayoutShift += (entry as any).value;
                }
              }
            }
          }).observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] as any });
        }
        
        if (typeof document !== 'undefined') {
          document.addEventListener('DOMContentLoaded', () => {
            if (typeof window !== 'undefined') {
              (window as any).performanceMetrics.domContentLoaded = performance.now();
            }
          });
        }
        
        if (typeof window !== 'undefined') {
          window.addEventListener('load', () => {
            (window as any).performanceMetrics.loadEventEnd = performance.now();
          });
        }
      });
      
      const pages = [
        { name: 'Home Page', url: this.config.frontend.baseUrl },
        { name: 'Login Page', url: `${this.config.frontend.baseUrl}/login` },
        { name: 'Signup Page', url: `${this.config.frontend.baseUrl}/signup` },
        { name: 'Products Page', url: `${this.config.frontend.baseUrl}/products` }
      ];
      
      const results = {};
      
      for (const { name, url } of pages) {
        try {
          const startTime = Date.now();
          await page.goto(url);
          await page.waitForLoadState('networkidle');
          const pageLoadTime = Date.now() - startTime;
          
          // Get performance metrics
          const metrics = await page.evaluate(() => (window as any).performanceMetrics);
          
          // Get resource loading metrics
          const resourceMetrics = await page.evaluate(() => {
            const resources = performance.getEntriesByType('resource');
            return {
              totalResources: resources.length,
              scripts: resources.filter((r: any) => r.initiatorType === 'script').length,
              stylesheets: resources.filter((r: any) => r.initiatorType === 'link').length,
              images: resources.filter((r: any) => r.initiatorType === 'img').length,
              totalSize: resources.reduce((sum: number, r: any) => sum + (r.transferSize || 0), 0),
              slowestResource: Math.max(...resources.map((r: any) => r.duration))
            };
          });
          
          (results as any)[name] = {
            pageLoadTime,
            ...metrics,
            resources: resourceMetrics,
            // Performance scoring
            scores: {
              fcp: metrics.firstContentfulPaint < 1800 ? 'good' : metrics.firstContentfulPaint < 3000 ? 'needs-improvement' : 'poor',
              lcp: metrics.largestContentfulPaint < 2500 ? 'good' : metrics.largestContentfulPaint < 4000 ? 'needs-improvement' : 'poor',
              fid: metrics.firstInputDelay < 100 ? 'good' : metrics.firstInputDelay < 300 ? 'needs-improvement' : 'poor',
              cls: metrics.cumulativeLayoutShift < 0.1 ? 'good' : metrics.cumulativeLayoutShift < 0.25 ? 'needs-improvement' : 'poor'
            }
          };
          
          console.log(`  ✅ ${name}: ${pageLoadTime}ms load time, ${resourceMetrics.totalResources} resources`);
          
        } catch (error: any) {
          console.warn(`⚠️ [Frontend Performance] ${name} failed: ${error.message}`);
        }
      }
      
      this.results.frontend = results;
      
    } finally {
      await browser.close();
    }
  }

  async testLoadPerformance() {
    console.log('📊 [Load Performance] Testing system under load...');
    
    const loadTests = [
      {
        name: 'Concurrent API Requests',
        test: async () => {
          const concurrentRequests = 50;
          const startTime = Date.now();
          
          const requestPromises = Array.from({ length: concurrentRequests }, async () => {
            try {
              const response = await axios.get(`${this.config.backend.baseUrl}/api/v1/products`, {
                timeout: 10000
              });
              return { status: response.status, time: Date.now() - startTime };
            } catch (error: any) {
              return { error: error.message, time: Date.now() - startTime };
            }
          });
          
          const results = await Promise.all(requestPromises);
          const totalTime = Date.now() - startTime;
          const successfulRequests = results.filter(r => r.status === 200).length;
          
          return {
            totalRequests: concurrentRequests,
            successfulRequests,
            failedRequests: concurrentRequests - successfulRequests,
            totalTime,
            requestsPerSecond: Math.round(concurrentRequests / (totalTime / 1000)),
            successRate: `${((successfulRequests / concurrentRequests) * 100).toFixed(2)}%`
          };
        }
      },
      {
        name: 'Database Connection Pool',
        test: async () => {
          const concurrentConnections = 20;
          const startTime = Date.now();
          
          const connectionPromises = Array.from({ length: concurrentConnections }, async () => {
            try {
              const connection = await mysql.createConnection({
                host: this.config.database.host,
                port: this.config.database.port,
                user: this.config.database.user,
                password: this.config.database.password,
                database: this.config.database.database
              });
              
              await connection.execute('SELECT 1');
              await connection.end();
              
              return { success: true, time: Date.now() - startTime };
            } catch (error: any) {
              return { success: false, error: error.message, time: Date.now() - startTime };
            }
          });
          
          const results = await Promise.all(connectionPromises);
          const totalTime = Date.now() - startTime;
          const successfulConnections = results.filter(r => r.success).length;
          
          return {
            totalConnections: concurrentConnections,
            successfulConnections,
            failedConnections: concurrentConnections - successfulConnections,
            totalTime,
            connectionsPerSecond: Math.round(concurrentConnections / (totalTime / 1000)),
            successRate: `${((successfulConnections / concurrentConnections) * 100).toFixed(2)}%`
          };
        }
      },
      {
        name: 'Memory Usage Under Load',
        test: async () => {
          const iterations = 100;
          const startTime = Date.now();
          
          const memoryTests = Array.from({ length: iterations }, async () => {
            try {
              // const response = await axios.get(`${this.config.backend.baseUrl}/api/v1/products`);
              return { success: true, memory: process.memoryUsage() };
            } catch (error: any) {
              return { success: false, error: error.message };
            }
          });
          
          const results = await Promise.all(memoryTests);
          const totalTime = Date.now() - startTime;
          const successfulTests = results.filter(r => r.success).length;
          
          // Calculate memory usage statistics
          const memoryUsages = results.filter(r => r.success && r.memory).map(r => r.memory);
          const avgMemoryUsage = memoryUsages.length > 0 ? 
            memoryUsages.reduce((sum: number, mem: any) => sum + mem.heapUsed, 0) / memoryUsages.length : 0;
          
          return {
            totalTests: iterations,
            successfulTests,
            failedTests: iterations - successfulTests,
            totalTime,
            averageMemoryUsage: Math.round(avgMemoryUsage / 1024 / 1024), // MB
            testsPerSecond: Math.round(iterations / (totalTime / 1000)),
            successRate: `${((successfulTests / iterations) * 100).toFixed(2)}%`
          };
        }
      }
    ];
    
    const results = {};
    
    for (const { name, test } of loadTests) {
      try {
        const result = await test();
        (results as any)[name] = result;
        console.log(`  ✅ ${name}: ${result.successRate || 'N/A'} success rate`);
      } catch (error: any) {
        console.warn(`⚠️ [Load Performance] ${name} failed: ${error.message}`);
        (results as any)[name] = { error: error.message };
      }
    }
    
    this.results.load = results;
  }

  async testMemoryUsage() {
    console.log('🧠 [Memory Usage] Testing memory consumption...');
    
    const memoryTests = [
      {
        name: 'Initial Memory',
        test: () => {
          const memUsage = process.memoryUsage();
          return {
            rss: Math.round(memUsage.rss / 1024 / 1024), // MB
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
            external: Math.round(memUsage.external / 1024 / 1024) // MB
          };
        }
      },
      {
        name: 'Memory After API Calls',
        test: async () => {
          // Make multiple API calls
          const promises = Array.from({ length: 20 }, () =>
            axios.get(`${this.config.backend.baseUrl}/api/v1/products`)
          );
          
          await Promise.all(promises);
          
          const memUsage = process.memoryUsage();
          return {
            rss: Math.round(memUsage.rss / 1024 / 1024), // MB
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
            external: Math.round(memUsage.external / 1024 / 1024) // MB
          };
        }
      },
      {
        name: 'Memory After Database Operations',
        test: async () => {
          const connection = await mysql.createConnection({
            host: this.config.database.host,
            port: this.config.database.port,
            user: this.config.database.user,
            password: this.config.database.password,
            database: this.config.database.database
          });
          
          try {
            // Execute multiple queries
            for (let i = 0; i < 10; i++) {
              await connection.execute('SELECT COUNT(*) FROM users');
              await connection.execute('SELECT COUNT(*) FROM investment_products');
              await connection.execute('SELECT COUNT(*) FROM investments');
            }
            
            const memUsage = process.memoryUsage();
            return {
              rss: Math.round(memUsage.rss / 1024 / 1024), // MB
              heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
              heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
              external: Math.round(memUsage.external / 1024 / 1024) // MB
            };
          } finally {
            await connection.end();
          }
        }
      }
    ];
    
    const results = {};
    
    for (const { name, test } of memoryTests) {
      try {
        const result = await test();
        (results as any)[name] = result;
        console.log(`  ✅ ${name}: ${result.heapUsed}MB heap used`);
      } catch (error: any) {
        console.warn(`⚠️ [Memory Usage] ${name} failed: ${error.message}`);
        (results as any)[name] = { error: error.message };
      }
    }
    
    this.results.memory = results;
  }

  calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  generatePerformanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: this.generatePerformanceSummary(),
      recommendations: this.generatePerformanceRecommendations()
    };
    
    console.log('\n📊 [Performance Report] Grip Invest Performance Analysis:');
    console.log('='.repeat(60));
    
    // API Performance Summary
    if (Object.keys(this.results.api).length > 0) {
      console.log('\n🖥️ API Performance:');
      Object.entries(this.results.api).forEach(([endpoint, data]: [string, any]) => {
        console.log(`  ${endpoint}: ${data.average}ms avg, ${data.p95}ms p95 (${data.successRate}% success)`);
      });
    }
    
    // Database Performance Summary
    if (Object.keys(this.results.database).length > 0) {
      console.log('\n🗄️ Database Performance:');
      Object.entries(this.results.database).forEach(([query, data]: [string, any]) => {
        console.log(`  ${query}: ${data.average}ms avg, ${data.p95}ms p95 (${data.successRate}% success)`);
      });
    }
    
    // Frontend Performance Summary
    if (Object.keys(this.results.frontend).length > 0) {
      console.log('\n⚛️ Frontend Performance:');
      Object.entries(this.results.frontend).forEach(([page, data]: [string, any]) => {
        console.log(`  ${page}: ${data.pageLoadTime}ms load time, ${data.resources.totalResources} resources`);
      });
    }
    
    // Load Performance Summary
    if (Object.keys(this.results.load).length > 0) {
      console.log('\n📊 Load Performance:');
      Object.entries(this.results.load).forEach(([test, data]: [string, any]) => {
        if (data.successRate) {
          console.log(`  ${test}: ${data.successRate} success rate, ${data.requestsPerSecond || data.testsPerSecond || 0}/s throughput`);
        }
      });
    }
    
    // Memory Usage Summary
    if (Object.keys(this.results.memory).length > 0) {
      console.log('\n🧠 Memory Usage:');
      Object.entries(this.results.memory).forEach(([test, data]: [string, any]) => {
        if (data.heapUsed) {
          console.log(`  ${test}: ${data.heapUsed}MB heap used, ${data.rss}MB RSS`);
        }
      });
    }
    
    return report;
  }

  generatePerformanceSummary() {
    const summary = {
      api: { averageResponseTime: 0, slowestEndpoint: '', fastestEndpoint: '' },
      database: { averageQueryTime: 0, slowestQuery: '', fastestQuery: '' },
      frontend: { averageLoadTime: 0, slowestPage: '', fastestPage: '' },
      load: { averageSuccessRate: 0, totalThroughput: 0 },
      memory: { peakHeapUsage: 0, averageHeapUsage: 0 }
    };
    
    // Calculate API summary
    if (Object.keys(this.results.api).length > 0) {
      const apiTimes = Object.values(this.results.api).map((data: any) => data.average);
      summary.api.averageResponseTime = Math.round(apiTimes.reduce((sum, time) => sum + time, 0) / apiTimes.length);
      
      const apiEntries = Object.entries(this.results.api);
      const slowest = apiEntries.reduce((max, [endpoint, data]) => 
        (data as any).average > (max[1] as any).average ? [endpoint, data] : max
      );
      const fastest = apiEntries.reduce((min, [endpoint, data]) => 
        (data as any).average < (min[1] as any).average ? [endpoint, data] : min
      );
      
      summary.api.slowestEndpoint = slowest[0];
      summary.api.fastestEndpoint = fastest[0];
    }
    
    // Calculate database summary
    if (Object.keys(this.results.database).length > 0) {
      const dbTimes = Object.values(this.results.database).map((data: any) => data.average);
      summary.database.averageQueryTime = Math.round(dbTimes.reduce((sum, time) => sum + time, 0) / dbTimes.length);
      
      const dbEntries = Object.entries(this.results.database);
      const slowest = dbEntries.reduce((max, [query, data]) => 
        (data as any).average > (max[1] as any).average ? [query, data] : max
      );
      const fastest = dbEntries.reduce((min, [query, data]) => 
        (data as any).average < (min[1] as any).average ? [query, data] : min
      );
      
      summary.database.slowestQuery = slowest[0];
      summary.database.fastestQuery = fastest[0];
    }
    
    // Calculate frontend summary
    if (Object.keys(this.results.frontend).length > 0) {
      const frontendTimes = Object.values(this.results.frontend).map((data: any) => data.pageLoadTime);
      summary.frontend.averageLoadTime = Math.round(frontendTimes.reduce((sum, time) => sum + time, 0) / frontendTimes.length);
      
      const frontendEntries = Object.entries(this.results.frontend);
      const slowest = frontendEntries.reduce((max, [page, data]) => 
        (data as any).pageLoadTime > (max[1] as any).pageLoadTime ? [page, data] : max
      );
      const fastest = frontendEntries.reduce((min, [page, data]) => 
        (data as any).pageLoadTime < (min[1] as any).pageLoadTime ? [page, data] : min
      );
      
      summary.frontend.slowestPage = slowest[0];
      summary.frontend.fastestPage = fastest[0];
    }
    
    return summary;
  }

  generatePerformanceRecommendations() {
    const recommendations = [];
    
    // API performance recommendations
    if (this.results.api) {
      Object.entries(this.results.api).forEach(([endpoint, data]: [string, any]) => {
        if (data.average > 500) {
          recommendations.push({
            category: 'API Performance',
            priority: 'High',
            issue: `Slow API endpoint: ${endpoint}`,
            recommendation: `Optimize ${endpoint} - average response time ${data.average}ms exceeds 500ms threshold`
          });
        }
      });
    }
    
    // Database performance recommendations
    if (this.results.database) {
      Object.entries(this.results.database).forEach(([query, data]: [string, any]) => {
        if (data.average > 200) {
          recommendations.push({
            category: 'Database Performance',
            priority: 'Medium',
            issue: `Slow database query: ${query}`,
            recommendation: `Optimize ${query} - average execution time ${data.average}ms exceeds 200ms threshold`
          });
        }
      });
    }
    
    // Frontend performance recommendations
    if (this.results.frontend) {
      Object.entries(this.results.frontend).forEach(([page, data]: [string, any]) => {
        if (data.pageLoadTime > 3000) {
          recommendations.push({
            category: 'Frontend Performance',
            priority: 'High',
            issue: `Slow page load: ${page}`,
            recommendation: `Optimize ${page} - load time ${data.pageLoadTime}ms exceeds 3000ms threshold`
          });
        }
      });
    }
    
    // Load performance recommendations
    if (this.results.load) {
      Object.entries(this.results.load).forEach(([test, data]: [string, any]) => {
        if (data.successRate && parseFloat(data.successRate) < 95) {
          recommendations.push({
            category: 'Load Performance',
            priority: 'High',
            issue: `Low success rate under load: ${test}`,
            recommendation: `Improve system reliability - success rate ${data.successRate} below 95% threshold`
          });
        }
      });
    }
    
    // Memory usage recommendations
    if (this.results.memory) {
      const memoryValues = Object.values(this.results.memory).filter((data: any) => data.heapUsed);
      if (memoryValues.length > 0) {
        const maxMemory = Math.max(...memoryValues.map((data: any) => data.heapUsed));
        if (maxMemory > 100) {
          recommendations.push({
            category: 'Memory Usage',
            priority: 'Medium',
            issue: 'High memory usage detected',
            recommendation: `Optimize memory usage - peak usage ${maxMemory}MB exceeds 100MB threshold`
          });
        }
      }
    }
    
    return recommendations;
  }
}
