import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeGraph } from '../../../src/graph/code-graph.js';

vi.mock('../../../src/llm/claude-client.js', () => ({
  ClaudeClient: vi.fn().mockImplementation(() => ({
    analyze: vi.fn().mockResolvedValue({
      answer: 'Bug found at src/auth.ts:42',
      citations: [],
      tokensUsed: { input: 100, output: 50 },
    }),
  })),
}));

vi.mock('../../../src/utils/context-builder.js', () => ({
  buildContextFromFiles: vi.fn().mockResolvedValue({
    files: [{ path: 'src/auth.ts', startLine: 1, endLine: 20, content: 'code', relevanceScore: 0.9 }],
    maxContextTokens: 1000,
  }),
}));

describe('BugLocalization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeGraph() {
    const graph = new CodeGraph();
    graph.addNode('src/auth.ts::login', {
      name: 'login', kind: 'function', startLine: 10, endLine: 20, startColumn: 0, isExported: true,
    }, 'src/auth.ts');
    return graph;
  }

  it('should localize bug with relevant files', async () => {
    const { BugLocalization } = await import('../../../src/analysis/bug-localization.js');
    const localization = new BugLocalization(makeGraph());
    const result = await localization.localize('TypeError in login function', '/repo');
    expect(result).toContain('Bug found');
  });

  it('should find files by keyword match', async () => {
    const { BugLocalization } = await import('../../../src/analysis/bug-localization.js');
    const graph = makeGraph();
    const localization = new BugLocalization(graph);
    await localization.localize('login error', '/repo');
    // The mock context builder should have been called
    const { buildContextFromFiles } = await import('../../../src/utils/context-builder.js');
    expect(buildContextFromFiles).toHaveBeenCalled();
  });

  it('should accept custom Claude config', async () => {
    const { BugLocalization } = await import('../../../src/analysis/bug-localization.js');
    const localization = new BugLocalization(makeGraph(), { model: 'claude-haiku-4-5-20251001' });
    const result = await localization.localize('error', '/repo');
    expect(result).toBeDefined();
  });
});
