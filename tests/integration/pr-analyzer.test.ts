import { describe, it, expect } from 'vitest';
import { PrAnalyzer } from '../../src/github/pr-analyzer.js';
import { CodeGraph } from '../../src/graph/code-graph.js';
import type { ParsedSymbol } from '../../src/parser/types.js';
import type { PrDiff } from '../../src/github/types.js';

function makeSymbol(name: string, line = 1): ParsedSymbol {
  return { name, kind: 'function', startLine: line, endLine: line + 10, startColumn: 0, isExported: true };
}

describe('PrAnalyzer', () => {
  it('should analyze a simple PR', () => {
    const graph = new CodeGraph();
    graph.addNode('src/user.ts::getUser', makeSymbol('getUser', 10), 'src/user.ts');
    graph.addNode('src/auth.ts::login', makeSymbol('login', 20), 'src/auth.ts');

    graph.addEdge({
      type: 'calls',
      source: 'src/auth.ts::login',
      target: 'src/user.ts::getUser',
      line: 25,
    });

    const diff: PrDiff = {
      prNumber: 42,
      title: 'Fix user authentication',
      body: 'Fixed a bug in the login flow',
      changedFiles: [
        {
          filename: 'src/user.ts',
          status: 'modified',
          additions: 5,
          deletions: 2,
        },
      ],
    };

    const analyzer = new PrAnalyzer(graph);
    const report = analyzer.analyzePr(diff);

    expect(report.riskLevel).toBe('low');
    expect(report.changedFiles).toContain('src/user.ts');
    expect(report.summary).toContain('PR #42');
  });

  it('should assess higher risk for more changes', () => {
    const graph = new CodeGraph();
    const diff: PrDiff = {
      prNumber: 100,
      title: 'Major refactor',
      body: '',
      changedFiles: Array.from({ length: 20 }, (_, i) => ({
        filename: `src/file${i}.ts`,
        status: 'modified' as const,
        additions: 50,
        deletions: 30,
      })),
    };

    const analyzer = new PrAnalyzer(graph);
    const report = analyzer.analyzePr(diff);

    expect(report.riskLevel).toBe('high');
    expect(report.changedFiles).toHaveLength(20);
  });
});
