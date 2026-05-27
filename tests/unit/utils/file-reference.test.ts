import { describe, it, expect } from 'vitest';
import { formatFileRef, formatFileRange, parseFileRef } from '../../../src/utils/file-reference.js';

describe('file-reference', () => {
  describe('formatFileRef', () => {
    it('should format file path with line number', () => {
      expect(formatFileRef('src/index.ts', 42)).toBe('src/index.ts:42');
    });

    it('should handle nested paths', () => {
      expect(formatFileRef('src/utils/logger.ts', 1)).toBe('src/utils/logger.ts:1');
    });
  });

  describe('formatFileRange', () => {
    it('should format file path with line range', () => {
      expect(formatFileRange('src/index.ts', 10, 20)).toBe('src/index.ts:10-20');
    });
  });

  describe('parseFileRef', () => {
    it('should parse file:line reference', () => {
      const result = parseFileRef('src/index.ts:42');
      expect(result).toEqual({ filePath: 'src/index.ts', line: 42 });
    });

    it('should parse file-only reference', () => {
      const result = parseFileRef('src/index.ts');
      expect(result).toEqual({ filePath: 'src/index.ts', line: undefined });
    });

    it('should return null for empty string', () => {
      const result = parseFileRef('');
      expect(result).toBeNull();
    });
  });
});
