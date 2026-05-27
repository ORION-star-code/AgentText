import type { Issue } from './types.js';
import type { CodeGraph } from '../graph/code-graph.js';
import { logger } from '../utils/logger.js';
import { extractKeywords } from '../utils/keyword-extractor.js';

export interface IssueLink {
  issue: Issue;
  relevantSymbols: { id: string; name: string; filePath: string; line: number }[];
  keywords: string[];
}

export class IssueLinker {
  private graph: CodeGraph;

  constructor(graph: CodeGraph) {
    this.graph = graph;
  }

  linkIssue(issue: Issue): IssueLink {
    logger.info(`Linking issue #${issue.number}: ${issue.title}`);

    const keywords = extractKeywords(issue.title + ' ' + issue.body);
    const relevantSymbols = this.findRelevantSymbols(keywords);

    return {
      issue,
      relevantSymbols,
      keywords,
    };
  }

  linkIssues(issues: Issue[]): IssueLink[] {
    return issues.map((issue) => this.linkIssue(issue));
  }


  private findRelevantSymbols(keywords: string[]): IssueLink['relevantSymbols'] {
    const results: Map<string, IssueLink['relevantSymbols'][number]> = new Map();

    for (const keyword of keywords) {
      const nodes = this.graph.searchByName(keyword);
      for (const node of nodes) {
        if (!results.has(node.id)) {
          results.set(node.id, {
            id: node.id,
            name: node.symbol.name,
            filePath: node.filePath,
            line: node.symbol.startLine,
          });
        }
      }
    }

    return [...results.values()].slice(0, 20);
  }
}
