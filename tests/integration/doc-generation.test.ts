import { describe, it, expect } from 'vitest';
import { DocGeneration } from '../../src/analysis/doc-generation.js';
import { CodeGraph } from '../../src/graph/code-graph.js';
import type { ParsedSymbol } from '../../src/parser/types.js';

function makeSymbol(name: string, line = 1): ParsedSymbol {
  return { name, kind: 'function', startLine: line, endLine: line + 10, startColumn: 0, isExported: true };
}

describe('DocGeneration', () => {
  it('should generate architecture diagram', () => {
    const graph = new CodeGraph();
    graph.addNode('src/a.ts::foo', makeSymbol('foo', 1), 'src/a.ts');
    graph.addNode('src/b.ts::bar', makeSymbol('bar', 10), 'src/b.ts');
    graph.addEdge({ type: 'calls', source: 'src/a.ts::foo', target: 'src/b.ts::bar', line: 5 });

    const docGen = new DocGeneration(graph);
    const diagram = docGen.generateArchitectureDiagram();

    expect(diagram).toContain('graph TD');
    expect(diagram).toContain('foo');
    expect(diagram).toContain('bar');
    expect(diagram).toContain('calls');
  });

  it('should handle empty graph', () => {
    const graph = new CodeGraph();
    const docGen = new DocGeneration(graph);
    const diagram = docGen.generateArchitectureDiagram();

    expect(diagram).toContain('graph TD');
  });

  it('should group nodes by file in diagram', () => {
    const graph = new CodeGraph();
    graph.addNode('src/a.ts::X', makeSymbol('X', 1), 'src/a.ts');
    graph.addNode('src/a.ts::Y', makeSymbol('Y', 10), 'src/a.ts');
    graph.addNode('src/b.ts::Z', makeSymbol('Z', 1), 'src/b.ts');

    const docGen = new DocGeneration(graph);
    const diagram = docGen.generateArchitectureDiagram();

    expect(diagram).toContain('src/a.ts');
    expect(diagram).toContain('src/b.ts');
    expect(diagram).toContain('subgraph');
  });
});
