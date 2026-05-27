import { describe, it, expect } from 'vitest';
import {
  MAX_CONTEXT_CHARS,
  MAX_CONTEXT_TOKENS,
  DEFAULT_MAX_LINES,
  DEFAULT_FILE_BATCH_SIZE,
  MAX_IMPACT_DEPTH,
  MAX_SEARCH_RESULTS,
  MAX_LINKED_SYMBOLS,
  RISK_THRESHOLDS,
} from '../../../src/utils/constants.js';

describe('Constants', () => {
  it('should export MAX_CONTEXT_CHARS', () => {
    expect(MAX_CONTEXT_CHARS).toBe(400_000);
  });

  it('should export MAX_CONTEXT_TOKENS', () => {
    expect(MAX_CONTEXT_TOKENS).toBe(100_000);
  });

  it('should export DEFAULT_MAX_LINES', () => {
    expect(DEFAULT_MAX_LINES).toBe(100);
  });

  it('should export DEFAULT_FILE_BATCH_SIZE', () => {
    expect(DEFAULT_FILE_BATCH_SIZE).toBe(16);
  });

  it('should export MAX_IMPACT_DEPTH', () => {
    expect(MAX_IMPACT_DEPTH).toBe(3);
  });

  it('should export MAX_SEARCH_RESULTS', () => {
    expect(MAX_SEARCH_RESULTS).toBe(20);
  });

  it('should export MAX_LINKED_SYMBOLS', () => {
    expect(MAX_LINKED_SYMBOLS).toBe(20);
  });

  it('should export RISK_THRESHOLDS', () => {
    expect(RISK_THRESHOLDS.high.impactedFiles).toBe(10);
    expect(RISK_THRESHOLDS.high.totalChanges).toBe(500);
    expect(RISK_THRESHOLDS.medium.impactedFiles).toBe(3);
    expect(RISK_THRESHOLDS.medium.totalChanges).toBe(100);
  });
});
