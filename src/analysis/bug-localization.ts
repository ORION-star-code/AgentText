import type { CodeGraph } from '../graph/code-graph.js';
import type { CodeContext } from '../llm/types.js';
import { ClaudeClient } from '../llm/claude-client.js';
import type { ClaudeConfig } from '../llm/claude-client.js';
import { PromptBuilder } from '../llm/prompt-builder.js';
import { buildContextFromFiles } from '../utils/context-builder.js';
import { extractKeywords } from '../utils/keyword-extractor.js';
import { logger } from '../utils/logger.js';

export class BugLocalization {
  private graph: CodeGraph;
  private claude: ClaudeClient;
  private promptBuilder: PromptBuilder;

  constructor(graph: CodeGraph, claudeConfig?: Partial<ClaudeConfig>) {
    this.graph = graph;
    this.claude = new ClaudeClient(claudeConfig);
    this.promptBuilder = new PromptBuilder();
  }

  async localize(errorDescription: string, rootPath: string): Promise<string> {
    logger.info('Localizing bug...');

    const keywords = extractKeywords(errorDescription, {
      extractFilePatterns: true,
      extractStackTraceSymbols: true,
    });
    const relevantPaths = this.findRelevantFiles(keywords);
    const context = await buildContextFromFiles(relevantPaths, rootPath, {
      maxLines: 80,
    });

    const systemPrompt = this.promptBuilder.getSystemPrompt();
    const userPrompt = this.promptBuilder.buildBugLocalizationPrompt(errorDescription, context);

    const response = await this.claude.analyze(systemPrompt, userPrompt, context);
    return response.answer;
  }

  private findRelevantFiles(keywords: string[]): string[] {
    const files = new Set<string>();

    for (const keyword of keywords) {
      // Direct file path
      if (keyword.includes('/') || keyword.includes('\\')) {
        files.add(keyword);
        continue;
      }

      // Search by symbol name
      const nodes = this.graph.searchByName(keyword);
      for (const node of nodes) {
        files.add(node.filePath);
      }
    }

    return [...files].slice(0, 15);
  }

}
