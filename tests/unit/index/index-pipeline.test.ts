import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all dependencies
vi.mock('../../../src/core/file-discovery.js', () => ({
  FileDiscovery: vi.fn().mockImplementation(() => ({
    discover: vi.fn().mockResolvedValue([
      { relativePath: 'src/a.ts', absolutePath: '/repo/src/a.ts', language: 'typescript', size: 100 },
    ]),
  })),
}));

vi.mock('../../../src/parser/parser-registry.js', () => ({
  ParserRegistry: vi.fn().mockImplementation(() => ({
    getParser: vi.fn().mockReturnValue({
      parse: vi.fn().mockResolvedValue({
        filePath: 'src/a.ts',
        language: 'typescript',
        symbols: [{ name: 'foo', kind: 'function', startLine: 1, endLine: 5, startColumn: 0, isExported: true }],
        imports: [],
        exports: [],
        callExpressions: [],
      }),
    }),
  })),
}));

vi.mock('../../../src/graph/symbol-resolver.js', () => ({
  SymbolResolver: vi.fn().mockImplementation(() => ({
    resolve: vi.fn().mockReturnValue({
      nodeCount: () => 1,
      edgeCount: () => 0,
    }),
  })),
}));

vi.mock('../../../src/index/index-store.js', () => ({
  IndexStore: vi.fn().mockImplementation(() => ({
    save: vi.fn().mockResolvedValue(undefined),
    load: vi.fn().mockResolvedValue({ graph: {}, metadata: { nodeCount: 1, fileCount: 1 } }),
    exists: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    readFile: vi.fn().mockResolvedValue('export function foo() {}'),
  };
});

describe('IndexPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should run the indexing pipeline', async () => {
    const { IndexPipeline } = await import('../../../src/index/index-pipeline.js');
    const pipeline = new IndexPipeline();
    const config = {
      model: 'test',
      maxTokens: 1000,
      temperature: 0,
      maxFiles: 100,
      maxFileSizeBytes: 10000,
      languages: ['typescript'],
      indexPath: '.codeinsight/index.json',
      logLevel: 'info' as const,
    };

    await pipeline.run('/repo', config);
    // If no error thrown, pipeline completed
    expect(true).toBe(true);
  });

  it('should check if index exists', async () => {
    const { IndexPipeline } = await import('../../../src/index/index-pipeline.js');
    const pipeline = new IndexPipeline();
    const config = {
      model: 'test',
      maxTokens: 1000,
      temperature: 0,
      maxFiles: 100,
      maxFileSizeBytes: 10000,
      languages: ['typescript'],
      indexPath: '.codeinsight/index.json',
      logLevel: 'info' as const,
    };

    const exists = await pipeline.hasIndex('/repo', config);
    expect(exists).toBe(true);
  });

  it('should load index', async () => {
    const { IndexPipeline } = await import('../../../src/index/index-pipeline.js');
    const pipeline = new IndexPipeline();
    const config = {
      model: 'test',
      maxTokens: 1000,
      temperature: 0,
      maxFiles: 100,
      maxFileSizeBytes: 10000,
      languages: ['typescript'],
      indexPath: '.codeinsight/index.json',
      logLevel: 'info' as const,
    };

    const result = await pipeline.loadIndex('/repo', config);
    expect(result).toBeDefined();
  });
});
