import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/core/config.js', () => ({
  loadConfig: vi.fn().mockReturnValue({
    model: 'test',
    maxTokens: 1000,
    temperature: 0,
    maxFiles: 100,
    maxFileSizeBytes: 10000,
    languages: ['typescript'],
    indexPath: '.codeinsight/index.json',
    logLevel: 'info',
  }),
}));

const mockLoadIndex = vi.fn().mockResolvedValue({
  graph: { searchByName: vi.fn().mockReturnValue([]) },
  metadata: { nodeCount: 10, fileCount: 3 },
});
const mockHasIndex = vi.fn().mockResolvedValue(true);

vi.mock('../../../src/index/index-pipeline.js', () => ({
  IndexPipeline: vi.fn().mockImplementation(() => ({
    hasIndex: mockHasIndex,
    loadIndex: mockLoadIndex,
  })),
}));

const mockAnalyze = vi.fn().mockResolvedValue({
  answer: 'The answer',
  citations: [{ filePath: 'src/a.ts', line: 10, snippet: 'code' }],
  tokensUsed: { input: 100, output: 50 },
});

vi.mock('../../../src/llm/claude-client.js', () => ({
  ClaudeClient: vi.fn().mockImplementation(() => ({
    analyze: mockAnalyze,
  })),
}));

const mockBuildAnalysisPrompt = vi.fn().mockReturnValue('prompt');

vi.mock('../../../src/llm/prompt-builder.js', () => ({
  PromptBuilder: vi.fn().mockImplementation(() => ({
    getSystemPrompt: vi.fn().mockReturnValue('system'),
    buildAnalysisPrompt: mockBuildAnalysisPrompt,
    buildContextFromFiles: vi.fn().mockResolvedValue({ files: [], maxContextTokens: 1000 }),
  })),
}));

describe('askCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasIndex.mockResolvedValue(true);
    mockAnalyze.mockResolvedValue({
      answer: 'The answer',
      citations: [{ filePath: 'src/a.ts', line: 10, snippet: 'code' }],
      tokensUsed: { input: 100, output: 50 },
    });
    mockBuildAnalysisPrompt.mockReturnValue('prompt');
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should throw when no index exists', async () => {
    mockHasIndex.mockResolvedValue(false);
    const { askCommand } = await import('../../../src/cli/ask-command.js');
    await expect(askCommand('question')).rejects.toThrow('No index found');
  });

  it('should call Claude and output answer', async () => {
    const { askCommand } = await import('../../../src/cli/ask-command.js');
    await askCommand('How does auth work?');
    expect(mockLoadIndex).toHaveBeenCalled();

    // Verify PromptBuilder.buildAnalysisPrompt was called with the question
    expect(mockBuildAnalysisPrompt).toHaveBeenCalled();
    expect(mockBuildAnalysisPrompt.mock.calls[0][0]).toBe('How does auth work?');

    // Verify ClaudeClient.analyze was called
    expect(mockAnalyze).toHaveBeenCalled();
    const [systemPrompt, userPrompt] = mockAnalyze.mock.calls[0];
    expect(typeof systemPrompt).toBe('string');
    expect(typeof userPrompt).toBe('string');
  });
});
