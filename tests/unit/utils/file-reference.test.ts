import { describe, it, expect } from 'vitest';
import { formatFileRef } from '../../../src/utils/file-reference.js';

describe('file-reference', () => {
  describe('formatFileRef', () => {
    it('should format file path with line number', () => {
      expect(formatFileRef('src/index.ts', 42)).toBe('src/index.ts:42');
    });

    it('should handle nested paths', () => {
      expect(formatFileRef('src/utils/logger.ts', 1)).toBe('src/utils/logger.ts:1');
    });
  });
});
