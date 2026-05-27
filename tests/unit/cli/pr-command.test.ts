import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/core/config.js', () => ({
  loadConfig: vi.fn().mockReturnValue({
    model: 'test', maxTokens: 1000, temperature: 0, maxFiles: 100,
    maxFileSizeBytes: 10000, languages: ['typescript'], indexPath: '.codeinsight/index.json', logLevel: 'info',
  }),
}));

const mockHasIndex = vi.fn().mockResolvedValue(true);
const mockLoadIndex = vi.fn().mockResolvedValue({ graph: {} });

vi.mock('../../../src/index/index-pipeline.js', () => ({
  IndexPipeline: vi.fn().mockImplementation(() => ({
    hasIndex: mockHasIndex,
    loadIndex: mockLoadIndex,
  })),
}));

vi.mock('../../../src/github/github-client.js', () => ({
  GitHubClient: vi.fn().mockImplementation(() => ({
    getPrDiff: vi.fn().mockResolvedValue({
      prNumber: 1, title: 'Test PR', body: '', changedFiles: [],
    }),
  })),
}));

vi.mock('../../../src/github/pr-analyzer.js', () => ({
  PrAnalyzer: vi.fn().mockImplementation(() => ({
    analyzePr: vi.fn().mockReturnValue({
      summary: 'Safe change',
      riskLevel: 'low',
      changedFiles: [],
      impactedFiles: [],
      details: 'No impact',
    }),
  })),
}));

describe('prCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasIndex.mockResolvedValue(true);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should throw for invalid PR URL', async () => {
    const { prCommand } = await import('../../../src/cli/pr-command.js');
    await expect(prCommand('not-a-url')).rejects.toThrow('Invalid PR URL');
  });

  it('should throw when no index exists', async () => {
    mockHasIndex.mockResolvedValue(false);
    const { prCommand } = await import('../../../src/cli/pr-command.js');
    await expect(prCommand('https://github.com/owner/repo/pull/1')).rejects.toThrow('No index found');
  });

  it('should analyze a valid PR', async () => {
    const { prCommand } = await import('../../../src/cli/pr-command.js');
    await prCommand('https://github.com/owner/repo/pull/42');
    expect(mockLoadIndex).toHaveBeenCalled();
  });
});
