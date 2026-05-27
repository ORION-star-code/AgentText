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

vi.mock('../../../src/analysis/call-chain-analysis.js', () => ({
  CallChainAnalysis: vi.fn().mockImplementation(() => ({
    analyzeSymbol: vi.fn().mockResolvedValue('Call chain analysis result'),
  })),
}));

describe('callchainCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasIndex.mockResolvedValue(true);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should throw when no index exists', async () => {
    mockHasIndex.mockResolvedValue(false);
    const { callchainCommand } = await import('../../../src/cli/callchain-command.js');
    await expect(callchainCommand('foo')).rejects.toThrow('No index found');
  });

  it('should run call chain analysis', async () => {
    const { callchainCommand } = await import('../../../src/cli/callchain-command.js');
    await callchainCommand('foo');
    expect(mockLoadIndex).toHaveBeenCalled();
  });
});
