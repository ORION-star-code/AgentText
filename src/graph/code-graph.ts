import type { GraphNode, GraphEdge, SerializedGraph, SerializedNode } from './types.js';

export class CodeGraph {
  private nodes = new Map<string, GraphNode>();
  private edges: GraphEdge[] = [];
  private fileIndex = new Map<string, Set<string>>();

  addNode(id: string, symbol: GraphNode['symbol'], filePath: string): void {
    const node: GraphNode = {
      id,
      symbol,
      filePath,
      outgoingEdges: [],
      incomingEdges: [],
    };
    this.nodes.set(id, node);

    if (!this.fileIndex.has(filePath)) {
      this.fileIndex.set(filePath, new Set());
    }
    this.fileIndex.get(filePath)!.add(id);
  }

  addEdge(edge: GraphEdge): void {
    this.edges.push(edge);

    const sourceNode = this.nodes.get(edge.source);
    const targetNode = this.nodes.get(edge.target);

    if (sourceNode) {
      sourceNode.outgoingEdges.push(edge);
    }
    if (targetNode) {
      targetNode.incomingEdges.push(edge);
    }
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  getNodesInFile(filePath: string): GraphNode[] {
    const ids = this.fileIndex.get(filePath);
    if (!ids) return [];
    return [...ids].map((id) => this.nodes.get(id)!).filter(Boolean);
  }

  getOutgoing(nodeId: string, edgeType?: string): GraphEdge[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    if (edgeType) {
      return node.outgoingEdges.filter((e) => e.type === edgeType);
    }
    return node.outgoingEdges;
  }

  getIncoming(nodeId: string, edgeType?: string): GraphEdge[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    if (edgeType) {
      return node.incomingEdges.filter((e) => e.type === edgeType);
    }
    return node.incomingEdges;
  }

  searchByName(name: string): GraphNode[] {
    const lower = name.toLowerCase();
    const results: GraphNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.symbol.name.toLowerCase().includes(lower)) {
        results.push(node);
      }
    }
    return results;
  }

  getAllNodes(): GraphNode[] {
    return [...this.nodes.values()];
  }

  getAllEdges(): GraphEdge[] {
    return [...this.edges];
  }

  nodeCount(): number {
    return this.nodes.size;
  }

  edgeCount(): number {
    return this.edges.length;
  }

  toJSON(): SerializedGraph {
    const serializedNodes: SerializedNode[] = [];
    for (const node of this.nodes.values()) {
      serializedNodes.push({
        id: node.id,
        symbol: node.symbol,
        filePath: node.filePath,
      });
    }
    return {
      nodes: serializedNodes,
      edges: [...this.edges],
    };
  }

  static fromJSON(data: SerializedGraph): CodeGraph {
    const graph = new CodeGraph();
    for (const node of data.nodes) {
      graph.addNode(node.id, node.symbol, node.filePath);
    }
    for (const edge of data.edges) {
      graph.addEdge(edge);
    }
    return graph;
  }
}
