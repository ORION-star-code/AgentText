import { resolve } from 'node:path';
import { loadConfig } from '../core/config.js';
import { logger } from '../utils/logger.js';
import type { CodeInsightConfig } from '../core/config.js';
import { IndexPipeline } from '../index/index-pipeline.js';
import type { IndexMetadata } from '../index/index-store.js';
import type { CodeGraph } from '../graph/code-graph.js';

export interface LoadedIndex {
  graph: CodeGraph;
  config: CodeInsightConfig;
  rootPath: string;
  metadata: IndexMetadata;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- commander passes varying arg types
export function withErrorHandling(label: string, fn: (...args: any[]) => Promise<void>) {
  return async (...args: any[]) => {
    try {
      await fn(...args);
    } catch (error) {
      logger.error(label, error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  };
}

export async function loadIndexOrThrow(repoPath?: string): Promise<LoadedIndex> {
  const rootPath = repoPath ? resolve(repoPath) : process.cwd();
  const config = loadConfig(rootPath);
  const pipeline = new IndexPipeline();

  if (!(await pipeline.hasIndex(rootPath, config))) {
    throw new Error('No index found. Run "codeinsight index <repo>" first.');
  }

  const { graph, metadata } = await pipeline.loadIndex(rootPath, config);
  return { graph, config, rootPath, metadata };
}
