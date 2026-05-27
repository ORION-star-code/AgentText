import { describe, it, expect } from 'vitest';
import { CodeGraph } from '../../../src/graph/code-graph.js';
import type { ParsedSymbol } from '../../../src/parser/types.js';

function makeSymbol(name: string): ParsedSymbol {
  return {
    name,
    kind: 'function',
    startLine: 1,
    endLine: 10,
    startColumn: 0,
    isExported: true,
  };
}

describe('CodeGraph', () => {
  it('should add and retrieve nodes', () => {
    const graph = new CodeGraph();
    graph.addNode('a.ts::foo', makeSymbol('foo'), 'a.ts');

    const node = graph.getNode('a.ts::foo');
    expect(node).toBeDefined();
    expect(node!.symbol.name).toBe('foo');
    expect(node!.filePath).toBe('a.ts');
  });

  it('should add and retrieve edges', () => {
    const graph = new CodeGraph();
    graph.addNode('a.ts::foo', makeSymbol('foo'), 'a.ts');
    graph.addNode('a.ts::bar', makeSymbol('bar'), 'a.ts');

    graph.addEdge({
      type: 'calls',
      source: 'a.ts::foo',
      target: 'a.ts::bar',
      line: 5,
    });

    const outgoing = graph.getOutgoing('a.ts::foo');
    expect(outgoing).toHaveLength(1);
    expect(outgoing[0].target).toBe('a.ts::bar');

    const incoming = graph.getIncoming('a.ts::bar');
    expect(incoming).toHaveLength(1);
    expect(incoming[0].source).toBe('a.ts::foo');
  });

  it('should get nodes by file', () => {
    const graph = new CodeGraph();
    graph.addNode('a.ts::foo', makeSymbol('foo'), 'a.ts');
    graph.addNode('a.ts::bar', makeSymbol('bar'), 'a.ts');
    graph.addNode('b.ts::baz', makeSymbol('baz'), 'b.ts');

    const aNodes = graph.getNodesInFile('a.ts');
    expect(aNodes).toHaveLength(2);

    const bNodes = graph.getNodesInFile('b.ts');
    expect(bNodes).toHaveLength(1);
  });

  it('should search by name', () => {
    const graph = new CodeGraph();
    graph.addNode('a.ts::getUser', makeSymbol('getUser'), 'a.ts');
    graph.addNode('a.ts::createUser', makeSymbol('createUser'), 'a.ts');
    graph.addNode('a.ts::deletePost', makeSymbol('deletePost'), 'a.ts');

    const results = graph.searchByName('user');
    expect(results).toHaveLength(2);
  });

  it('should filter edges by type', () => {
    const graph = new CodeGraph();
    graph.addNode('a.ts::foo', makeSymbol('foo'), 'a.ts');
    graph.addNode('a.ts::bar', makeSymbol('bar'), 'a.ts');

    graph.addEdge({ type: 'calls', source: 'a.ts::foo', target: 'a.ts::bar', line: 1 });
    graph.addEdge({ type: 'imports', source: 'a.ts::foo', target: 'a.ts::bar', line: 2 });

    const callEdges = graph.getOutgoing('a.ts::foo', 'calls');
    expect(callEdges).toHaveLength(1);

    const allEdges = graph.getOutgoing('a.ts::foo');
    expect(allEdges).toHaveLength(2);
  });

  it('should serialize and deserialize', () => {
    const graph = new CodeGraph();
    graph.addNode('a.ts::foo', makeSymbol('foo'), 'a.ts');
    graph.addNode('a.ts::bar', makeSymbol('bar'), 'a.ts');
    graph.addEdge({ type: 'calls', source: 'a.ts::foo', target: 'a.ts::bar', line: 5 });

    const json = graph.toJSON();
    const restored = CodeGraph.fromJSON(json);

    expect(restored.nodeCount()).toBe(2);
    expect(restored.edgeCount()).toBe(1);
    expect(restored.getNode('a.ts::foo')).toBeDefined();
    expect(restored.getOutgoing('a.ts::foo')).toHaveLength(1);
  });

  it('should count nodes and edges', () => {
    const graph = new CodeGraph();
    graph.addNode('a.ts::foo', makeSymbol('foo'), 'a.ts');
    graph.addNode('a.ts::bar', makeSymbol('bar'), 'a.ts');
    graph.addEdge({ type: 'calls', source: 'a.ts::foo', target: 'a.ts::bar', line: 1 });

    expect(graph.nodeCount()).toBe(2);
    expect(graph.edgeCount()).toBe(1);
  });
});
