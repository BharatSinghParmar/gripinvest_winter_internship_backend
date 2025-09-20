export interface PasswordStrengthResult {
  score: number; // 0-100
  level: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  suggestions: string[];
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
    noCommonPatterns: boolean;
  };
}

export class PasswordStrengthService {
  private readonly MIN_LENGTH = 8;
  private readonly COMMON_PASSWORDS = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    '1234567890', 'password1', 'qwerty123', 'dragon', 'master'
  ];

  /**
   * Analyze password strength and provide suggestions
   */
  analyzePasswordStrength(password: string): PasswordStrengthResult {
    const requirements = this.checkRequirements(password);
    const score = this.calculateScore(password, requirements);
    const level = this.getStrengthLevel(score);
    const suggestions = this.generateSuggestions(password, requirements);

    return {
      score,
      level,
      suggestions,
      requirements
    };
  }

  /**
   * Check if password meets basic requirements
   */
  private checkRequirements(password: string) {
    return {
      length: password.length >= this.MIN_LENGTH,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      noCommonPatterns: !this.COMMON_PASSWORDS.some(common => 
        password.toLowerCase().includes(common.toLowerCase())
      )
    };
  }

  /**
   * Calculate password strength score (0-100)
   */
  private calculateScore(password: string, requirements: any): number {
    let score = 0;

    // Length scoring (0-30 points)
    if (password.length >= 12) score += 30;
    else if (password.length >= 10) score += 25;
    else if (password.length >= 8) score += 20;
    else if (password.length >= 6) score += 10;

    // Character variety scoring (0-40 points)
    if (requirements.uppercase) score += 8;
    if (requirements.lowercase) score += 8;
    if (requirements.numbers) score += 8;
    if (requirements.symbols) score += 16;

    // Pattern and complexity scoring (0-30 points)
    if (requirements.noCommonPatterns) score += 15;
    
    // Bonus for entropy
    const entropy = this.calculateEntropy(password);
    if (entropy > 4) score += 15;
    else if (entropy > 3) score += 10;
    else if (entropy > 2) score += 5;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate password entropy
   */
  private calculateEntropy(password: string): number {
    const charSet = new Set(password);
    const charsetSize = charSet.size;
    return Math.log2(Math.pow(charsetSize, password.length));
  }

  /**
   * Get strength level based on score
   */
  private getStrengthLevel(score: number): 'weak' | 'fair' | 'good' | 'strong' | 'very-strong' {
    if (score >= 90) return 'very-strong';
    if (score >= 75) return 'strong';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'weak';
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(password: string, requirements: any): string[] {
    const suggestions: string[] = [];

    if (!requirements.length) {
      suggestions.push(`Use at least ${this.MIN_LENGTH} characters`);
    }

    if (!requirements.uppercase) {
      suggestions.push('Add uppercase letters (A-Z)');
    }

    if (!requirements.lowercase) {
      suggestions.push('Add lowercase letters (a-z)');
    }

    if (!requirements.numbers) {
      suggestions.push('Add numbers (0-9)');
    }

    if (!requirements.symbols) {
      suggestions.push('Add special characters (!@#$%^&*)');
    }

    if (!requirements.noCommonPatterns) {
      suggestions.push('Avoid common words and patterns');
    }

    if (password.length < 12) {
      suggestions.push('Consider using 12+ characters for better security');
    }

    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
      suggestions.push('Avoid repeating the same character multiple times');
    }

    // Check for sequential patterns
    if (this.hasSequentialPattern(password)) {
      suggestions.push('Avoid sequential patterns (123, abc, etc.)');
    }

    return suggestions;
  }

  /**
   * Check for sequential patterns
   */
  private hasSequentialPattern(password: string): boolean {
    const lowerPassword = password.toLowerCase();
    
    // Check for numeric sequences
    for (let i = 0; i < lowerPassword.length - 2; i++) {
      const char1 = lowerPassword.charCodeAt(i);
      const char2 = lowerPassword.charCodeAt(i + 1);
      const char3 = lowerPassword.charCodeAt(i + 2);
      
      if (char2 === char1 + 1 && char3 === char2 + 1) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Validate password meets minimum requirements
   */
  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const requirements = this.checkRequirements(password);
    const errors: string[] = [];

    if (!requirements.length) {
      errors.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    }

    if (!requirements.uppercase) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!requirements.lowercase) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!requirements.numbers) {
      errors.push('Password must contain at least one number');
    }

    if (!requirements.symbols) {
      errors.push('Password must contain at least one special character');
    }

    if (!requirements.noCommonPatterns) {
      errors.push('Password cannot contain common words or patterns');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
