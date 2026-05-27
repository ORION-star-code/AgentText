import type { CodeGraph } from './code-graph.js';
import { formatFileRef } from '../utils/file-reference.js';

export interface ImpactItem {
  symbolId: string;
  filePath: string;
  line: number;
  relationship: string;
  depth: number;
}

export interface ImpactResult {
  changedSymbols: string[];
  directImpact: ImpactItem[];
  transitiveImpact: ImpactItem[];
  affectedFiles: string[];
}

export class ImpactAnalyzer {
  private graph: CodeGraph;

  constructor(graph: CodeGraph) {
    this.graph = graph;
  }

  analyze(changedFiles: string[], changedSymbols?: string[]): ImpactResult {
    const symbols = changedSymbols ?? this.findSymbolsInFiles(changedFiles);

    const directImpact = this.findDirectImpact(symbols);
    const transitiveImpact = this.findTransitiveImpact(directImpact);

    const affectedFiles = new Set<string>();
    for (const item of [...directImpact, ...transitiveImpact]) {
      affectedFiles.add(item.filePath);
    }

    return {
      changedSymbols: symbols,
      directImpact,
      transitiveImpact,
      affectedFiles: [...affectedFiles],
    };
  }

  formatImpact(result: ImpactResult): string {
    const lines: string[] = ['## Impact Analysis', ''];

    lines.push('### Changed Symbols');
    for (const id of result.changedSymbols) {
      const node = this.graph.getNode(id);
      if (node) {
        lines.push(`- ${node.symbol.name} (${formatFileRef(node.filePath, node.symbol.startLine)})`);
      }
    }

    if (result.directImpact.length > 0) {
      lines.push('', '### Direct Impact');
      for (const item of result.directImpact) {
        lines.push(`- ${item.symbolId.split('::').pop()} (${item.relationship}, ${formatFileRef(item.filePath, item.line)})`);
      }
    }

    if (result.transitiveImpact.length > 0) {
      lines.push('', '### Transitive Impact');
      for (const item of result.transitiveImpact) {
        lines.push(`- ${item.symbolId.split('::').pop()} (${item.relationship}, depth ${item.depth})`);
      }
    }

    lines.push('', '### Affected Files');
    for (const file of result.affectedFiles) {
      lines.push(`- ${file}`);
    }

    return lines.join('\n');
  }

  private findSymbolsInFiles(files: string[]): string[] {
    const symbols: string[] = [];
    for (const file of files) {
      const nodes = this.graph.getNodesInFile(file);
      for (const node of nodes) {
        symbols.push(node.id);
      }
    }
    return symbols;
  }

  private findDirectImpact(symbolIds: string[]): ImpactItem[] {
    const impact: ImpactItem[] = [];
    const seen = new Set<string>();

    for (const id of symbolIds) {
      const incoming = this.graph.getIncoming(id);
      for (const edge of incoming) {
        if (!seen.has(edge.source)) {
          seen.add(edge.source);
          const node = this.graph.getNode(edge.source);
          if (node) {
            impact.push({
              symbolId: edge.source,
              filePath: node.filePath,
              line: edge.line,
              relationship: edge.type,
              depth: 1,
            });
          }
        }
      }
    }

    return impact;
  }

  private findTransitiveImpact(directImpact: ImpactItem[]): ImpactItem[] {
    const impact: ImpactItem[] = [];
    const visited = new Set<string>(directImpact.map((i) => i.symbolId));

    const queue = directImpact.map((i) => ({ id: i.symbolId, depth: 1 }));

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (depth > 3) continue;

      const incoming = this.graph.getIncoming(id, 'calls');
      for (const edge of incoming) {
        if (!visited.has(edge.source)) {
          visited.add(edge.source);
          const node = this.graph.getNode(edge.source);
          if (node) {
            impact.push({
              symbolId: edge.source,
              filePath: node.filePath,
              line: edge.line,
              relationship: edge.type,
              depth: depth + 1,
            });
            queue.push({ id: edge.source, depth: depth + 1 });
          }
        }
      }
    }

    return impact;
  }
}
