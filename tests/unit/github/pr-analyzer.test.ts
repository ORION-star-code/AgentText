import { describe, it, expect } from 'vitest';
import { PrAnalyzer } from '../../../src/github/pr-analyzer.js';
import { CodeGraph } from '../../../src/graph/code-graph.js';
import type { ParsedSymbol } from '../../../src/parser/types.js';
import type { PrDiff } from '../../../src/github/types.js';

function makeSymbol(name: string, line = 1): ParsedSymbol {
  return {
    name,
    kind: 'function',
    startLine: line,
    endLine: line + 10,
    startColumn: 0,
    isExported: true,
  };
}

describe('PrAnalyzer', () => {
  describe('risk assessment', () => {
    it('should assess low risk for small changes with few impacted files', () => {
      const graph = new CodeGraph();
      graph.addNode('src/a.ts::foo', makeSymbol('foo'), 'src/a.ts');

      const diff: PrDiff = {
        prNumber: 1,
        title: 'Small fix',
        body: '',
        changedFiles: [{ filename: 'src/a.ts', status: 'modified', additions: 5, deletions: 2 }],
      };

      const analyzer = new PrAnalyzer(graph);
      const report = analyzer.analyzePr(diff);
      expect(report.riskLevel).toBe('low');
    });

    it('should assess medium risk when impacted files > 3', () => {
      const graph = new CodeGraph();
      // Create 5 files with callers into the changed file
      graph.addNode('src/core.ts::handler', makeSymbol('handler', 10), 'src/core.ts');
      for (let i = 1; i <= 5; i++) {
        const file = `src/mod${i}.ts`;
        graph.addNode(`${file}::caller${i}`, makeSymbol(`caller${i}`, 1), file);
        graph.addEdge({
          type: 'calls',
          source: `${file}::caller${i}`,
          target: 'src/core.ts::handler',
          line: 5,
        });
      }

      const diff: PrDiff = {
        prNumber: 2,
        title: 'Core change',
        body: '',
        changedFiles: [
          { filename: 'src/core.ts', status: 'modified', additions: 10, deletions: 5 },
        ],
      };

      const analyzer = new PrAnalyzer(graph);
      const report = analyzer.analyzePr(diff);
      expect(report.riskLevel).toBe('medium');
      expect(report.impactedFiles.length).toBeGreaterThan(3);
    });

    it('should assess medium risk when total changes > 100', () => {
      const graph = new CodeGraph();

      const diff: PrDiff = {
        prNumber: 3,
        title: 'Big change',
        body: '',
        changedFiles: [{ filename: 'src/a.ts', status: 'modified', additions: 60, deletions: 50 }],
      };

      const analyzer = new PrAnalyzer(graph);
      const report = analyzer.analyzePr(diff);
      expect(report.riskLevel).toBe('medium');
    });

    it('should assess high risk when impacted files > 10', () => {
      const graph = new CodeGraph();
      graph.addNode('src/core.ts::core', makeSymbol('core', 1), 'src/core.ts');
      for (let i = 1; i <= 12; i++) {
        const file = `src/f${i}.ts`;
        graph.addNode(`${file}::fn${i}`, makeSymbol(`fn${i}`, 1), file);
        graph.addEdge({
          type: 'calls',
          source: `${file}::fn${i}`,
          target: 'src/core.ts::core',
          line: 5,
        });
      }

      const diff: PrDiff = {
        prNumber: 4,
        title: 'Critical change',
        body: '',
        changedFiles: [
          { filename: 'src/core.ts', status: 'modified', additions: 10, deletions: 5 },
        ],
      };

      const analyzer = new PrAnalyzer(graph);
      const report = analyzer.analyzePr(diff);
      expect(report.riskLevel).toBe('high');
    });
  });

  describe('import edge impact analysis', () => {
    it('should trace import edges to find impacted files', () => {
      const graph = new CodeGraph();
      graph.addNode('src/utils.ts::helper', makeSymbol('helper', 5), 'src/utils.ts');
      graph.addNode('src/app.ts::main', makeSymbol('main', 1), 'src/app.ts');

      // app.ts imports from utils.ts (outgoing import from changed file)
      graph.addEdge({
        type: 'imports',
        source: 'src/app.ts::main',
        target: 'src/utils.ts::helper',
        line: 1,
      });

      const diff: PrDiff = {
        prNumber: 5,
        title: 'Utility change',
        body: '',
        changedFiles: [{ filename: 'src/app.ts', status: 'modified', additions: 3, deletions: 1 }],
      };

      const analyzer = new PrAnalyzer(graph);
      const report = analyzer.analyzePr(diff);

      // utils.ts should appear as impacted via import edge
      expect(report.impactedFiles).toContain('src/utils.ts');
    });

    it('should trace call edges to find impacted files', () => {
      const graph = new CodeGraph();
      graph.addNode('src/auth.ts::login', makeSymbol('login', 10), 'src/auth.ts');
      graph.addNode('src/api.ts::handleLogin', makeSymbol('handleLogin', 20), 'src/api.ts');

      // api.ts calls auth.ts:login (incoming call to changed file)
      graph.addEdge({
        type: 'calls',
        source: 'src/api.ts::handleLogin',
        target: 'src/auth.ts::login',
        line: 25,
      });

      const diff: PrDiff = {
        prNumber: 6,
        title: 'Auth change',
        body: '',
        changedFiles: [{ filename: 'src/auth.ts', status: 'modified', additions: 8, deletions: 3 }],
      };

      const analyzer = new PrAnalyzer(graph);
      const report = analyzer.analyzePr(diff);

      expect(report.impactedFiles).toContain('src/api.ts');
    });
  });

  describe('empty diff handling', () => {
    it('should handle PR with no changed files', () => {
      const graph = new CodeGraph();
      const diff: PrDiff = {
        prNumber: 7,
        title: 'Empty PR',
        body: '',
        changedFiles: [],
      };

      const analyzer = new PrAnalyzer(graph);
      const report = analyzer.analyzePr(diff);

      expect(report.riskLevel).toBe('low');
      expect(report.changedFiles).toHaveLength(0);
      expect(report.impactedFiles).toHaveLength(0);
      expect(report.summary).toContain('PR #7');
    });
  });
});
