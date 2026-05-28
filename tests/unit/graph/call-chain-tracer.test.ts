import { describe, it, expect } from 'vitest';
import { CodeGraph } from '../../../src/graph/code-graph.js';
import { CallChainTracer } from '../../../src/graph/call-chain-tracer.js';
import type { ParsedSymbol } from '../../../src/parser/types.js';

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

describe('CallChainTracer', () => {
  it('should trace callees', () => {
    const graph = new CodeGraph();
    graph.addNode('a.ts::A', makeSymbol('A', 1), 'a.ts');
    graph.addNode('a.ts::B', makeSymbol('B', 10), 'a.ts');
    graph.addNode('a.ts::C', makeSymbol('C', 20), 'a.ts');

    graph.addEdge({ type: 'calls', source: 'a.ts::A', target: 'a.ts::B', line: 5 });
    graph.addEdge({ type: 'calls', source: 'a.ts::B', target: 'a.ts::C', line: 15 });

    const tracer = new CallChainTracer(graph);
    const chain = tracer.traceCallees('a.ts::A');

    expect(chain.start.symbolName).toBe('A');
    expect(chain.chain.length).toBeGreaterThan(0);
  });

  it('should trace callers', () => {
    const graph = new CodeGraph();
    graph.addNode('a.ts::A', makeSymbol('A', 1), 'a.ts');
    graph.addNode('a.ts::B', makeSymbol('B', 10), 'a.ts');
    graph.addNode('a.ts::C', makeSymbol('C', 20), 'a.ts');

    graph.addEdge({ type: 'calls', source: 'a.ts::A', target: 'a.ts::B', line: 5 });
    graph.addEdge({ type: 'calls', source: 'a.ts::B', target: 'a.ts::C', line: 15 });

    const tracer = new CallChainTracer(graph);
    const chain = tracer.traceCallers('a.ts::C');

    expect(chain.start.symbolName).toBe('C');
    expect(chain.chain.length).toBeGreaterThan(0);
  });

  it('should handle missing symbols', () => {
    const graph = new CodeGraph();
    const tracer = new CallChainTracer(graph);
    const chain = tracer.traceCallees('nonexistent');

    expect(chain.chain).toHaveLength(0);
  });

  it('should respect max depth', () => {
    const graph = new CodeGraph();
    for (let i = 0; i < 20; i++) {
      graph.addNode(`a.ts::F${i}`, makeSymbol(`F${i}`, i * 10), 'a.ts');
    }
    for (let i = 0; i < 19; i++) {
      graph.addEdge({ type: 'calls', source: `a.ts::F${i}`, target: `a.ts::F${i + 1}`, line: i });
    }

    const tracer = new CallChainTracer(graph, 3);
    const chain = tracer.traceCallees('a.ts::F0');

    expect(chain.truncated).toBe(true);
  });

  it('should format chain as markdown', () => {
    const graph = new CodeGraph();
    graph.addNode('a.ts::A', makeSymbol('A', 1), 'a.ts');
    graph.addNode('a.ts::B', makeSymbol('B', 10), 'a.ts');
    graph.addEdge({ type: 'calls', source: 'a.ts::A', target: 'a.ts::B', line: 5 });

    const tracer = new CallChainTracer(graph);
    const chain = tracer.traceCallees('a.ts::A');
    const formatted = tracer.formatChain(chain);

    expect(formatted).toContain('Call Chain');
    expect(formatted).toContain('A');
  });

  it('should not infinite loop on circular dependencies (A->B->C->A)', () => {
    const graph = new CodeGraph();
    graph.addNode('a.ts::A', makeSymbol('A', 1), 'a.ts');
    graph.addNode('a.ts::B', makeSymbol('B', 10), 'a.ts');
    graph.addNode('a.ts::C', makeSymbol('C', 20), 'a.ts');

    // Create cycle: A -> B -> C -> A
    graph.addEdge({ type: 'calls', source: 'a.ts::A', target: 'a.ts::B', line: 5 });
    graph.addEdge({ type: 'calls', source: 'a.ts::B', target: 'a.ts::C', line: 15 });
    graph.addEdge({ type: 'calls', source: 'a.ts::C', target: 'a.ts::A', line: 25 });

    const tracer = new CallChainTracer(graph);
    const chain = tracer.traceCallees('a.ts::A');

    // Should terminate without infinite loop
    expect(chain.start.symbolName).toBe('A');
    expect(chain.chain).toBeDefined();
    // Each chain path should not contain duplicate nodes (cycle was broken)
    for (const path of chain.chain) {
      const ids = path.map((n) => n.symbolId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    }
  });

  it('should not infinite loop on self-referencing node', () => {
    const graph = new CodeGraph();
    graph.addNode('a.ts::recurse', makeSymbol('recurse', 1), 'a.ts');
    graph.addEdge({ type: 'calls', source: 'a.ts::recurse', target: 'a.ts::recurse', line: 5 });

    const tracer = new CallChainTracer(graph);
    const chain = tracer.traceCallees('a.ts::recurse');

    // Should terminate — self-reference is a cycle
    expect(chain.chain).toBeDefined();
    for (const path of chain.chain) {
      expect(path.every((n) => n.symbolId !== 'a.ts::recurse')).toBe(true);
    }
  });
});
