import { describe, it, expect } from 'vitest';
import { SymbolResolver } from '../../../src/graph/symbol-resolver.js';
import type { ParsedFile } from '../../../src/parser/types.js';

function makeFile(overrides: Partial<ParsedFile> & { filePath: string }): ParsedFile {
  return {
    language: 'typescript',
    symbols: [],
    imports: [],
    exports: [],
    callExpressions: [],
    ...overrides,
  };
}

describe('SymbolResolver', () => {
  it('should create nodes for all symbols', () => {
    const resolver = new SymbolResolver();
    const files: ParsedFile[] = [
      makeFile({
        filePath: 'src/a.ts',
        symbols: [
          { name: 'foo', kind: 'function', startLine: 1, endLine: 5, startColumn: 0, isExported: true },
          { name: 'Bar', kind: 'class', startLine: 7, endLine: 20, startColumn: 0, isExported: true },
        ],
      }),
    ];

    const graph = resolver.resolve(files);
    expect(graph.nodeCount()).toBe(2);
    expect(graph.getNode('src/a.ts::foo')).toBeDefined();
    expect(graph.getNode('src/a.ts::Bar')).toBeDefined();
  });

  it('should create import edges', () => {
    const resolver = new SymbolResolver();
    const files: ParsedFile[] = [
      makeFile({
        filePath: 'src/a.ts',
        symbols: [{ name: 'foo', kind: 'function', startLine: 1, endLine: 5, startColumn: 0, isExported: true }],
        exports: [{ name: 'foo', kind: 'named', startLine: 1 }],
      }),
      makeFile({
        filePath: 'src/b.ts',
        symbols: [{ name: 'bar', kind: 'function', startLine: 1, endLine: 5, startColumn: 0, isExported: true }],
        imports: [{ source: './a', specifiers: ['foo'], isDefault: false, startLine: 1 }],
        callExpressions: [{ callerName: 'bar', calleeName: 'foo', line: 3 }],
      }),
    ];

    const graph = resolver.resolve(files);
    expect(graph.edgeCount()).toBeGreaterThan(0);
  });

  it('should create call edges within same file', () => {
    const resolver = new SymbolResolver();
    const files: ParsedFile[] = [
      makeFile({
        filePath: 'src/a.ts',
        symbols: [
          { name: 'caller', kind: 'function', startLine: 1, endLine: 10, startColumn: 0, isExported: true },
          { name: 'helper', kind: 'function', startLine: 12, endLine: 15, startColumn: 0, isExported: false },
        ],
        callExpressions: [{ callerName: 'caller', calleeName: 'helper', line: 5 }],
      }),
    ];

    const graph = resolver.resolve(files);
    const edges = graph.getOutgoing('src/a.ts::caller');
    const callEdge = edges.find((e) => e.type === 'calls' && e.target === 'src/a.ts::helper');
    expect(callEdge).toBeDefined();
  });

  it('should handle empty files', () => {
    const resolver = new SymbolResolver();
    const graph = resolver.resolve([]);
    expect(graph.nodeCount()).toBe(0);
    expect(graph.edgeCount()).toBe(0);
  });

  it('should handle files with no symbols', () => {
    const resolver = new SymbolResolver();
    const graph = resolver.resolve([makeFile({ filePath: 'src/empty.ts' })]);
    expect(graph.nodeCount()).toBe(0);
  });
});
