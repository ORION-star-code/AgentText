import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { dirname } from 'node:path';
import { CodeGraph } from '../graph/code-graph.js';
import { logger } from '../utils/logger.js';

export interface IndexMetadata {
  repoPath: string;
  indexedAt: string;
  fileCount: number;
  nodeCount: number;
  edgeCount: number;
}

export interface StoredIndex {
  metadata: IndexMetadata;
  graph: ReturnType<CodeGraph['toJSON']>;
}

export class IndexStore {
  async save(graph: CodeGraph, indexPath: string, repoPath: string): Promise<void> {
    const index: StoredIndex = {
      metadata: {
        repoPath,
        indexedAt: new Date().toISOString(),
        fileCount: new Set(graph.getAllNodes().map((n) => n.filePath)).size,
        nodeCount: graph.nodeCount(),
        edgeCount: graph.edgeCount(),
      },
      graph: graph.toJSON(),
    };

    await mkdir(dirname(indexPath), { recursive: true });
    await writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
    logger.info(`Index saved to ${indexPath} (${index.metadata.nodeCount} nodes)`);
  }

  async load(indexPath: string): Promise<{ graph: CodeGraph; metadata: IndexMetadata }> {
    const raw = await readFile(indexPath, 'utf-8');
    const index: StoredIndex = JSON.parse(raw);
    const graph = CodeGraph.fromJSON(index.graph);
    logger.info(`Index loaded from ${indexPath} (${index.metadata.nodeCount} nodes)`);
    return { graph, metadata: index.metadata };
  }

  async exists(indexPath: string): Promise<boolean> {
    try {
      await access(indexPath);
      return true;
    } catch {
      return false;
    }
  }
}
