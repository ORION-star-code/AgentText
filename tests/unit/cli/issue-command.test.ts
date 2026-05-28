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
    repoOwner: 'testowner',
    repoName: 'testrepo',
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
    getIssue: vi.fn().mockResolvedValue({
      number: 1,
      title: 'Bug',
      body: 'Something broke',
      labels: ['bug'],
      state: 'open',
      url: '',
    }),
  })),
}));

vi.mock('../../../src/github/issue-linker.js', () => ({
  IssueLinker: vi.fn().mockImplementation(() => ({
    linkIssue: vi.fn().mockReturnValue({
      issue: { number: 1, title: 'Bug', body: '', labels: [], state: 'open', url: '' },
      relevantSymbols: [{ id: 'a.ts::foo', name: 'foo', filePath: 'a.ts', line: 10 }],
      keywords: ['bug'],
    }),
  })),
}));

describe('issueCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasIndex.mockResolvedValue(true);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should throw when no index exists', async () => {
    mockHasIndex.mockResolvedValue(false);
    const { issueCommand } = await import('../../../src/cli/issue-command.js');
    await expect(issueCommand('1')).rejects.toThrow('No index found');
  });

  it('should throw for invalid issue number', async () => {
    const { issueCommand } = await import('../../../src/cli/issue-command.js');
    await expect(issueCommand('abc')).rejects.toThrow('Invalid issue number');
  });

  it('should throw for negative issue number', async () => {
    const { issueCommand } = await import('../../../src/cli/issue-command.js');
    await expect(issueCommand('-1')).rejects.toThrow('Must be a positive integer');
  });

  it('should throw for zero issue number', async () => {
    const { issueCommand } = await import('../../../src/cli/issue-command.js');
    await expect(issueCommand('0')).rejects.toThrow('Must be a positive integer');
  });

  it('should throw for float issue number', async () => {
    const { issueCommand } = await import('../../../src/cli/issue-command.js');
    await expect(issueCommand('1.5')).rejects.toThrow('Must be a positive integer');
  });

  it('should analyze a valid issue', async () => {
    const { IssueLinker } = await import('../../../src/github/issue-linker.js');
    const { issueCommand } = await import('../../../src/cli/issue-command.js');
    await issueCommand('1');
    expect(mockLoadIndex).toHaveBeenCalled();

    // Verify IssueLinker.linkIssue was called
    const linkerInstance = (IssueLinker as unknown as vi.Mock).mock.results[0].value;
    expect(linkerInstance.linkIssue).toHaveBeenCalled();
    const passedIssue = linkerInstance.linkIssue.mock.calls[0][0];
    expect(passedIssue.number).toBe(1);
    expect(passedIssue.title).toBe('Bug');
  });
});
