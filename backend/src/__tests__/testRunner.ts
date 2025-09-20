#!/usr/bin/env node

import { GripInvestTestSuite } from './fullStackTestSuite';
import { GripInvestHealthMonitor } from './healthMonitor';
import { GripInvestDataFlowTracer } from './dataFlowTracer';

// Test Runner for Grip Invest Mini Platform
class GripInvestTestRunner {
  private config: any;
  private testSuite: GripInvestTestSuite;
  private healthMonitor: GripInvestHealthMonitor;
  private dataFlowTracer: GripInvestDataFlowTracer;

  constructor() {
    this.config = {
      frontend: {
        baseUrl: process.env['FRONTEND_URL'] || 'http://localhost:3000'
      },
      backend: {
        baseUrl: process.env['BACKEND_URL'] || 'http://localhost:8080'
      },
      database: {
        host: process.env['DB_HOST'] || 'localhost',
        port: parseInt(process.env['DB_PORT'] || '3307'),
        user: process.env['DB_USER'] || 'root',
        password: process.env['DB_PASSWORD'] || 'password',
        database: process.env['DB_NAME'] || 'grip_invest'
      }
    };

    this.testSuite = new GripInvestTestSuite(this.config);
    this.healthMonitor = new GripInvestHealthMonitor(this.config);
    this.dataFlowTracer = new GripInvestDataFlowTracer(this.config);
  }

  async runAllTests() {
    console.log('🚀 [Grip Invest Test Runner] Starting comprehensive test suite...');
    console.log('='.repeat(60));
    
    try {
      // Initialize test environment
      await this.testSuite.initialize();
      
      // Run health check first
      console.log('\n💊 [Health Check] Performing system health check...');
      const healthReport = await this.healthMonitor.performHealthCheck();
      console.log(`Overall Health: ${healthReport.overall}`);
      
      if (healthReport.alerts.length > 0) {
        console.log('⚠️ Alerts:', healthReport.alerts);
      }
      
      // Run full test suite
      console.log('\n🧪 [Test Suite] Running full-stack tests...');
      const testReport = await this.testSuite.runFullStackTests();
      
      // Run data flow traces
      console.log('\n🔍 [Data Flow] Running data flow traces...');
      await this.runDataFlowTraces();
      
      // Generate final report
      this.generateFinalReport(healthReport, testReport);
      
    } catch (error: any) {
      console.error('❌ [Test Runner] Failed to run tests:', error.message);
      process.exit(1);
    } finally {
      // Cleanup
      await this.testSuite.cleanup();
    }
  }

  async runDataFlowTraces() {
    const traces = [
      {
        action: 'user-registration',
        payload: {
          first_name: 'Test',
          last_name: 'User',
          email: `test_${Date.now()}@example.com`,
          password: 'TestPassword123!',
          risk_appetite: 'moderate'
        }
      },
      {
        action: 'user-login',
        payload: {
          email: 'test@example.com',
          password: 'password123'
        }
      },
      {
        action: 'browse-products',
        payload: {
          filters: { risk_level: 'low' }
        }
      }
    ];

    for (const trace of traces) {
      try {
        const result = await this.dataFlowTracer.traceUserAction(trace.action, trace.payload);
        console.log(`✅ [Data Flow] ${trace.action}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        
        if (!result.success) {
          console.log(`   Errors: ${result.errors.length}`);
        }
      } catch (error: any) {
        console.error(`❌ [Data Flow] ${trace.action} failed:`, error.message);
      }
    }
  }

  generateFinalReport(healthReport: any, testReport: any) {
    console.log('\n📊 [Final Report] Grip Invest Mini Platform Test Results');
    console.log('='.repeat(60));
    
    // Health Summary
    console.log('\n💊 System Health:');
    console.log(`  Overall: ${healthReport.overall}`);
    console.log(`  Frontend: ${healthReport.components.frontend.status}`);
    console.log(`  Backend: ${healthReport.components.backend.status}`);
    console.log(`  Database: ${healthReport.components.database.status}`);
    
    // Test Summary
    console.log('\n🧪 Test Results:');
    console.log(`  Total Tests: ${testReport.summary.totalTests}`);
    console.log(`  Passed: ${testReport.summary.passed}`);
    console.log(`  Failed: ${testReport.summary.failed}`);
    console.log(`  Success Rate: ${testReport.summary.successRate}`);
    
    // Performance Summary
    if (Object.keys(testReport.performance).length > 0) {
      console.log('\n⚡ Performance:');
      Object.entries(testReport.performance).forEach(([key, value]) => {
        if (typeof value === 'object') {
          console.log(`  ${key}:`, JSON.stringify(value, null, 2));
        } else {
          console.log(`  ${key}: ${value}ms`);
        }
      });
    }
    
    // Recommendations
    if (testReport.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      testReport.recommendations.forEach((rec: any, index: number) => {
        console.log(`  ${index + 1}. [${rec.priority}] ${rec.issue}: ${rec.recommendation}`);
      });
    }
    
    // Critical Issues
    const criticalErrors = testReport.errors.filter((error: any) => 
      error.suite === 'Database' || error.suite === 'Backend'
    );
    
    if (criticalErrors.length > 0) {
      console.log('\n🚨 Critical Issues:');
      criticalErrors.forEach((error: any, index: number) => {
        console.log(`  ${index + 1}. [${error.suite}] ${error.test}: ${error.error}`);
      });
    }
    
    // Final Status
    const overallSuccess = testReport.summary.failed === 0 && healthReport.overall !== 'unhealthy';
    console.log(`\n${overallSuccess ? '✅' : '❌'} Overall Status: ${overallSuccess ? 'PASSED' : 'FAILED'}`);
    
    if (!overallSuccess) {
      process.exit(1);
    }
  }

  async runSpecificTest(testType: string) {
    console.log(`🎯 [Test Runner] Running specific test: ${testType}`);
    
    try {
      await this.testSuite.initialize();
      
      switch (testType) {
        case 'health':
          const healthReport = await this.healthMonitor.performHealthCheck();
          console.log('Health Report:', JSON.stringify(healthReport, null, 2));
          break;
          
        case 'database':
          await this.testSuite.runDatabaseTests();
          break;
          
        case 'backend':
          await this.testSuite.runBackendTests();
          break;
          
        case 'frontend':
          await this.testSuite.runFrontendTests();
          break;
          
        case 'integration':
          await this.testSuite.runIntegrationTests();
          break;
          
        case 'e2e':
          await this.testSuite.runE2ETests();
          break;
          
        case 'performance':
          await this.testSuite.runPerformanceTests();
          break;
          
        case 'security':
          await this.testSuite.runSecurityTests();
          break;
          
        default:
          console.error(`Unknown test type: ${testType}`);
          process.exit(1);
      }
      
    } catch (error: any) {
      console.error(`❌ [Test Runner] ${testType} test failed:`, error.message);
      process.exit(1);
    } finally {
      await this.testSuite.cleanup();
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const testRunner = new GripInvestTestRunner();
  
  if (args.length === 0) {
    // Run all tests
    await testRunner.runAllTests();
  } else if (args[0] === '--help') {
    console.log(`
Grip Invest Mini Platform Test Runner

Usage:
  npm run test:full-stack              # Run all tests
  npm run test:health                  # Run health check only
  npm run test:database                # Run database tests only
  npm run test:backend                 # Run backend tests only
  npm run test:frontend                # Run frontend tests only
  npm run test:integration             # Run integration tests only
  npm run test:e2e                     # Run E2E tests only
  npm run test:performance             # Run performance tests only
  npm run test:security                # Run security tests only

Environment Variables:
  FRONTEND_URL     # Frontend URL (default: http://localhost:3000)
  BACKEND_URL      # Backend URL (default: http://localhost:8080)
  DB_HOST          # Database host (default: localhost)
  DB_PORT          # Database port (default: 3307)
  DB_USER          # Database user (default: root)
  DB_PASSWORD      # Database password (default: password)
  DB_NAME          # Database name (default: grip_invest)
    `);
  } else {
    // Run specific test
    await testRunner.runSpecificTest(args[0] || 'all');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { GripInvestTestRunner };
