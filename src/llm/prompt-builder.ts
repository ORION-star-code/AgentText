import type { CodeContext, ContextFile, DocType } from './types.js';
import { readFile } from 'node:fs/promises';

// Forward-compatible types for modules to be built in later steps
interface CallChainNode {
  symbolId: string;
  symbolName: string;
  filePath: string;
  line: number;
  depth: number;
}

interface CallChain {
  start: CallChainNode;
  chain: CallChainNode[][];
  truncated: boolean;
}

interface ImpactItem {
  symbolId: string;
  filePath: string;
  line: number;
  relationship: string;
  depth: number;
}

interface ImpactResult {
  changedSymbols: string[];
  directImpact: ImpactItem[];
  transitiveImpact: ImpactItem[];
  affectedFiles: string[];
}

const SYSTEM_PROMPT = `You are CodeInsight Agent, an AI that deeply understands code repositories.

## Rules
1. ALWAYS cite file paths with line numbers (e.g., "src/auth/login.ts:42")
2. Distinguish between confirmed facts (from code) and inferences
3. Structure output in clear markdown sections
4. If you cannot find relevant code, say so explicitly
5. Be precise and technical - this is for developers`;

export class PromptBuilder {
  getSystemPrompt(): string {
    return SYSTEM_PROMPT;
  }

  buildAnalysisPrompt(question: string, _context: CodeContext): string {
    return question;
  }

  buildCallChainPrompt(symbolName: string, chain: CallChain): string {
    return `Analyze the call chain for "${symbolName}".

## Call Chain Data
${this.formatCallChainForPrompt(chain)}

Explain:
1. What this call chain does end-to-end
2. Key decision points or branching logic
3. External dependencies or side effects
4. Potential failure points`;
  }

  buildPrImpactPrompt(diff: string, impact: ImpactResult): string {
    return `Analyze the impact of this PR change.

## Changed Files
${impact.changedSymbols.map((s: string) => `- ${s}`).join('\n')}

## Impact Analysis
### Direct Impact
${impact.directImpact.map((i: ImpactItem) => `- ${i.symbolId} (${i.relationship}, depth ${i.depth})`).join('\n')}

### Transitive Impact
${impact.transitiveImpact.map((i: ImpactItem) => `- ${i.symbolId} (${i.relationship}, depth ${i.depth})`).join('\n')}

## Affected Files
${impact.affectedFiles.map((f: string) => `- ${f}`).join('\n')}

## PR Diff
\`\`\`diff
${diff}
\`\`\`

Provide:
1. Risk assessment (low/medium/high)
2. What could break
3. Recommended testing strategy`;
  }

  buildBugLocalizationPrompt(errorDescription: string, _context: CodeContext): string {
    return `Help localize this bug:

## Error Description
${errorDescription}

Explain:
1. Most likely location of the bug (with file:line references)
2. Root cause analysis
3. How the error propagates through the call chain
4. Suggested fix approach`;
  }

  buildDocGenerationPrompt(docType: DocType, _context: CodeContext): string {
    const instructions: Record<DocType, string> = {
      readme: 'Generate a comprehensive README.md for this project. Include: project overview, features, installation, usage, architecture overview, and contributing guidelines.',
      architecture: 'Generate an architecture document with Mermaid diagrams showing: module relationships, data flow, and key design patterns.',
      api: 'Generate API documentation for all exported symbols. Include: function signatures, parameters, return types, and usage examples.',
    };

    return instructions[docType];
  }

  async buildContextFromFiles(
    filePaths: string[],
    rootPath: string,
    maxTokens: number,
  ): Promise<CodeContext> {
    const files: ContextFile[] = [];
    let totalChars = 0;
    const charsPerToken = 4;
    const maxChars = maxTokens * charsPerToken;

    for (const filePath of filePaths) {
      if (totalChars >= maxChars) break;

      try {
        const content = await readFile(`${rootPath}/${filePath}`, 'utf-8');
        const lines = content.split('\n');
        const truncated = lines.slice(0, 100).join('\n');
        const addedChars = truncated.length;

        if (totalChars + addedChars > maxChars) {
          const remaining = maxChars - totalChars;
          files.push({
            path: filePath,
            startLine: 1,
            endLine: Math.floor(remaining / (addedChars / lines.length)),
            content: truncated.slice(0, remaining),
            relevanceScore: 1.0,
          });
          break;
        }

        files.push({
          path: filePath,
          startLine: 1,
          endLine: lines.length,
          content: truncated,
          relevanceScore: 1.0,
        });
        totalChars += addedChars;
      } catch {
        // Skip unreadable files
      }
    }

    return {
      files,
      maxContextTokens: maxTokens,
    };
  }

  private formatCallChainForPrompt(chain: CallChain): string {
    const lines: string[] = [`Start: ${chain.start.symbolName} (${chain.start.filePath}:${chain.start.line})`];

    for (const path of chain.chain) {
      lines.push('---');
      for (const node of path) {
        const indent = '  '.repeat(node.depth);
        lines.push(`${indent}${node.symbolName} (${node.filePath}:${node.line})`);
      }
    }

    if (chain.truncated) {
      lines.push('... (chain truncated at max depth)');
    }

    return lines.join('\n');
  }
}
