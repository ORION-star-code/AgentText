import { describe, it, expect } from 'vitest';
import { CodeGraph } from '../../../src/graph/code-graph.js';
import { ImpactAnalyzer } from '../../../src/graph/impact-analyzer.js';
import type { ParsedSymbol } from '../../../src/parser/types.js';

function makeSymbol(name: string, line = 1): ParsedSymbol {
  return { name, kind: 'function', startLine: line, endLine: line + 10, startColumn: 0, isExported: true };
}

describe('ImpactAnalyzer', () => {
  it('should find direct impact', () => {
    const graph = new CodeGraph();
    graph.addNode('a.ts::getUser', makeSymbol('getUser', 10), 'a.ts');
    graph.addNode('a.ts::login', makeSymbol('login', 20), 'a.ts');
    graph.addNode('a.ts::register', makeSymbol('register', 30), 'a.ts');

    graph.addEdge({ type: 'calls', source: 'a.ts::login', target: 'a.ts::getUser', line: 25 });
    graph.addEdge({ type: 'calls', source: 'a.ts::register', target: 'a.ts::getUser', line: 35 });

    const analyzer = new ImpactAnalyzer(graph);
    const result = analyzer.analyze(['a.ts']);

    expect(result.changedSymbols.length).toBeGreaterThan(0);
    expect(result.directImpact.length).toBeGreaterThan(0);
  });

  it('should find transitive impact', () => {
    const graph = new CodeGraph();
    graph.addNode('a.ts::A', makeSymbol('A', 1), 'a.ts');
    graph.addNode('a.ts::B', makeSymbol('B', 10), 'a.ts');
    graph.addNode('a.ts::C', makeSymbol('C', 20), 'a.ts');

    graph.addEdge({ type: 'calls', source: 'a.ts::B', target: 'a.ts::A', line: 5 });
    graph.addEdge({ type: 'calls', source: 'a.ts::C', target: 'a.ts::B', line: 15 });

    const analyzer = new ImpactAnalyzer(graph);
    const result = analyzer.analyze(['a.ts']);

    expect(result.affectedFiles.length).toBeGreaterThan(0);
  });

  it('should format impact report', () => {
    const graph = new CodeGraph();
    graph.addNode('a.ts::foo', makeSymbol('foo', 1), 'a.ts');

    const analyzer = new ImpactAnalyzer(graph);
    const result = analyzer.analyze(['a.ts']);
    const formatted = analyzer.formatImpact(result);

    expect(formatted).toContain('Impact Analysis');
    expect(formatted).toContain('Affected Files');
  });

  it('should handle empty changes', () => {
    const graph = new CodeGraph();
    const analyzer = new ImpactAnalyzer(graph);
    const result = analyzer.analyze([]);

    expect(result.changedSymbols).toHaveLength(0);
    expect(result.directImpact).toHaveLength(0);
    expect(result.affectedFiles).toHaveLength(0);
  });
});
