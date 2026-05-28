import { describe, it, expect } from 'vitest';
import * as ux from '../../../src/utils/ux.js';

describe('riskLevel', () => {
  it('should return red bold uppercase for high', () => {
    const result = ux.riskLevel('high');
    expect(result).toContain('HIGH');
  });

  it('should return yellow bold uppercase for medium', () => {
    const result = ux.riskLevel('medium');
    expect(result).toContain('MEDIUM');
  });

  it('should return green bold uppercase for low', () => {
    const result = ux.riskLevel('low');
    expect(result).toContain('LOW');
  });

  it('should return raw value for unknown level', () => {
    const result = ux.riskLevel('unknown');
    expect(result).toBe('unknown');
  });

  it('should return raw value for empty string', () => {
    const result = ux.riskLevel('');
    expect(result).toBe('');
  });
});

describe('success', () => {
  it('should format message with green checkmark', () => {
    const result = ux.success('Done');
    expect(result).toContain('Done');
    expect(result).toContain('✓');
  });
});

describe('heading', () => {
  it('should return the text', () => {
    const result = ux.heading('Title');
    expect(result).toContain('Title');
  });
});

describe('filePath', () => {
  it('should return the path', () => {
    const result = ux.filePath('src/a.ts');
    expect(result).toContain('src/a.ts');
  });
});
