import { describe, it, expect } from 'vitest';
import { ParserRegistry } from '../../../src/parser/parser-registry.js';

describe('ParserRegistry', () => {
  it('should register TypeScriptParser by default', () => {
    const registry = new ParserRegistry();
    const parser = registry.getParser('typescript');
    expect(parser).toBeDefined();
  });

  it('should return undefined for unsupported language', () => {
    const registry = new ParserRegistry();
    const parser = registry.getParser('python');
    expect(parser).toBeUndefined();
  });

  it('should support javascript with TypeScriptParser', () => {
    const registry = new ParserRegistry();
    const parser = registry.getParser('javascript');
    expect(parser).toBeDefined();
  });

  it('should list supported languages', () => {
    const registry = new ParserRegistry();
    const languages = registry.getSupportedLanguages();
    expect(languages).toContain('typescript');
    expect(languages).toContain('javascript');
  });

  it('should allow registering custom parsers', () => {
    const registry = new ParserRegistry();
    const mockParser = {
      parse: async () => ({ filePath: '', language: 'python' as const, symbols: [], imports: [], exports: [], callExpressions: [] }),
      supports: (lang: string) => lang === 'python',
    };
    registry.register(mockParser);
    expect(registry.getParser('python')).toBe(mockParser);
  });
});
