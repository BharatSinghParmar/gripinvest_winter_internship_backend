import { Product, ProductRecommendation, AIProductDescription } from '../types/product';
import { ErrorAnalysis } from '../types';
import { prisma } from '../prisma/client';

export class AIService {
  /**
   * Generate AI-powered product description
   */
  generateProductDescription(product: Product): AIProductDescription {
    // Extract product properties for AI processing

    // Generate description based on product characteristics
    const description = this.generateDescription(product);
    const keyFeatures = this.generateKeyFeatures(product);
    const riskFactors = this.generateRiskFactors(product);
    const suitability = this.generateSuitability(product);

    return {
      description,
      keyFeatures,
      riskFactors,
      suitability,
    };
  }

  /**
   * Generate product recommendations based on user profile
   */
  generateRecommendations(
    products: Product[],
    riskAppetite: 'low' | 'moderate' | 'high',
    investmentAmount: number,
    preferredTenure?: number
  ): ProductRecommendation[] {
    return products
      .map(product => ({
        product,
        score: this.calculateRecommendationScore(product, riskAppetite, investmentAmount, preferredTenure),
        reasons: this.generateRecommendationReasons(product, riskAppetite, investmentAmount, preferredTenure),
      }))
      .filter(rec => rec.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Top 10 recommendations
  }

  /**
   * Calculate password strength score
   */
  calculatePasswordStrength(password: string): { score: number; suggestions: string[] } {
    let score = 0;
    const suggestions: string[] = [];

    // Length check
    if (password.length >= 8) score += 1;
    else suggestions.push('Use at least 8 characters');

    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else suggestions.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else suggestions.push('Include uppercase letters');

    if (/\d/.test(password)) score += 1;
    else suggestions.push('Include numbers');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else suggestions.push('Include special characters');

    // Common patterns check
    if (this.isCommonPassword(password)) {
      score = Math.max(0, score - 2);
      suggestions.push('Avoid common passwords');
    }

    // Sequential characters check
    if (this.hasSequentialChars(password)) {
      score = Math.max(0, score - 1);
      suggestions.push('Avoid sequential characters');
    }

    return { score: Math.min(4, score), suggestions };
  }

  /**
   * Generate error summary from transaction logs
   */
  generateErrorSummary(logs: Array<{ endpoint: string; status_code: number; error_message: string; created_at: Date }>): string {
    const errorCounts = new Map<string, number>();
    const recentErrors = logs.filter(log => 
      log.status_code >= 400 && 
      new Date().getTime() - new Date(log.created_at).getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );

    recentErrors.forEach(log => {
      const key = `${log.endpoint}:${log.status_code}`;
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    });

    if (errorCounts.size === 0) {
      return 'No errors in the last 24 hours';
    }

    const topErrors = Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return `Recent issues: ${topErrors.map(([error, count]) => `${error} (${count}x)`).join(', ')}`;
  }

  /**
   * Analyze error patterns and generate insights
   */
  async analyzeErrorPatterns(days: number = 7): Promise<ErrorAnalysis> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const errorLogs = await prisma.transaction_logs.findMany({
      where: {
        status_code: { gte: 400 },
        created_at: { gte: startDate },
      },
      select: {
        error_code: true,
        endpoint: true,
        status_code: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Analyze error patterns
    const errorPatterns = this.analyzeErrorPatternsByCode(errorLogs);
    const errorHotspots = this.analyzeErrorHotspots(errorLogs);
    const insights = this.generateErrorInsights(errorPatterns, errorHotspots);
    const recommendations = this.generateErrorRecommendations(errorPatterns, errorHotspots);

    return {
      error_patterns: errorPatterns,
      error_hotspots: errorHotspots,
      insights,
      recommendations,
    };
  }

  /**
   * Categorize errors by type and frequency
   */
  private analyzeErrorPatternsByCode(logs: Array<{ error_code: string | null; created_at: Date }>): Array<{
    error_code: string;
    count: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    last_occurrence: Date;
  }> {
    const errorCounts = new Map<string, { count: number; lastOccurrence: Date; occurrences: Date[] }>();

    logs.forEach(log => {
      const errorCode = log.error_code || 'UNKNOWN';
      if (!errorCounts.has(errorCode)) {
        errorCounts.set(errorCode, { count: 0, lastOccurrence: log.created_at, occurrences: [] });
      }
      const error = errorCounts.get(errorCode)!;
      error.count++;
      error.lastOccurrence = new Date(Math.max(error.lastOccurrence.getTime(), log.created_at.getTime()));
      error.occurrences.push(log.created_at);
    });

    return Array.from(errorCounts.entries()).map(([errorCode, data]) => {
      const trend = this.calculateTrend(data.occurrences);
      return {
        error_code: errorCode,
        count: data.count,
        trend,
        last_occurrence: data.lastOccurrence,
      };
    }).sort((a, b) => b.count - a.count);
  }

  /**
   * Identify error hotspots by endpoint
   */
  private analyzeErrorHotspots(logs: Array<{ endpoint: string; status_code: number }>): Array<{
    endpoint: string;
    error_count: number;
    error_rate: number;
  }> {
    const endpointStats = new Map<string, { total: number; errors: number }>();

    logs.forEach(log => {
      if (!endpointStats.has(log.endpoint)) {
        endpointStats.set(log.endpoint, { total: 0, errors: 0 });
      }
      const stats = endpointStats.get(log.endpoint)!;
      stats.total++;
      if (log.status_code >= 400) {
        stats.errors++;
      }
    });

    return Array.from(endpointStats.entries()).map(([endpoint, stats]) => ({
      endpoint,
      error_count: stats.errors,
      error_rate: stats.total > 0 ? (stats.errors / stats.total) * 100 : 0,
    })).sort((a, b) => b.error_count - a.error_count);
  }

  /**
   * Generate AI-powered error insights
   */
  private generateErrorInsights(
    errorPatterns: Array<{ error_code: string; count: number; trend: string }>,
    errorHotspots: Array<{ endpoint: string; error_count: number; error_rate: number }>
  ): string[] {
    const insights: string[] = [];

    // High frequency errors
    const highFreqErrors = errorPatterns.filter(p => p.count >= 10);
    if (highFreqErrors.length > 0) {
      insights.push(`High frequency errors detected: ${highFreqErrors.map(e => e.error_code).join(', ')}`);
    }

    // Increasing trends
    const increasingErrors = errorPatterns.filter(p => p.trend === 'increasing');
    if (increasingErrors.length > 0) {
      insights.push(`Error trends increasing: ${increasingErrors.map(e => e.error_code).join(', ')}`);
    }

    // High error rate endpoints
    const highErrorEndpoints = errorHotspots.filter(h => h.error_rate > 20);
    if (highErrorEndpoints.length > 0) {
      insights.push(`High error rate endpoints: ${highErrorEndpoints.map(e => e.endpoint).join(', ')}`);
    }

    // Server errors
    const serverErrors = errorPatterns.filter(p => p.error_code === 'SERVER_ERROR');
    if (serverErrors.length > 0) {
      insights.push('Server errors detected - investigate infrastructure and code quality');
    }

    // Authentication errors
    const authErrors = errorPatterns.filter(p => p.error_code === 'UNAUTHORIZED' || p.error_code === 'FORBIDDEN');
    if (authErrors.length > 0) {
      insights.push('Authentication issues detected - review security implementation');
    }

    if (insights.length === 0) {
      insights.push('System appears stable with minimal error activity');
    }

    return insights;
  }

  /**
   * Generate actionable recommendations
   */
  private generateErrorRecommendations(
    errorPatterns: Array<{ error_code: string; count: number; trend: string }>,
    errorHotspots: Array<{ endpoint: string; error_count: number; error_rate: number }>
  ): string[] {
    const recommendations: string[] = [];

    // Server error recommendations
    const serverErrors = errorPatterns.filter(p => p.error_code === 'SERVER_ERROR');
    if (serverErrors.length > 0) {
      recommendations.push('Implement better error handling and logging for server errors');
      recommendations.push('Review database connection stability and query performance');
    }

    // Validation error recommendations
    const validationErrors = errorPatterns.filter(p => p.error_code === 'VALIDATION_ERROR');
    if (validationErrors.length > 0) {
      recommendations.push('Improve input validation and provide clearer error messages');
      recommendations.push('Consider adding client-side validation to reduce server load');
    }

    // Authentication error recommendations
    const authErrors = errorPatterns.filter(p => p.error_code === 'UNAUTHORIZED' || p.error_code === 'FORBIDDEN');
    if (authErrors.length > 0) {
      recommendations.push('Review authentication flow and token management');
      recommendations.push('Consider implementing rate limiting for auth endpoints');
    }

    // High error rate endpoint recommendations
    const highErrorEndpoints = errorHotspots.filter(h => h.error_rate > 20);
    if (highErrorEndpoints.length > 0) {
      recommendations.push(`Focus on stabilizing endpoints: ${highErrorEndpoints.map(e => e.endpoint).join(', ')}`);
    }

    // General recommendations
    if (errorPatterns.length > 0) {
      recommendations.push('Implement comprehensive monitoring and alerting system');
      recommendations.push('Set up automated error reporting and tracking');
    }

    return recommendations;
  }

  /**
   * Calculate trend direction for error occurrences
   */
  private calculateTrend(occurrences: Date[]): 'increasing' | 'decreasing' | 'stable' {
    if (occurrences.length < 2) return 'stable';

    // Sort by date
    const sorted = occurrences.sort((a, b) => a.getTime() - b.getTime());
    
    // Split into two halves
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);

    const firstHalfAvg = firstHalf.length;
    const secondHalfAvg = secondHalf.length;

    const threshold = 0.2; // 20% change threshold
    const change = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;

    if (change > threshold) return 'increasing';
    if (change < -threshold) return 'decreasing';
    return 'stable';
  }

  private generateDescription(product: Product): string {
    const { name, investment_type, annual_yield, tenure_months, risk_level } = product;
    
    const typeDescriptions = {
      bond: 'government or corporate bond',
      fd: 'fixed deposit',
      mf: 'mutual fund',
      etf: 'exchange-traded fund',
      other: 'investment product'
    };

    const riskDescriptions = {
      low: 'low-risk, stable returns',
      moderate: 'moderate-risk, balanced growth',
      high: 'high-risk, high potential returns'
    };

    return `${name} is a ${typeDescriptions[investment_type]} offering ${annual_yield}% annual yield over ${tenure_months} months. This ${riskDescriptions[risk_level]} investment option provides ${this.getInvestmentBenefits(investment_type, risk_level)}.`;
  }

  private generateKeyFeatures(product: Product): string[] {
    const features: string[] = [];
    const { annual_yield, tenure_months, min_investment } = product;

    features.push(`${annual_yield}% guaranteed annual yield`);
    features.push(`${tenure_months} month investment tenure`);
    features.push(`Minimum investment: ₹${min_investment.toLocaleString()}`);
    
    if (product.max_investment) {
      features.push(`Maximum investment: ₹${product.max_investment.toLocaleString()}`);
    }

    switch (product.investment_type) {
      case 'bond':
        features.push('Government or corporate backing');
        features.push('Fixed interest payments');
        break;
      case 'fd':
        features.push('Bank guarantee');
        features.push('Fixed maturity date');
        break;
      case 'mf':
        features.push('Professional fund management');
        features.push('Diversified portfolio');
        break;
      case 'etf':
        features.push('Exchange-traded liquidity');
        features.push('Low expense ratio');
        break;
    }

    return features;
  }

  private generateRiskFactors(product: Product): string[] {
    const factors: string[] = [];
    const { investment_type, risk_level } = product;

    if (risk_level === 'high') {
      factors.push('High volatility potential');
      factors.push('Market risk exposure');
    }

    if (investment_type === 'mf' || investment_type === 'etf') {
      factors.push('Market performance dependency');
      factors.push('No guaranteed returns');
    }

    if (investment_type === 'bond') {
      factors.push('Interest rate sensitivity');
      factors.push('Credit risk exposure');
    }

    if (investment_type === 'fd') {
      factors.push('Inflation risk');
      factors.push('Early withdrawal penalties');
    }

    return factors;
  }

  private generateSuitability(product: Product): string {
    const { risk_level } = product;

    if (risk_level === 'low') {
      return 'Suitable for conservative investors seeking stable returns and capital preservation.';
    } else if (risk_level === 'moderate') {
      return 'Suitable for balanced investors willing to accept moderate risk for better returns.';
    } else {
      return 'Suitable for aggressive investors seeking high returns and willing to accept significant risk.';
    }
  }

  private calculateRecommendationScore(
    product: Product,
    riskAppetite: 'low' | 'moderate' | 'high',
    investmentAmount: number,
    preferredTenure?: number
  ): number {
    let score = 0;

    // Risk level matching (40% weight)
    if (product.risk_level === riskAppetite) {
      score += 40;
    } else if (
      (riskAppetite === 'moderate' && (product.risk_level === 'low' || product.risk_level === 'high')) ||
      (riskAppetite === 'high' && product.risk_level === 'moderate')
    ) {
      score += 20;
    }

    // Investment amount compatibility (30% weight)
    if (investmentAmount >= product.min_investment) {
      score += 30;
      if (product.max_investment && investmentAmount <= product.max_investment) {
        score += 10; // Bonus for being within range
      }
    }

    // Yield preference (20% weight)
    if (product.annual_yield >= 8) {
      score += 20;
    } else if (product.annual_yield >= 6) {
      score += 15;
    } else if (product.annual_yield >= 4) {
      score += 10;
    }

    // Tenure preference (10% weight)
    if (preferredTenure) {
      const tenureDiff = Math.abs(product.tenure_months - preferredTenure);
      if (tenureDiff <= 6) {
        score += 10;
      } else if (tenureDiff <= 12) {
        score += 5;
      }
    } else {
      score += 5; // Default score if no preference
    }

    return Math.min(100, score);
  }

  private generateRecommendationReasons(
    product: Product,
    riskAppetite: 'low' | 'moderate' | 'high',
    investmentAmount: number,
    preferredTenure?: number
  ): string[] {
    const reasons: string[] = [];

    if (product.risk_level === riskAppetite) {
      reasons.push(`Matches your ${riskAppetite} risk appetite`);
    }

    if (investmentAmount >= product.min_investment) {
      reasons.push(`Within your investment budget of ₹${investmentAmount.toLocaleString()}`);
    }

    if (product.annual_yield >= 8) {
      reasons.push(`High yield of ${product.annual_yield}%`);
    }

    if (preferredTenure && Math.abs(product.tenure_months - preferredTenure) <= 6) {
      reasons.push(`Matches your preferred ${preferredTenure} month tenure`);
    }

    return reasons;
  }

  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    return commonPasswords.includes(password.toLowerCase());
  }

  private hasSequentialChars(password: string): boolean {
    const sequences = ['123', 'abc', 'qwe', 'asd', 'zxc'];
    const lowerPassword = password.toLowerCase();
    return sequences.some(seq => lowerPassword.includes(seq));
  }

  private getInvestmentBenefits(investmentType: string, riskLevel: string): string {
    const benefits = {
      bond: 'stable income and capital preservation',
      fd: 'guaranteed returns and safety',
      mf: 'professional management and diversification',
      etf: 'low-cost exposure to market indices',
      other: 'flexible investment options'
    };

    const riskBenefits = {
      low: 'predictable returns',
      moderate: 'balanced growth potential',
      high: 'significant growth opportunities'
    };

    return `${benefits[investmentType as keyof typeof benefits]} with ${riskBenefits[riskLevel as keyof typeof riskBenefits]}`;
  }
}
