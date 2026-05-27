import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeGraph } from '../../../src/graph/code-graph.js';

vi.mock('../../../src/llm/claude-client.js', () => ({
  ClaudeClient: vi.fn().mockImplementation(() => ({
    analyze: vi.fn().mockResolvedValue({
      answer: 'Call chain analysis for foo',
      citations: [],
      tokensUsed: { input: 100, output: 50 },
    }),
  })),
}));

describe('CallChainAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeGraph() {
    const graph = new CodeGraph();
    graph.addNode('src/a.ts::foo', {
      name: 'foo', kind: 'function', startLine: 1, endLine: 10, startColumn: 0, isExported: true,
    }, 'src/a.ts');
    graph.addNode('src/a.ts::bar', {
      name: 'bar', kind: 'function', startLine: 12, endLine: 20, startColumn: 0, isExported: true,
    }, 'src/a.ts');
    graph.addEdge({ type: 'calls', source: 'src/a.ts::foo', target: 'src/a.ts::bar', line: 5 });
    return graph;
  }

  it('should return message when symbol not found', async () => {
    const { CallChainAnalysis } = await import('../../../src/analysis/call-chain-analysis.js');
    const analysis = new CallChainAnalysis(makeGraph());
    const result = await analysis.analyzeSymbol('nonexistent');
    expect(result).toContain('No symbol found');
  });

  it('should analyze existing symbol', async () => {
    const { CallChainAnalysis } = await import('../../../src/analysis/call-chain-analysis.js');
    const analysis = new CallChainAnalysis(makeGraph());
    const result = await analysis.analyzeSymbol('foo');
    expect(result).toContain('Call chain analysis');
  });

  it('should accept custom Claude config', async () => {
    const { CallChainAnalysis } = await import('../../../src/analysis/call-chain-analysis.js');
    const analysis = new CallChainAnalysis(makeGraph(), { model: 'claude-haiku-4-5-20251001' });
    const result = await analysis.analyzeSymbol('foo');
    expect(result).toBeDefined();
  });
});
