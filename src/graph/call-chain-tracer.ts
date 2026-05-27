import type { CodeGraph } from './code-graph.js';
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
    const startNode = this.graph.getNode(symbolId);
    if (!startNode) {
      return { start: this.makeChainNode(symbolId, 0), chain: [], truncated: false };
    }

    const start = this.makeChainNode(symbolId, 0);
    const chains: CallChainNode[][] = [];
    const visited = new Set<string>();

    this.dfsCallees(symbolId, 0, [], chains, visited, maxDepth ?? this.maxDepth);

    return {
      start,
      chain: chains,
      truncated: chains.some((c) => c.length >= (maxDepth ?? this.maxDepth)),
    };
  }

  traceCallers(symbolId: string, maxDepth?: number): CallChain {
    const startNode = this.graph.getNode(symbolId);
    if (!startNode) {
      return { start: this.makeChainNode(symbolId, 0), chain: [], truncated: false };
    }

    const start = this.makeChainNode(symbolId, 0);
    const chains: CallChainNode[][] = [];
    const visited = new Set<string>();

    this.dfsCallers(symbolId, 0, [], chains, visited, maxDepth ?? this.maxDepth);

    return {
      start,
      chain: chains,
      truncated: chains.some((c) => c.length >= (maxDepth ?? this.maxDepth)),
    };
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

  private dfsCallees(
    nodeId: string,
    depth: number,
    currentPath: CallChainNode[],
    allChains: CallChainNode[][],
    visited: Set<string>,
    maxDepth: number,
  ): void {
    if (depth >= maxDepth) {
      allChains.push([...currentPath]);
      return;
    }

    visited.add(nodeId);
    const outgoing = this.graph.getOutgoing(nodeId, 'calls');

    if (outgoing.length === 0) {
      if (currentPath.length > 0) {
        allChains.push([...currentPath]);
      }
      visited.delete(nodeId);
      return;
    }

    for (const edge of outgoing) {
      if (visited.has(edge.target)) continue;

      const targetNode = this.graph.getNode(edge.target);
      if (!targetNode) continue;

      const chainNode: CallChainNode = {
        symbolId: edge.target,
        symbolName: targetNode.symbol.name,
        filePath: targetNode.filePath,
        line: edge.line,
        depth: depth + 1,
      };

      currentPath.push(chainNode);
      this.dfsCallees(edge.target, depth + 1, currentPath, allChains, visited, maxDepth);
      currentPath.pop();
    }

    visited.delete(nodeId);

    if (outgoing.length === 0 && currentPath.length > 0) {
      allChains.push([...currentPath]);
    }
  }

  private dfsCallers(
    nodeId: string,
    depth: number,
    currentPath: CallChainNode[],
    allChains: CallChainNode[][],
    visited: Set<string>,
    maxDepth: number,
  ): void {
    if (depth >= maxDepth) {
      allChains.push([...currentPath]);
      return;
    }

    visited.add(nodeId);
    const incoming = this.graph.getIncoming(nodeId, 'calls');

    if (incoming.length === 0) {
      if (currentPath.length > 0) {
        allChains.push([...currentPath]);
      }
      visited.delete(nodeId);
      return;
    }

    for (const edge of incoming) {
      if (visited.has(edge.source)) continue;

      const sourceNode = this.graph.getNode(edge.source);
      if (!sourceNode) continue;

      const chainNode: CallChainNode = {
        symbolId: edge.source,
        symbolName: sourceNode.symbol.name,
        filePath: sourceNode.filePath,
        line: edge.line,
        depth: depth + 1,
      };

      currentPath.push(chainNode);
      this.dfsCallers(edge.source, depth + 1, currentPath, allChains, visited, maxDepth);
      currentPath.pop();
    }

    visited.delete(nodeId);

    if (incoming.length === 0 && currentPath.length > 0) {
      allChains.push([...currentPath]);
    }
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
