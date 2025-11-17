import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getInternalApiOrigin, buildInternalApiUrl } from './internal-api-url';

describe('internal-api-url', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getInternalApiOrigin', () => {
    it('should return localhost for staging domain', () => {
      process.env.PORT = '4200';
      const result = getInternalApiOrigin('https://parent-stg.moe.gov.ae');
      expect(result).toBe('http://localhost:4200');
    });

    it('should return localhost for production domain', () => {
      process.env.PORT = '4200';
      const result = getInternalApiOrigin('https://parent.moe.gov.ae');
      expect(result).toBe('http://localhost:4200');
    });

    it('should use default port 4200 when PORT env is not set', () => {
      delete process.env.PORT;
      const result = getInternalApiOrigin('https://parent-stg.moe.gov.ae');
      expect(result).toBe('http://localhost:4200');
    });

    it('should use custom PORT from env variable', () => {
      process.env.PORT = '3000';
      const result = getInternalApiOrigin('https://parent-stg.moe.gov.ae');
      expect(result).toBe('http://localhost:3000');
    });

    it('should return original origin for localhost development', () => {
      const result = getInternalApiOrigin('http://localhost:4200');
      expect(result).toBe('http://localhost:4200');
    });

    it('should return original origin for 127.0.0.1', () => {
      const result = getInternalApiOrigin('http://127.0.0.1:4200');
      expect(result).toBe('http://127.0.0.1:4200');
    });

    it('should return original origin for non-production domains', () => {
      const result = getInternalApiOrigin('http://localhost:3000');
      expect(result).toBe('http://localhost:3000');
    });

    it('should use localhost for dev.example.com (any non-localhost domain)', () => {
      process.env.PORT = '4200';
      const result = getInternalApiOrigin('https://dev.example.com');
      expect(result).toBe('http://localhost:4200');
    });

    it('should handle URLs with ports', () => {
      process.env.PORT = '8080';
      const result = getInternalApiOrigin('https://parent-stg.moe.gov.ae:443');
      expect(result).toBe('http://localhost:8080');
    });

    it('should handle URLs with http protocol on staging', () => {
      process.env.PORT = '4200';
      const result = getInternalApiOrigin('http://parent-stg.moe.gov.ae');
      expect(result).toBe('http://localhost:4200');
    });
  });

  describe('buildInternalApiUrl', () => {
    it('should build correct URL for staging with leading slash', () => {
      process.env.PORT = '4200';
      const result = buildInternalApiUrl('https://parent-stg.moe.gov.ae', '/api/PP/auth/token');
      expect(result).toBe('http://localhost:4200/api/PP/auth/token');
    });

    it('should build correct URL for production with leading slash', () => {
      process.env.PORT = '4200';
      const result = buildInternalApiUrl('https://parent.moe.gov.ae', '/api/parent/child-actions');
      expect(result).toBe('http://localhost:4200/api/parent/child-actions');
    });

    it('should add leading slash if missing', () => {
      process.env.PORT = '4200';
      const result = buildInternalApiUrl('https://parent-stg.moe.gov.ae', 'api/PP/auth/token');
      expect(result).toBe('http://localhost:4200/api/PP/auth/token');
    });

    it('should preserve query parameters', () => {
      process.env.PORT = '4200';
      const result = buildInternalApiUrl(
        'https://parent-stg.moe.gov.ae',
        '/api/parent/child-actions?studentPersonId=123'
      );
      expect(result).toBe('http://localhost:4200/api/parent/child-actions?studentPersonId=123');
    });

    it('should work with localhost development origin', () => {
      const result = buildInternalApiUrl('http://localhost:4200', '/api/PP/auth/token');
      expect(result).toBe('http://localhost:4200/api/PP/auth/token');
    });

    it('should handle complex paths', () => {
      process.env.PORT = '4200';
      const result = buildInternalApiUrl(
        'https://parent-stg.moe.gov.ae',
        '/api/parent/students-partnership-charter?studentNumber=2013007271&academicyear=2025-2026'
      );
      expect(result).toBe(
        'http://localhost:4200/api/parent/students-partnership-charter?studentNumber=2013007271&academicyear=2025-2026'
      );
    });

    it('should handle paths with hash fragments', () => {
      process.env.PORT = '4200';
      const result = buildInternalApiUrl('https://parent-stg.moe.gov.ae', '/api/test#section');
      expect(result).toBe('http://localhost:4200/api/test#section');
    });

    it('should work with non-production origins unchanged', () => {
      process.env.PORT = '4200';
      const result = buildInternalApiUrl('https://dev.example.com', '/api/test');
      expect(result).toBe('http://localhost:4200/api/test');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty path gracefully', () => {
      process.env.PORT = '4200';
      const result = buildInternalApiUrl('https://parent-stg.moe.gov.ae', '');
      expect(result).toBe('http://localhost:4200/');
    });

    it('should handle root path', () => {
      process.env.PORT = '4200';
      const result = buildInternalApiUrl('https://parent-stg.moe.gov.ae', '/');
      expect(result).toBe('http://localhost:4200/');
    });

    it('should handle multiple slashes in path', () => {
      process.env.PORT = '4200';
      const result = buildInternalApiUrl('https://parent-stg.moe.gov.ae', '//api//test');
      expect(result).toBe('http://localhost:4200//api//test');
    });
  });

  describe('Integration scenarios', () => {
    it('should match real child-actions route usage', () => {
      process.env.PORT = '4200';
      const requestOrigin = 'https://parent-stg.moe.gov.ae';
      const tokenUrl = buildInternalApiUrl(requestOrigin, '/api/PP/auth/token');
      
      expect(tokenUrl).toBe('http://localhost:4200/api/PP/auth/token');
    });

    it('should match real students-partnership-charter route usage', () => {
      process.env.PORT = '4200';
      const requestOrigin = 'https://parent-stg.moe.gov.ae';
      const tokenUrl = buildInternalApiUrl(requestOrigin, '/api/PP/auth/token');
      
      expect(tokenUrl).toBe('http://localhost:4200/api/PP/auth/token');
    });

    it('should work in development environment', () => {
      const requestOrigin = 'http://localhost:4200';
      const tokenUrl = buildInternalApiUrl(requestOrigin, '/api/PP/auth/token');
      
      expect(tokenUrl).toBe('http://localhost:4200/api/PP/auth/token');
    });

    it('should handle production environment', () => {
      process.env.PORT = '80';
      const requestOrigin = 'https://parent.moe.gov.ae';
      const tokenUrl = buildInternalApiUrl(requestOrigin, '/api/PP/auth/token');
      
      expect(tokenUrl).toBe('http://localhost:80/api/PP/auth/token');
    });
  });
});
