import type { CodeGraph } from '../graph/code-graph.js';
import { CallChainTracer } from '../graph/call-chain-tracer.js';
import { ClaudeClient } from '../llm/claude-client.js';
import type { ClaudeConfig } from '../llm/claude-client.js';
import { PromptBuilder } from '../llm/prompt-builder.js';
import { logger } from '../utils/logger.js';

export class CallChainAnalysis {
  private graph: CodeGraph;
  private tracer: CallChainTracer;
  private claude: ClaudeClient;
  private promptBuilder: PromptBuilder;

  constructor(graph: CodeGraph, claudeConfig?: Partial<ClaudeConfig>) {
    this.graph = graph;
    this.tracer = new CallChainTracer(graph);
    this.claude = new ClaudeClient(claudeConfig);
    this.promptBuilder = new PromptBuilder();
  }

  async analyzeSymbol(symbolName: string): Promise<string> {
    logger.info(`Analyzing call chain for: ${symbolName}`);

    const nodes = this.graph.searchByName(symbolName);
    if (nodes.length === 0) {
      return `No symbol found matching "${symbolName}"`;
    }

    const targetNode = nodes[0];
    const calleeChain = this.tracer.traceCallees(targetNode.id);
    const callerChain = this.tracer.traceCallers(targetNode.id);

    const formattedCallees = this.tracer.formatChain(calleeChain);
    const formattedCallers = this.tracer.formatChain({
      ...callerChain,
      start: calleeChain.start,
    });

    const systemPrompt = this.promptBuilder.getSystemPrompt();
    const userPrompt = `Analyze the call chain for "${symbolName}".

## Callees (what ${symbolName} calls)
${formattedCallees}

## Callers (what calls ${symbolName})
${formattedCallers}

Explain:
1. The role of this symbol in the codebase
2. What it calls and why
3. What calls it and in what context
4. Potential issues or improvements`;

    const response = await this.claude.analyze(systemPrompt, userPrompt);
    return response.answer;
  }
}
