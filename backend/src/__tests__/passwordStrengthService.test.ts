import { PasswordStrengthService } from '../services/passwordStrengthService';

describe('PasswordStrengthService', () => {
  let passwordStrengthService: PasswordStrengthService;

  beforeEach(() => {
    passwordStrengthService = new PasswordStrengthService();
  });

  describe('analyzePasswordStrength', () => {
    it('should analyze weak password correctly', () => {
      const result = passwordStrengthService.analyzePasswordStrength('123');

      expect(result.score).toBeLessThan(40);
      expect(result.level).toBe('weak');
      expect(result.requirements.length).toBe(false);
      expect(result.requirements.uppercase).toBe(false);
      expect(result.requirements.lowercase).toBe(false);
      expect(result.requirements.numbers).toBe(true);
      expect(result.requirements.symbols).toBe(false);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should analyze strong password correctly', () => {
      const result = passwordStrengthService.analyzePasswordStrength('StrongPass123!');

      expect(result.score).toBeGreaterThan(75);
      expect(['strong', 'very-strong']).toContain(result.level);
      expect(result.requirements.length).toBe(true);
      expect(result.requirements.uppercase).toBe(true);
      expect(result.requirements.lowercase).toBe(true);
      expect(result.requirements.numbers).toBe(true);
      expect(result.requirements.symbols).toBe(true);
      expect(result.requirements.noCommonPatterns).toBe(true);
    });

    it('should detect common password patterns', () => {
      const result = passwordStrengthService.analyzePasswordStrength('password123');

      expect(result.requirements.noCommonPatterns).toBe(false);
      expect(result.suggestions).toContain('Avoid common words and patterns');
    });

    it('should detect sequential patterns', () => {
      const result = passwordStrengthService.analyzePasswordStrength('abc123');

      expect(result.suggestions).toContain('Avoid sequential patterns (123, abc, etc.)');
    });

    it('should detect repeated characters', () => {
      const result = passwordStrengthService.analyzePasswordStrength('aaa123');

      expect(result.suggestions).toContain('Avoid repeating the same character multiple times');
    });

    it('should provide specific suggestions for missing requirements', () => {
      const result = passwordStrengthService.analyzePasswordStrength('password');

      expect(result.suggestions).toContain('Add uppercase letters (A-Z)');
      expect(result.suggestions).toContain('Add numbers (0-9)');
      expect(result.suggestions).toContain('Add special characters (!@#$%^&*)');
    });
  });

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      const result = passwordStrengthService.validatePassword('StrongPass123!');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak password with specific errors', () => {
      const result = passwordStrengthService.validatePassword('weak');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should reject password with common patterns', () => {
      const result = passwordStrengthService.validatePassword('password123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password cannot contain common words or patterns');
    });
  });

  describe('calculateEntropy', () => {
    it('should calculate higher entropy for more diverse passwords', () => {
      const simplePassword = 'aaaa';
      const complexPassword = 'aA1!';

      // This is testing the private method indirectly through analyzePasswordStrength
      const simpleResult = passwordStrengthService.analyzePasswordStrength(simplePassword);
      const complexResult = passwordStrengthService.analyzePasswordStrength(complexPassword);

      expect(complexResult.score).toBeGreaterThan(simpleResult.score);
    });
  });

  describe('getStrengthLevel', () => {
    it('should return correct strength levels', () => {
      const veryStrongResult = passwordStrengthService.analyzePasswordStrength('VeryStrongPass123!@#');
      const strongResult = passwordStrengthService.analyzePasswordStrength('StrongPass123!');
      const goodResult = passwordStrengthService.analyzePasswordStrength('GoodPass1');
      const fairResult = passwordStrengthService.analyzePasswordStrength('FairPass');
      const weakResult = passwordStrengthService.analyzePasswordStrength('weak');

      expect(veryStrongResult.level).toBe('very-strong');
      expect(['strong', 'very-strong']).toContain(strongResult.level);
      expect(goodResult.level).toBe('good');
      expect(['fair', 'good']).toContain(fairResult.level);
      expect(weakResult.level).toBe('weak');
    });
  });

  describe('edge cases', () => {
    it('should handle empty password', () => {
      const result = passwordStrengthService.analyzePasswordStrength('');

      expect(result.score).toBeLessThan(40);
      expect(result.level).toBe('weak');
      expect(result.requirements.length).toBe(false);
    });

    it('should handle very long password', () => {
      const longPassword = 'A'.repeat(100) + 'a'.repeat(100) + '1'.repeat(100) + '!'.repeat(100);
      const result = passwordStrengthService.analyzePasswordStrength(longPassword);

      expect(result.score).toBe(100);
      expect(result.level).toBe('very-strong');
    });

    it('should handle password with only special characters', () => {
      const result = passwordStrengthService.analyzePasswordStrength('!@#$%^&*');

      expect(result.requirements.symbols).toBe(true);
      expect(result.requirements.uppercase).toBe(false);
      expect(result.requirements.lowercase).toBe(false);
      expect(result.requirements.numbers).toBe(false);
    });
  });
});
