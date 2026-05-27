import type { PrDiff, ChangedFile, AnalysisReport } from './types.js';
import type { CodeGraph } from '../graph/code-graph.js';
import { logger } from '../utils/logger.js';

export class PrAnalyzer {
  private graph: CodeGraph;

  constructor(graph: CodeGraph) {
    this.graph = graph;
  }

  analyzePr(diff: PrDiff): AnalysisReport {
    logger.info(`Analyzing PR #${diff.prNumber}: ${diff.title}`);

    const changedFiles = diff.changedFiles.map((f) => f.filename);
    const impactedSymbols = this.findImpactedSymbols(diff.changedFiles);
    const impactedFiles = this.findImpactedFiles(impactedSymbols);

    const riskLevel = this.assessRisk(diff.changedFiles, impactedFiles);

    const summary = this.buildSummary(diff, impactedSymbols, impactedFiles);
    const details = this.buildDetails(diff.changedFiles, impactedSymbols);

    return {
      summary,
      riskLevel,
      changedFiles,
      impactedFiles,
      details,
    };
  }

  private findImpactedSymbols(files: ChangedFile[]): string[] {
    const symbols: string[] = [];

    for (const file of files) {
      const nodes = this.graph.getNodesInFile(file.filename);
      for (const node of nodes) {
        symbols.push(node.id);
      }
    }

    return [...new Set(symbols)];
  }

  private findImpactedFiles(symbolIds: string[]): string[] {
    const files = new Set<string>();

    for (const id of symbolIds) {
      const node = this.graph.getNode(id);
      if (!node) continue;

      // Find all symbols that call this symbol
      const incoming = this.graph.getIncoming(id, 'calls');
      for (const edge of incoming) {
        const caller = this.graph.getNode(edge.source);
        if (caller) {
          files.add(caller.filePath);
        }
      }

      // Find all symbols imported by this symbol
      const outgoing = this.graph.getOutgoing(id, 'imports');
      for (const edge of outgoing) {
        const target = this.graph.getNode(edge.target);
        if (target) {
          files.add(target.filePath);
        }
      }
    }

    return [...files];
  }

  private assessRisk(changedFiles: ChangedFile[], impactedFiles: string[]): 'low' | 'medium' | 'high' {
    const totalChanges = changedFiles.reduce((sum, f) => sum + f.additions + f.deletions, 0);

    if (impactedFiles.length > 10 || totalChanges > 500) return 'high';
    if (impactedFiles.length > 3 || totalChanges > 100) return 'medium';
    return 'low';
  }

  private buildSummary(diff: PrDiff, impactedSymbols: string[], impactedFiles: string[]): string {
    const lines = [
      `PR #${diff.prNumber}: ${diff.title}`,
      `Changed files: ${diff.changedFiles.length}`,
      `Impacted symbols: ${impactedSymbols.length}`,
      `Potentially impacted files: ${impactedFiles.length}`,
    ];
    return lines.join('\n');
  }

  private buildDetails(files: ChangedFile[], impactedSymbols: string[]): string {
    const lines: string[] = ['## Changed Files'];

    for (const file of files) {
      lines.push(`- ${file.filename} (${file.status}: +${file.additions}/-${file.deletions})`);
    }

    if (impactedSymbols.length > 0) {
      lines.push('\n## Impacted Symbols');
      for (const id of impactedSymbols.slice(0, 20)) {
        const node = this.graph.getNode(id);
        if (node) {
          lines.push(`- ${node.symbol.name} (${node.filePath}:${node.symbol.startLine})`);
        }
      }
    }

    return lines.join('\n');
  }
}
