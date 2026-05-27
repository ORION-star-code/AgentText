import type { Issue } from './types.js';
import type { CodeGraph } from '../graph/code-graph.js';
import { logger } from '../utils/logger.js';

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

    const keywords = this.extractKeywords(issue.title + ' ' + issue.body);
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

  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
      'on', 'with', 'at', 'by', 'from', 'as', 'into', 'about', 'like',
      'through', 'after', 'over', 'between', 'out', 'against', 'during',
      'without', 'before', 'under', 'around', 'among', 'and', 'or', 'but',
      'not', 'no', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'each',
      'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such',
      'than', 'too', 'very', 'just', 'because', 'if', 'when', 'where', 'how',
      'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'it',
      'its', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'him', 'his',
      'she', 'her', 'they', 'them', 'their',
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w))
      .filter((w, i, arr) => arr.indexOf(w) === i);
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
