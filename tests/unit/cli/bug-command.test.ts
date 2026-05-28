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

const mockHasIndex = vi.fn().mockResolvedValue(true);
const mockLoadIndex = vi.fn().mockResolvedValue({ graph: {} });

vi.mock('../../../src/index/index-pipeline.js', () => ({
  IndexPipeline: vi.fn().mockImplementation(() => ({
    hasIndex: mockHasIndex,
    loadIndex: mockLoadIndex,
  })),
}));

vi.mock('../../../src/analysis/bug-localization.js', () => ({
  BugLocalization: vi.fn().mockImplementation(() => ({
    localize: vi.fn().mockResolvedValue('Bug found at src/auth.ts:42'),
  })),
}));

describe('bugCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasIndex.mockResolvedValue(true);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should throw when no index exists', async () => {
    mockHasIndex.mockResolvedValue(false);
    const { bugCommand } = await import('../../../src/cli/bug-command.js');
    await expect(bugCommand('error')).rejects.toThrow('No index found');
  });

  it('should run bug localization', async () => {
    const { BugLocalization } = await import('../../../src/analysis/bug-localization.js');
    const { bugCommand } = await import('../../../src/cli/bug-command.js');
    await bugCommand('TypeError in login');
    expect(mockLoadIndex).toHaveBeenCalled();

    // Verify BugLocalization.localize was called with the description
    const localizationInstance = (BugLocalization as unknown as vi.Mock).mock.results[0].value;
    expect(localizationInstance.localize).toHaveBeenCalledWith(
      'TypeError in login',
      expect.any(String),
    );
  });
});
