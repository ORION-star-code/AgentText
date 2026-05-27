import { describe, it, expect } from 'vitest';
import { extractKeywords } from '../../../src/utils/keyword-extractor.js';

describe('extractKeywords', () => {
  it('should extract meaningful words', () => {
    const keywords = extractKeywords('How does the UserService authenticate users?');

    expect(keywords).toContain('userservice');
    expect(keywords).toContain('authenticate');
    expect(keywords).toContain('users');
    expect(keywords).not.toContain('how');
    expect(keywords).not.toContain('does');
    expect(keywords).not.toContain('the');
  });

  it('should deduplicate keywords', () => {
    const keywords = extractKeywords('UserService calls UserService.init');

    const userServiceCount = keywords.filter((k) => k === 'userservice').length;
    expect(userServiceCount).toBe(1);
  });

  it('should filter short words', () => {
    const keywords = extractKeywords('a is do it ok');

    expect(keywords).toHaveLength(0);
  });

  it('should extract file patterns when enabled', () => {
    const keywords = extractKeywords('Error in src/auth/login.ts at line 42', {
      extractFilePatterns: true,
    });

    expect(keywords).toContain('src/auth/login.ts');
  });

  it('should extract stack trace symbols when enabled', () => {
    const keywords = extractKeywords('TypeError at UserService(', {
      extractStackTraceSymbols: true,
    });

    expect(keywords).toContain('UserService');
  });

  it('should not extract stack trace symbols when disabled', () => {
    const keywords = extractKeywords('TypeError at UserService(', {
      extractStackTraceSymbols: false,
    });

    expect(keywords).not.toContain('UserService');
  });

  it('should use custom stop words', () => {
    const customStop = new Set(['custom', 'stop']);
    const keywords = extractKeywords('custom stop important function', {
      stopWords: customStop,
    });

    expect(keywords).toContain('important');
    expect(keywords).toContain('function');
    expect(keywords).not.toContain('custom');
    expect(keywords).not.toContain('stop');
  });
});
