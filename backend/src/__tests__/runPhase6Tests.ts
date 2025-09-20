#!/usr/bin/env node

import { GripInvestTestSuite } from './fullStackTestSuite';
import { GripInvestHealthMonitor } from './healthMonitor';
import { GripInvestDataFlowTracer } from './dataFlowTracer';
import { Phase6TestScenarios } from './phase6TestScenarios';
import { GripInvestPerformanceTester } from './performanceTester';
import { GripInvestSecurityTester } from './securityTester';

// Phase 6 Test Execution Script for Grip Invest Mini Platform
class Phase6TestExecutor {
  private config: any;
  private testSuite: GripInvestTestSuite;
  private healthMonitor: GripInvestHealthMonitor;
  private dataFlowTracer: GripInvestDataFlowTracer;
  private phase6Scenarios: Phase6TestScenarios;
  private performanceTester: GripInvestPerformanceTester;
  private securityTester: GripInvestSecurityTester;

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
    this.phase6Scenarios = new Phase6TestScenarios(this.config);
    this.performanceTester = new GripInvestPerformanceTester(this.config);
    this.securityTester = new GripInvestSecurityTester(this.config);
  }

  async runPhase6Tests() {
    console.log('🚀 [Phase 6 Test Executor] Starting Grip Invest Mini Platform Phase 6 Testing');
    console.log('='.repeat(80));
    console.log('📋 Testing Scope: End-to-End, Integration, Performance, Security, User Acceptance');
    console.log('🎯 Target: All P0 Critical Tests Must Pass');
    console.log('='.repeat(80));
    
    const startTime = Date.now();
    const results: {
      healthCheck: any;
      p0Critical: any;
      p1Important: any;
      performance: any;
      security: any;
      userJourneys: any;
      dataFlow: any;
      overall: any;
    } = {
      healthCheck: null,
      p0Critical: null,
      p1Important: null,
      performance: null,
      security: null,
      userJourneys: null,
      dataFlow: null,
      overall: null
    };
    
    try {
      // Step 1: System Health Check
      console.log('\n💊 [Step 1/8] Performing System Health Check...');
      results.healthCheck = await this.healthMonitor.performHealthCheck();
      this.logHealthStatus(results.healthCheck);
      
      if (results.healthCheck.overall === 'unhealthy') {
        console.error('❌ [Critical] System health check failed. Aborting tests.');
        return { success: false, error: 'System health check failed', results };
      }
      
      // Step 2: Initialize Test Environment
      console.log('\n🔧 [Step 2/8] Initializing Test Environment...');
      await this.testSuite.initialize();
      console.log('✅ Test environment initialized successfully');
      
      // Step 3: P0 Critical Tests
      console.log('\n🎯 [Step 3/8] Running P0 Critical Tests (Must Pass)...');
      results.p0Critical = await this.phase6Scenarios.runP0CriticalTests();
      this.logTestResults('P0 Critical', results.p0Critical);
      
      if (!results.p0Critical.allPassed) {
        console.error('❌ [Critical] P0 Critical tests failed. Some tests must pass for Phase 6 completion.');
      }
      
      // Step 4: P1 Important Tests
      console.log('\n📊 [Step 4/8] Running P1 Important Tests (Should Pass)...');
      results.p1Important = await this.phase6Scenarios.runP1ImportantTests();
      this.logTestResults('P1 Important', results.p1Important);
      
      // Step 5: Performance Testing
      console.log('\n⚡ [Step 5/8] Running Performance Tests...');
      results.performance = await this.performanceTester.runPerformanceTests();
      this.logPerformanceResults(results.performance);
      
      // Step 6: Security Testing
      console.log('\n🔒 [Step 6/8] Running Security Tests...');
      results.security = await this.securityTester.runSecurityTests();
      this.logSecurityResults(results.security);
      
      // Step 7: User Journey Testing
      console.log('\n🎭 [Step 7/8] Running User Journey Tests...');
      results.userJourneys = await this.phase6Scenarios.runUserJourneyScenarios();
      this.logUserJourneyResults(results.userJourneys);
      
      // Step 8: Data Flow Tracing
      console.log('\n🔍 [Step 8/8] Running Data Flow Traces...');
      results.dataFlow = await this.runDataFlowTraces();
      this.logDataFlowResults(results.dataFlow);
      
      // Generate Overall Results
      results.overall = this.generateOverallResults(results);
      
      // Generate Final Report
      this.generateFinalReport(results, Date.now() - startTime);
      
      return { success: results.overall.success, results };
      
    } catch (error: any) {
      console.error('❌ [Phase 6 Test Executor] Critical error:', error.message);
      return { success: false, error: error.message, results };
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
          first_name: 'Phase6',
          last_name: 'Test',
          email: `phase6_${Date.now()}@example.com`,
          password: 'Phase6Test123!',
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
      },
      {
        action: 'create-investment',
        payload: {
          product_id: 'test-product-id',
          amount: 10000,
          token: 'test-token'
        }
      }
    ];

    const results = [];
    
    for (const trace of traces) {
      try {
        const result = await this.dataFlowTracer.traceUserAction(trace.action, trace.payload);
        results.push({
          action: trace.action,
          success: result.success,
          performance: result.performance,
          errors: result.errors.length,
          recommendations: result.recommendations.length
        });
      } catch (error: any) {
        results.push({
          action: trace.action,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      success: results.every(r => r.success),
      results
    };
  }

  generateOverallResults(results: any) {
    const criticalTestsPassed = results.p0Critical?.allPassed || false;
    const importantTestsPassed = results.p1Important?.allPassed || false;
    const userJourneysPassed = results.userJourneys?.success || false;
    const dataFlowPassed = results.dataFlow?.success || false;
    const healthHealthy = results.healthCheck?.overall === 'healthy';
    
    const overallSuccess = criticalTestsPassed && healthHealthy;
    const overallScore = this.calculateOverallScore(results);
    
    return {
      success: overallSuccess,
      score: overallScore,
      criticalTestsPassed,
      importantTestsPassed,
      userJourneysPassed,
      dataFlowPassed,
      healthHealthy,
      summary: {
        totalTests: this.countTotalTests(results),
        passedTests: this.countPassedTests(results),
        failedTests: this.countFailedTests(results),
        performanceScore: this.calculatePerformanceScore(results.performance),
        securityScore: this.calculateSecurityScore(results.security)
      }
    };
  }

  calculateOverallScore(results: any) {
    let score = 0;
    let maxScore = 0;
    
    // P0 Critical Tests (40% weight)
    if (results.p0Critical) {
      maxScore += 40;
      if (results.p0Critical.allPassed) score += 40;
    }
    
    // P1 Important Tests (20% weight)
    if (results.p1Important) {
      maxScore += 20;
      if (results.p1Important.allPassed) score += 20;
    }
    
    // User Journeys (15% weight)
    if (results.userJourneys) {
      maxScore += 15;
      if (results.userJourneys.success) score += 15;
    }
    
    // Data Flow (10% weight)
    if (results.dataFlow) {
      maxScore += 10;
      if (results.dataFlow.success) score += 10;
    }
    
    // Health Check (10% weight)
    if (results.healthCheck) {
      maxScore += 10;
      if (results.healthCheck.overall === 'healthy') score += 10;
    }
    
    // Performance (3% weight)
    if (results.performance) {
      maxScore += 3;
      const perfScore = this.calculatePerformanceScore(results.performance);
      score += (perfScore / 100) * 3;
    }
    
    // Security (2% weight)
    if (results.security) {
      maxScore += 2;
      const secScore = this.calculateSecurityScore(results.security);
      score += (secScore / 100) * 2;
    }
    
    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  }

  calculatePerformanceScore(performance: any) {
    if (!performance || !performance.summary) return 0;
    
    let score = 100;
    
    // Deduct points for slow API responses
    if (performance.summary.api?.averageResponseTime > 500) {
      score -= 20;
    }
    
    // Deduct points for slow database queries
    if (performance.summary.database?.averageQueryTime > 200) {
      score -= 20;
    }
    
    // Deduct points for slow frontend load times
    if (performance.summary.frontend?.averageLoadTime > 3000) {
      score -= 20;
    }
    
    return Math.max(0, score);
  }

  calculateSecurityScore(security: any) {
    if (!security || !security.summary) return 0;
    
    return security.summary.securityScore || 0;
  }

  countTotalTests(results: any) {
    let total = 0;
    
    if (results.p0Critical?.results) {
      Object.values(results.p0Critical.results).forEach((category: any) => {
        if (category.results) total += category.results.length;
      });
    }
    
    if (results.p1Important?.results) {
      Object.values(results.p1Important.results).forEach((category: any) => {
        if (category.results) total += category.results.length;
      });
    }
    
    if (results.userJourneys?.results) {
      total += results.userJourneys.results.length;
    }
    
    if (results.dataFlow?.results) {
      total += results.dataFlow.results.length;
    }
    
    return total;
  }

  countPassedTests(results: any) {
    let passed = 0;
    
    if (results.p0Critical?.results) {
      Object.values(results.p0Critical.results).forEach((category: any) => {
        if (category.results) {
          passed += category.results.filter((test: any) => test.success).length;
        }
      });
    }
    
    if (results.p1Important?.results) {
      Object.values(results.p1Important.results).forEach((category: any) => {
        if (category.results) {
          passed += category.results.filter((test: any) => test.success).length;
        }
      });
    }
    
    if (results.userJourneys?.results) {
      passed += results.userJourneys.results.filter((test: any) => test.success).length;
    }
    
    if (results.dataFlow?.results) {
      passed += results.dataFlow.results.filter((test: any) => test.success).length;
    }
    
    return passed;
  }

  countFailedTests(results: any) {
    return this.countTotalTests(results) - this.countPassedTests(results);
  }

  logHealthStatus(healthCheck: any) {
    console.log(`  Overall Health: ${healthCheck.overall.toUpperCase()}`);
    console.log(`  Frontend: ${healthCheck.components.frontend.status}`);
    console.log(`  Backend: ${healthCheck.components.backend.status}`);
    console.log(`  Database: ${healthCheck.components.database.status}`);
    
    if (healthCheck.alerts.length > 0) {
      console.log('  ⚠️ Alerts:');
      healthCheck.alerts.forEach((alert: any) => {
        console.log(`    • ${alert.severity.toUpperCase()}: ${alert.message}`);
      });
    }
  }

  logTestResults(category: string, results: any) {
    if (results.allPassed !== undefined) {
      console.log(`  ${results.allPassed ? '✅' : '❌'} ${category}: ${results.allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);
    } else if (results.success !== undefined) {
      console.log(`  ${results.success ? '✅' : '❌'} ${category}: ${results.success ? 'PASSED' : 'FAILED'}`);
    }
    
    if (results.results) {
      Object.entries(results.results).forEach(([testCategory, testResults]: [string, any]) => {
        if (testResults.results) {
          const passed = testResults.results.filter((test: any) => test.success).length;
          const total = testResults.results.length;
          console.log(`    • ${testCategory}: ${passed}/${total} tests passed`);
        }
      });
    }
  }

  logPerformanceResults(performance: any) {
    if (performance.summary) {
      console.log(`  📊 Performance Score: ${this.calculatePerformanceScore(performance)}%`);
      if (performance.summary.api) {
        console.log(`    • API Average Response: ${performance.summary.api.averageResponseTime}ms`);
      }
      if (performance.summary.database) {
        console.log(`    • Database Average Query: ${performance.summary.database.averageQueryTime}ms`);
      }
      if (performance.summary.frontend) {
        console.log(`    • Frontend Average Load: ${performance.summary.frontend.averageLoadTime}ms`);
      }
    }
  }

  logSecurityResults(security: any) {
    if (security.summary) {
      console.log(`  🔒 Security Score: ${security.summary.securityScore}%`);
      console.log(`    • Total Vulnerabilities: ${security.summary.totalVulnerabilities}`);
      console.log(`    • Critical: ${security.summary.criticalVulnerabilities}`);
      console.log(`    • High: ${security.summary.highVulnerabilities}`);
      console.log(`    • Medium: ${security.summary.mediumVulnerabilities}`);
    }
  }

  logUserJourneyResults(userJourneys: any) {
    if (userJourneys.results) {
      const passed = userJourneys.results.filter((test: any) => test.success).length;
      const total = userJourneys.results.length;
      console.log(`  🎭 User Journeys: ${passed}/${total} scenarios passed`);
    }
  }

  logDataFlowResults(dataFlow: any) {
    if (dataFlow.results) {
      const passed = dataFlow.results.filter((test: any) => test.success).length;
      const total = dataFlow.results.length;
      console.log(`  🔍 Data Flow Traces: ${passed}/${total} traces successful`);
    }
  }

  generateFinalReport(results: any, totalTime: number) {
    console.log('\n📊 [Final Report] Grip Invest Mini Platform Phase 6 Test Results');
    console.log('='.repeat(80));
    
    // Overall Status
    const status = results.overall.success ? '✅ PASSED' : '❌ FAILED';
    const score = results.overall.score;
    console.log(`\n🎯 Overall Status: ${status} (Score: ${score}%)`);
    
    // Test Summary
    console.log('\n📋 Test Summary:');
    console.log(`  Total Tests: ${results.overall.summary.totalTests}`);
    console.log(`  Passed: ${results.overall.summary.passedTests}`);
    console.log(`  Failed: ${results.overall.summary.failedTests}`);
    console.log(`  Success Rate: ${((results.overall.summary.passedTests / results.overall.summary.totalTests) * 100).toFixed(2)}%`);
    
    // Component Status
    console.log('\n🔧 Component Status:');
    console.log(`  P0 Critical Tests: ${results.overall.criticalTestsPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  P1 Important Tests: ${results.overall.importantTestsPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  User Journeys: ${results.overall.userJourneysPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Data Flow: ${results.overall.dataFlowPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  System Health: ${results.overall.healthHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    
    // Performance & Security
    console.log('\n⚡ Performance & Security:');
    console.log(`  Performance Score: ${results.overall.summary.performanceScore}%`);
    console.log(`  Security Score: ${results.overall.summary.securityScore}%`);
    
    // Execution Time
    console.log(`\n⏱️ Execution Time: ${Math.round(totalTime / 1000)}s`);
    
    // Recommendations
    if (results.performance?.recommendations?.length > 0) {
      console.log('\n💡 Performance Recommendations:');
      results.performance.recommendations.slice(0, 3).forEach((rec: any, index: number) => {
        console.log(`  ${index + 1}. [${rec.priority}] ${rec.issue}`);
      });
    }
    
    if (results.security?.recommendations?.length > 0) {
      console.log('\n🔒 Security Recommendations:');
      results.security.recommendations.slice(0, 3).forEach((rec: any, index: number) => {
        console.log(`  ${index + 1}. [${rec.priority}] ${rec.issue}`);
      });
    }
    
    // Phase 6 Completion Status
    console.log('\n🎯 Phase 6 Completion Status:');
    if (results.overall.success) {
      console.log('  ✅ Phase 6 Testing COMPLETED SUCCESSFULLY');
      console.log('  🚀 System is ready for production deployment');
    } else {
      console.log('  ❌ Phase 6 Testing FAILED');
      console.log('  🛠️ Critical issues must be resolved before production deployment');
    }
    
    console.log('\n' + '='.repeat(80));
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const executor = new Phase6TestExecutor();
  
  if (args.length === 0 || args[0] === '--help') {
    console.log(`
Grip Invest Mini Platform Phase 6 Test Executor

Usage:
  npm run test:phase6                    # Run all Phase 6 tests
  npm run test:phase6 --help            # Show this help

Environment Variables:
  FRONTEND_URL     # Frontend URL (default: http://localhost:3000)
  BACKEND_URL      # Backend URL (default: http://localhost:8080)
  DB_HOST          # Database host (default: localhost)
  DB_PORT          # Database port (default: 3307)
  DB_USER          # Database user (default: root)
  DB_PASSWORD      # Database password (default: password)
  DB_NAME          # Database name (default: grip_invest)

Test Categories:
  - P0 Critical Tests (Must Pass)
  - P1 Important Tests (Should Pass)
  - Performance Testing
  - Security Testing
  - User Journey Testing
  - Data Flow Tracing
  - System Health Monitoring
    `);
    return;
  }
  
  try {
    const result = await executor.runPhase6Tests();
    
    if (!result.success) {
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ [Phase 6 Test Executor] Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { Phase6TestExecutor };
