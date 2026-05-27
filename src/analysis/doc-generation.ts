import type { CodeGraph } from '../graph/code-graph.js';
import type { DocType, CodeContext } from '../llm/types.js';
import { ClaudeClient } from '../llm/claude-client.js';
import type { ClaudeConfig } from '../llm/claude-client.js';
import { PromptBuilder } from '../llm/prompt-builder.js';
import { buildContextFromFiles } from '../utils/context-builder.js';
import { logger } from '../utils/logger.js';

export class DocGeneration {
  private graph: CodeGraph;
  private claude: ClaudeClient;
  private promptBuilder: PromptBuilder;

  constructor(graph: CodeGraph, claudeConfig?: Partial<ClaudeConfig>) {
    this.graph = graph;
    this.claude = new ClaudeClient(claudeConfig);
    this.promptBuilder = new PromptBuilder();
  }

  async generate(docType: DocType, rootPath: string): Promise<string> {
    logger.info(`Generating ${docType} documentation...`);

    const context = await this.buildContext(rootPath);
    const systemPrompt = this.promptBuilder.getSystemPrompt();
    const userPrompt = this.promptBuilder.buildDocGenerationPrompt(docType, context);

    const response = await this.claude.analyze(systemPrompt, userPrompt, context);
    return response.answer;
  }

  generateArchitectureDiagram(): string {
    const nodes = this.graph.getAllNodes();
    const edges = this.graph.getAllEdges();

    // Group nodes by file
    const fileGroups = new Map<string, typeof nodes>();
    for (const node of nodes) {
      const existing = fileGroups.get(node.filePath) ?? [];
      existing.push(node);
      fileGroups.set(node.filePath, existing);
    }

    // Generate Mermaid flowchart
    const lines: string[] = ['graph TD'];

    // Create subgraphs for files
    let subgraphIndex = 0;
    const nodeIdMap = new Map<string, string>();

    for (const [file, fileNodes] of fileGroups) {
      const subgraphId = `file${subgraphIndex}`;
      lines.push(`  subgraph ${subgraphId}["${file}"]`);

      for (const node of fileNodes) {
        const mermaidId = `n${nodeIdMap.size}`;
        nodeIdMap.set(node.id, mermaidId);
        const label = node.symbol.name.replace(/"/g, "'");
        lines.push(`    ${mermaidId}["${label}"]`);
      }

      lines.push('  end');
      subgraphIndex++;
    }

    // Add edges
    for (const edge of edges) {
      const sourceId = nodeIdMap.get(edge.source);
      const targetId = nodeIdMap.get(edge.target);
      if (sourceId && targetId) {
        const label = edge.type === 'calls' ? 'calls' : '';
        lines.push(`  ${sourceId} -->|${label}| ${targetId}`);
      }
    }

    return lines.join('\n');
  }

  private async buildContext(rootPath: string): Promise<CodeContext> {
    const nodes = this.graph.getAllNodes();
    const fileSet = new Set(nodes.map((n) => n.filePath));
    return buildContextFromFiles([...fileSet], rootPath, { maxLines: 50 });
  }
}
