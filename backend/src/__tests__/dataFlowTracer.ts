import { chromium } from 'playwright';
import axios from 'axios';
import mysql from 'mysql2/promise';

// Data Flow Tracer for Grip Invest Mini Platform
export class GripInvestDataFlowTracer {
  private config: any;
  private traceLog: any[];
  private activeTraces: Map<string, any>;

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
    
    this.traceLog = [];
    this.activeTraces = new Map();
  }

  async traceUserAction(actionType: string, payload: any) {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🔍 [Data Flow] Starting trace: ${traceId} for action: ${actionType}`);
    
    const trace = {
      id: traceId,
      action: actionType,
      payload,
      startTime: Date.now(),
      steps: [],
      errors: [],
      performance: {}
    };
    
    this.activeTraces.set(traceId, trace);
    
    try {
      switch (actionType) {
        case 'user-registration':
          await this.traceUserRegistration(trace, payload);
          break;
        case 'user-login':
          await this.traceUserLogin(trace, payload);
          break;
        case 'create-investment':
          await this.traceCreateInvestment(trace, payload);
          break;
        case 'browse-products':
          await this.traceBrowseProducts(trace, payload);
          break;
        default:
          await this.traceGenericAction(trace, payload);
      }
      
      (trace as any).endTime = Date.now();
      (trace as any).totalTime = (trace as any).endTime - trace.startTime;
      
      console.log(`✅ [Data Flow] Trace completed: ${traceId} in ${(trace as any).totalTime}ms`);
      
    } catch (error: any) {
      (trace as any).errors.push({
        step: 'trace-execution',
        error: error.message,
        timestamp: Date.now()
      });
      
      console.error(`❌ [Data Flow] Trace failed: ${traceId}`, error);
    }
    
    this.traceLog.push(trace);
    this.activeTraces.delete(traceId);
    
    return this.generateTraceReport(trace);
  }

  async traceUserRegistration(trace: any, payload: any) {
    // Step 1: Frontend validation
    await this.addTraceStep(trace, 'frontend-validation', async () => {
      const browser = await chromium.launch();
      const context = await browser.newContext();
      const page = await context.newPage();
      
      try {
        await page.goto(`${this.config.frontend.baseUrl}/signup`);
        
        // Fill form
        await page.fill('input[name="first_name"]', payload.first_name);
        await page.fill('input[name="last_name"]', payload.last_name);
        await page.fill('input[name="email"]', payload.email);
        await page.fill('input[name="password"]', payload.password);
        await page.selectOption('select[name="risk_appetite"]', payload.risk_appetite);
        
        // Check for validation errors before submission
        const errors = await page.locator('.MuiFormHelperText-root.Mui-error').count();
        
        return {
          validationPassed: errors === 0,
          errorCount: errors
        };
      } finally {
        await browser.close();
      }
    });
    
    // Step 2: API request
    await this.addTraceStep(trace, 'api-request', async () => {
      const response = await axios.post(`${this.config.backend.baseUrl}/api/v1/auth/signup`, {
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        password: payload.password,
        risk_appetite: payload.risk_appetite
      });
      
      return {
        statusCode: response.status,
        responseData: response.data,
        headers: response.headers
      };
    });
    
    // Step 3: Database insertion
    await this.addTraceStep(trace, 'database-insertion', async () => {
      const connection = await mysql.createConnection({
        host: this.config.database.host,
        port: this.config.database.port,
        user: this.config.database.user,
        password: this.config.database.password,
        database: this.config.database.database
      });
      
      try {
        const [result] = await connection.execute(
          'SELECT id FROM users WHERE email = ?',
          [payload.email]
        );
        
        return {
          userCreated: (result as any[]).length > 0,
          userId: (result as any[])[0]?.id
        };
      } finally {
        await connection.end();
      }
    });
    
    // Step 4: Frontend state update
    await this.addTraceStep(trace, 'frontend-update', async () => {
      const browser = await chromium.launch();
      const context = await browser.newContext();
      const page = await context.newPage();
      
      try {
        await page.goto(`${this.config.frontend.baseUrl}/signup`);
        
        // Simulate successful registration
        await page.evaluate(() => {
          (window as any).postMessage({ type: 'REGISTRATION_SUCCESS' }, '*');
        });
        
        // Check for success message or redirect
        await page.waitForSelector('.MuiAlert-success, [data-testid="registration-success"]', {
          timeout: 5000
        });
        
        return { stateUpdated: true };
      } finally {
        await browser.close();
      }
    });
  }

  async traceUserLogin(trace: any, payload: any) {
    // Step 1: Login attempt
    await this.addTraceStep(trace, 'login-attempt', async () => {
      const response = await axios.post(`${this.config.backend.baseUrl}/api/v1/auth/login`, payload);
      return {
        success: response.data.success,
        token: response.data.data?.accessToken ? 'present' : 'missing'
      };
    });
    
    // Step 2: Token storage
    await this.addTraceStep(trace, 'token-storage', async () => {
      const browser = await chromium.launch();
      const context = await browser.newContext();
      const page = await context.newPage();
      
      try {
        await page.goto(`${this.config.frontend.baseUrl}/login`);
        
        // Simulate login
        await page.fill('input[name="email"]', payload.email);
        await page.fill('input[name="password"]', payload.password);
        await page.click('button[type="submit"]');
        
        // Check token storage
        const token = await page.evaluate(() => (window as any).localStorage?.getItem('accessToken'));
        
        return { tokenStored: !!token };
      } finally {
        await browser.close();
      }
    });
  }

  async traceCreateInvestment(trace: any, payload: any) {
    // Step 1: Product selection
    await this.addTraceStep(trace, 'product-selection', async () => {
      const response = await axios.get(`${this.config.backend.baseUrl}/api/v1/products`);
      return {
        productsAvailable: response.data.data.length,
        selectedProduct: payload.product_id
      };
    });
    
    // Step 2: Investment validation
    await this.addTraceStep(trace, 'investment-validation', async () => {
      const response = await axios.post(`${this.config.backend.baseUrl}/api/v1/investments`, {
        product_id: payload.product_id,
        amount: payload.amount
      }, {
        headers: { Authorization: `Bearer ${payload.token}` }
      });
      
      return {
        statusCode: response.status,
        investmentCreated: response.data.success,
        investmentId: response.data.data?.id
      };
    });
    
    // Step 3: Database verification
    await this.addTraceStep(trace, 'database-verification', async () => {
      const connection = await mysql.createConnection({
        host: this.config.database.host,
        port: this.config.database.port,
        user: this.config.database.user,
        password: this.config.database.password,
        database: this.config.database.database
      });
      
      try {
        const [result] = await connection.execute(
          'SELECT * FROM investments WHERE product_id = ? AND amount = ?',
          [payload.product_id, payload.amount]
        );
        
        return {
          investmentFound: (result as any[]).length > 0,
          investmentData: (result as any[])[0]
        };
      } finally {
        await connection.end();
      }
    });
  }

  async traceBrowseProducts(trace: any, payload: any) {
    // Step 1: API call
    await this.addTraceStep(trace, 'api-call', async () => {
      const response = await axios.get(`${this.config.backend.baseUrl}/api/v1/products`, {
        params: payload.filters || {}
      });
      
      return {
        statusCode: response.status,
        productsCount: response.data.data.length,
        responseTime: Date.now() - trace.startTime
      };
    });
    
    // Step 2: Frontend rendering
    await this.addTraceStep(trace, 'frontend-rendering', async () => {
      const browser = await chromium.launch();
      const context = await browser.newContext();
      const page = await context.newPage();
      
      try {
        await page.goto(`${this.config.frontend.baseUrl}/products`);
        
        // Wait for products to load
        await page.waitForSelector('.MuiCard-root, [data-testid="product-card"]', { timeout: 10000 });
        
        // Count rendered products
        const productCount = await page.locator('.MuiCard-root, [data-testid="product-card"]').count();
        
        return {
          productsRendered: productCount,
          renderingTime: Date.now() - trace.startTime
        };
      } finally {
        await browser.close();
      }
    });
  }

  async traceGenericAction(trace: any, payload: any) {
    await this.addTraceStep(trace, 'generic-action', async () => {
      return {
        action: payload.action,
        timestamp: Date.now(),
        status: 'completed'
      };
    });
  }

  async addTraceStep(trace: any, stepName: string, stepFunction: () => Promise<any>) {
    const stepStart = Date.now();
    
    try {
      console.log(`  🔄 [Data Flow] Step: ${stepName}`);
      
      const result = await stepFunction();
      const stepTime = Date.now() - stepStart;
      
      trace.steps.push({
        name: stepName,
        status: 'success',
        duration: stepTime,
        result,
        timestamp: stepStart
      });
      
      console.log(`  ✅ [Data Flow] Step completed: ${stepName} (${stepTime}ms)`);
      
    } catch (error: any) {
      const stepTime = Date.now() - stepStart;
      
      trace.steps.push({
        name: stepName,
        status: 'error',
        duration: stepTime,
        error: error.message,
        timestamp: stepStart
      });
      
      trace.errors.push({
        step: stepName,
        error: error.message,
        timestamp: stepStart
      });
      
      console.error(`  ❌ [Data Flow] Step failed: ${stepName} (${stepTime}ms)`, error.message);
      throw error;
    }
  }

  generateTraceReport(trace: any) {
    const totalSteps = trace.steps.length;
    const failedSteps = trace.steps.filter((step: any) => step.status === 'error').length;
    const avgStepTime = trace.steps.reduce((sum: number, step: any) => sum + step.duration, 0) / totalSteps;
    
    return {
      traceId: trace.id,
      action: trace.action,
      success: failedSteps === 0,
      performance: {
        totalTime: trace.totalTime,
        totalSteps,
        failedSteps,
        averageStepTime: Math.round(avgStepTime),
        bottleneckStep: trace.steps.reduce((slowest: any, step: any) => 
          step.duration > slowest.duration ? step : slowest, trace.steps[0]
        )?.name
      },
      dataFlow: trace.steps.map((step: any) => ({
        step: step.name,
        status: step.status,
        duration: step.duration,
        success: step.status === 'success'
      })),
      errors: trace.errors,
      recommendations: this.generateTraceRecommendations(trace)
    };
  }

  generateTraceRecommendations(trace: any) {
    const recommendations: string[] = [];
    
    // Performance recommendations
    const slowSteps = trace.steps.filter((step: any) => step.duration > 2000);
    slowSteps.forEach((step: any) => {
      recommendations.push(`Performance: Slow ${step.name} execution - Investigate ${step.name} performance - ${step.duration}ms is above threshold`);
    });
    
    // Error recommendations
    trace.errors.forEach((error: any) => {
      recommendations.push(`Reliability: ${error.step} failure - Fix ${error.step} error: ${error.error}`);
    });
    
    return recommendations;
  }

  getTraceHistory(limit = 10) {
    return this.traceLog.slice(-limit);
  }

  getActiveTraces() {
    return Array.from(this.activeTraces.values());
  }
}
