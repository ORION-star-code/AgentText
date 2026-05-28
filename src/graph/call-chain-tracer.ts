import type { CodeGraph } from './code-graph.js';
import type { GraphEdge } from './types.js';
import { formatFileRef } from '../utils/file-reference.js';

export interface CallChainNode {
  symbolId: string;
  symbolName: string;
  filePath: string;
  line: number;
  depth: number;
}

export interface CallChain {
  start: CallChainNode;
  chain: CallChainNode[][];
  truncated: boolean;
}

export class CallChainTracer {
  private graph: CodeGraph;
  private maxDepth: number;

  constructor(graph: CodeGraph, maxDepth = 10) {
    this.graph = graph;
    this.maxDepth = maxDepth;
  }

  traceCallees(symbolId: string, maxDepth?: number): CallChain {
    return this.trace(
      symbolId,
      (nodeId) => this.graph.getOutgoing(nodeId, 'calls'),
      (edge) => edge.target,
      maxDepth,
    );
  }

  traceCallers(symbolId: string, maxDepth?: number): CallChain {
    return this.trace(
      symbolId,
      (nodeId) => this.graph.getIncoming(nodeId, 'calls'),
      (edge) => edge.source,
      maxDepth,
    );
  }

  formatChain(chain: CallChain): string {
    const lines: string[] = [
      `## Call Chain: ${chain.start.symbolName}`,
      `Starting at: ${formatFileRef(chain.start.filePath, chain.start.line)}`,
      '',
    ];

    if (chain.chain.length === 0) {
      lines.push('No call chain found.');
      return lines.join('\n');
    }

    for (let i = 0; i < chain.chain.length; i++) {
      lines.push(`### Path ${i + 1}`);
      for (const node of chain.chain[i]) {
        const indent = '  '.repeat(node.depth);
        lines.push(`${indent}- ${node.symbolName} (${formatFileRef(node.filePath, node.line)})`);
      }
      lines.push('');
    }

    if (chain.truncated) {
      lines.push('*Chain truncated at max depth*');
    }

    return lines.join('\n');
  }

  private trace(
    symbolId: string,
    getNeighbors: (nodeId: string) => GraphEdge[],
    getNeighborId: (edge: GraphEdge) => string,
    maxDepth?: number,
  ): CallChain {
    const startNode = this.graph.getNode(symbolId);
    if (!startNode) {
      return { start: this.makeChainNode(symbolId, 0), chain: [], truncated: false };
    }

    const start = this.makeChainNode(symbolId, 0);
    const chains: CallChainNode[][] = [];
    const visited = new Set<string>();
    const depth = maxDepth ?? this.maxDepth;

    this.dfs(symbolId, 0, [], chains, visited, depth, getNeighbors, getNeighborId);

    return {
      start,
      chain: chains,
      truncated: chains.some((c) => c.length >= depth),
    };
  }

  private dfs(
    nodeId: string,
    depth: number,
    currentPath: CallChainNode[],
    allChains: CallChainNode[][],
    visited: Set<string>,
    maxDepth: number,
    getNeighbors: (nodeId: string) => GraphEdge[],
    getNeighborId: (edge: GraphEdge) => string,
  ): void {
    if (depth >= maxDepth) {
      allChains.push([...currentPath]);
      return;
    }

    visited.add(nodeId);
    const edges = getNeighbors(nodeId);

    if (edges.length === 0) {
      if (currentPath.length > 0) {
        allChains.push([...currentPath]);
      }
      visited.delete(nodeId);
      return;
    }

    for (const edge of edges) {
      const neighborId = getNeighborId(edge);
      if (visited.has(neighborId)) continue;

      const neighborNode = this.graph.getNode(neighborId);
      if (!neighborNode) continue;

      const chainNode: CallChainNode = {
        symbolId: neighborId,
        symbolName: neighborNode.symbol.name,
        filePath: neighborNode.filePath,
        line: edge.line,
        depth: depth + 1,
      };

      currentPath.push(chainNode);
      this.dfs(
        neighborId,
        depth + 1,
        currentPath,
        allChains,
        visited,
        maxDepth,
        getNeighbors,
        getNeighborId,
      );
      currentPath.pop();
    }

    visited.delete(nodeId);
  }

  private makeChainNode(symbolId: string, depth: number): CallChainNode {
    const node = this.graph.getNode(symbolId);
    return {
      symbolId,
      symbolName: node?.symbol.name ?? symbolId,
      filePath: node?.filePath ?? 'unknown',
      line: node?.symbol.startLine ?? 0,
      depth,
    };
  }
}
