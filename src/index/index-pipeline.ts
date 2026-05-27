import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { FileDiscovery } from '../core/file-discovery.js';
import { ParserRegistry } from '../parser/parser-registry.js';
import { SymbolResolver } from '../graph/symbol-resolver.js';
import { IndexStore } from './index-store.js';
import { logger } from '../utils/logger.js';
import type { ParsedFile } from '../parser/types.js';
import type { CodeInsightConfig } from '../core/config.js';

export class IndexPipeline {
  private discovery: FileDiscovery;
  private parserRegistry: ParserRegistry;
  private resolver: SymbolResolver;
  private store: IndexStore;

  constructor() {
    this.discovery = new FileDiscovery();
    this.parserRegistry = new ParserRegistry();
    this.resolver = new SymbolResolver();
    this.store = new IndexStore();
  }

  async run(repoPath: string, config: CodeInsightConfig): Promise<void> {
    const indexPath = resolve(repoPath, config.indexPath);

    logger.info(`Starting indexing pipeline for ${repoPath}`);

    // Step 1: Discover files
    logger.info('Step 1/4: Discovering files...');
    const files = await this.discovery.discover(repoPath, {
      maxFiles: config.maxFiles,
      maxFileSizeBytes: config.maxFileSizeBytes,
    });
    logger.info(`Found ${files.length} files`);

    // Step 2: Parse files
    logger.info('Step 2/4: Parsing files...');
    const parsedFiles: ParsedFile[] = [];
    let parseErrors = 0;

    for (const file of files) {
      const parser = this.parserRegistry.getParser(file.language);
      if (!parser) {
        logger.debug(`No parser for ${file.language}: ${file.relativePath}`);
        continue;
      }

      try {
        const content = await readFile(file.absolutePath, 'utf-8');
        const parsed = await parser.parse(file.relativePath, content);
        parsedFiles.push(parsed);
      } catch (error) {
        parseErrors++;
        logger.debug(`Failed to parse ${file.relativePath}: ${error}`);
      }
    }
    logger.info(`Parsed ${parsedFiles.length} files (${parseErrors} errors)`);

    // Step 3: Build graph
    logger.info('Step 3/4: Building code graph...');
    const graph = this.resolver.resolve(parsedFiles);

    // Step 4: Save index
    logger.info('Step 4/4: Saving index...');
    await this.store.save(graph, indexPath, repoPath);

    logger.info('Indexing complete!');
  }

  async loadIndex(repoPath: string, config: CodeInsightConfig) {
    const indexPath = resolve(repoPath, config.indexPath);
    return this.store.load(indexPath);
  }

  async hasIndex(repoPath: string, config: CodeInsightConfig): Promise<boolean> {
    const indexPath = resolve(repoPath, config.indexPath);
    return this.store.exists(indexPath);
  }
}
