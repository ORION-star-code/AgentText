import type { ParsedFile, ParsedCall } from '../parser/types.js';
import { CodeGraph } from './code-graph.js';
import { createNodeId } from './types.js';
import { logger } from '../utils/logger.js';

export class SymbolResolver {
  resolve(files: ParsedFile[]): CodeGraph {
    const graph = new CodeGraph();
    const exportMap = new Map<string, string[]>();

    // Pass 1: Create nodes for all symbols
    for (const file of files) {
      for (const symbol of file.symbols) {
        const nodeId = createNodeId(file.filePath, symbol.name);
        graph.addNode(nodeId, symbol, file.filePath);
      }

      // Build export map: symbol name -> [file paths that export it]
      for (const exp of file.exports) {
        const existing = exportMap.get(exp.name) ?? [];
        existing.push(file.filePath);
        exportMap.set(exp.name, existing);
      }
    }

    // Pass 2: Create edges from imports
    for (const file of files) {
      for (const imp of file.imports) {
        for (const specifier of imp.specifiers) {
          // Find the target file that exports this symbol
          const targetFiles = exportMap.get(specifier);
          if (!targetFiles || targetFiles.length === 0) continue;

          // For each symbol in the current file that uses this import
          const fileNodes = graph.getNodesInFile(file.filePath);
          for (const node of fileNodes) {
            // Check if this node references the imported symbol
            if (this.symbolReferencesImport(node.symbol.name, specifier, file, imp.source)) {
              for (const targetFile of targetFiles) {
                const targetNodeId = createNodeId(targetFile, specifier);
                if (graph.getNode(targetNodeId)) {
                  graph.addEdge({
                    type: 'imports',
                    source: node.id,
                    target: targetNodeId,
                    line: imp.startLine,
                  });
                }
              }
            }
          }

          // Also create file-level import edges
          for (const targetFile of targetFiles) {
            const targetNodeId = createNodeId(targetFile, specifier);
            if (graph.getNode(targetNodeId)) {
              // Create edges for all symbols that might use this import
              for (const call of file.callExpressions) {
                if (call.calleeName === specifier) {
                  const callerNodeId = createNodeId(
                    file.filePath,
                    this.getTopLevelSymbol(call, file),
                  );
                  if (graph.getNode(callerNodeId)) {
                    graph.addEdge({
                      type: 'calls',
                      source: callerNodeId,
                      target: targetNodeId,
                      line: call.line,
                    });
                  }
                }
              }
            }
          }
        }
      }
    }

    // Pass 3: Resolve call expressions within the same file
    for (const file of files) {
      const symbolNames = new Set(file.symbols.map((s) => s.name));

      for (const call of file.callExpressions) {
        if (!symbolNames.has(call.calleeName)) continue;

        const callerNodeId = createNodeId(file.filePath, this.getTopLevelSymbol(call, file));
        const calleeNodeId = createNodeId(file.filePath, call.calleeName);

        if (
          callerNodeId !== calleeNodeId &&
          graph.getNode(callerNodeId) &&
          graph.getNode(calleeNodeId)
        ) {
          graph.addEdge({
            type: 'calls',
            source: callerNodeId,
            target: calleeNodeId,
            line: call.line,
          });
        }
      }
    }

    logger.info(`Built graph: ${graph.nodeCount()} nodes, ${graph.edgeCount()} edges`);
    return graph;
  }

  private symbolReferencesImport(
    _symbolName: string,
    importSpecifier: string,
    file: ParsedFile,
    _source: string,
  ): boolean {
    return file.callExpressions.some((c) => c.calleeName === importSpecifier);
  }

  private getTopLevelSymbol(call: ParsedCall, file: ParsedFile): string {
    // The callerName from the parser is already "ClassName.methodName" or "functionName"
    // We need to get the top-level symbol (class or function)
    const parts = call.callerName.split('.');
    const topLevel = parts[0];

    // Check if it exists as a symbol
    if (file.symbols.some((s) => s.name === topLevel)) {
      return topLevel;
    }

    // Fallback: try the full callerName
    if (file.symbols.some((s) => s.name === call.callerName)) {
      return call.callerName;
    }

    // Try the first part for method calls
    return topLevel;
  }
}
