import type { CodeGraph } from '../graph/code-graph.js';
import type { CodeContext } from '../llm/types.js';
import { ClaudeClient } from '../llm/claude-client.js';
import { PromptBuilder } from '../llm/prompt-builder.js';
import { readFile } from 'node:fs/promises';
import { logger } from '../utils/logger.js';

export class BugLocalization {
  private graph: CodeGraph;
  private claude: ClaudeClient;
  private promptBuilder: PromptBuilder;

  constructor(graph: CodeGraph) {
    this.graph = graph;
    this.claude = new ClaudeClient();
    this.promptBuilder = new PromptBuilder();
  }

  async localize(errorDescription: string, rootPath: string): Promise<string> {
    logger.info('Localizing bug...');

    const keywords = this.extractErrorKeywords(errorDescription);
    const relevantPaths = this.findRelevantFiles(keywords);
    const context = await this.buildContext(relevantPaths, rootPath);

    const systemPrompt = this.promptBuilder.getSystemPrompt();
    const userPrompt = this.promptBuilder.buildBugLocalizationPrompt(errorDescription, context);

    const response = await this.claude.analyze(systemPrompt, userPrompt, context);
    return response.answer;
  }

  private extractErrorKeywords(error: string): string[] {
    const keywords: string[] = [];

    // Extract file paths
    const fileMatches = error.match(/[\w./\-]+\.\w+/g);
    if (fileMatches) keywords.push(...fileMatches);

    // Extract class/function names from stack traces
    const stackMatches = error.match(/at\s+(\w+)\s*\(/g);
    if (stackMatches) {
      for (const match of stackMatches) {
        const name = match.replace(/at\s+/, '').replace(/\(/, '').trim();
        if (name) keywords.push(name);
      }
    }

    // Extract general keywords
    const words = error.toLowerCase().split(/\s+/);
    const stopWords = new Set(['error', 'typeerror', 'referenceerror', 'syntaxerror', 'at', 'the', 'a', 'an', 'is', 'in', 'of']);
    for (const word of words) {
      if (word.length > 3 && !stopWords.has(word)) {
        keywords.push(word);
      }
    }

    return [...new Set(keywords)];
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

  private async buildContext(filePaths: string[], rootPath: string): Promise<CodeContext> {
    const files = [];
    let totalChars = 0;
    const maxChars = 400000; // ~100k tokens

    for (const filePath of filePaths) {
      if (totalChars >= maxChars) break;

      try {
        const content = await readFile(`${rootPath}/${filePath}`, 'utf-8');
        const lines = content.split('\n');
        const truncated = lines.slice(0, 80).join('\n');

        files.push({
          path: filePath,
          startLine: 1,
          endLine: Math.min(lines.length, 80),
          content: truncated,
          relevanceScore: 1.0,
        });
        totalChars += truncated.length;
      } catch {
        // Skip unreadable files
      }
    }

    return { files, maxContextTokens: 100000 };
  }
}
