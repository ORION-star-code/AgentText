import type { ParsedSymbol } from '../parser/types.js';

export interface GraphNode {
  id: string;
  symbol: ParsedSymbol;
  filePath: string;
  outgoingEdges: GraphEdge[];
  incomingEdges: GraphEdge[];
}

export interface GraphEdge {
  type: 'calls' | 'imports' | 'extends' | 'implements' | 'uses';
  source: string;
  target: string;
  line: number;
}

export interface SerializedGraph {
  nodes: SerializedNode[];
  edges: GraphEdge[];
}

export interface SerializedNode {
  id: string;
  symbol: ParsedSymbol;
  filePath: string;
}

export function createNodeId(filePath: string, symbolName: string): string {
  return `${filePath}::${symbolName}`;
}
