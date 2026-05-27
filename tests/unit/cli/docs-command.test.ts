import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeFile, mkdir } from 'node:fs/promises';

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

vi.mock('../../../src/analysis/doc-generation.js', () => ({
  DocGeneration: vi.fn().mockImplementation(() => ({
    generate: vi.fn().mockResolvedValue('# Generated Doc'),
    generateArchitectureDiagram: vi.fn().mockReturnValue('graph TD\n  A-->B'),
  })),
}));

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
  };
});

describe('docsCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasIndex.mockResolvedValue(true);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should throw for invalid doc type', async () => {
    const { docsCommand } = await import('../../../src/cli/docs-command.js');
    await expect(docsCommand('invalid')).rejects.toThrow('Invalid doc type');
  });

  it('should throw when no index exists', async () => {
    mockHasIndex.mockResolvedValue(false);
    const { docsCommand } = await import('../../../src/cli/docs-command.js');
    await expect(docsCommand('readme')).rejects.toThrow('No index found');
  });

  it('should generate readme', async () => {
    const { docsCommand } = await import('../../../src/cli/docs-command.js');
    await docsCommand('readme');
    expect(mockLoadIndex).toHaveBeenCalled();
  });

  it('should generate architecture diagram', async () => {
    const { docsCommand } = await import('../../../src/cli/docs-command.js');
    await docsCommand('architecture');
    expect(mockLoadIndex).toHaveBeenCalled();
  });
});
