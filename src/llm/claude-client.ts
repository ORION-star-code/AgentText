import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';
import { extractCitations } from '../utils/citation-extractor.js';
import type { CodeContext, ClaudeResponse } from './types.js';

export interface ClaudeConfig {
  model: string;
  maxTokens: number;
  temperature: number;
}

const DEFAULT_CONFIG: ClaudeConfig = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 0.0,
};

export class ClaudeClient {
  private client: Anthropic;
  private config: ClaudeConfig;

  constructor(config?: Partial<ClaudeConfig>) {
    this.client = new Anthropic();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async analyze(systemPrompt: string, userPrompt: string, context?: CodeContext): Promise<ClaudeResponse> {
    const messages: Anthropic.MessageCreateParams['messages'] = [];

    // Build user message with context
    let fullPrompt = userPrompt;
    if (context && context.files.length > 0) {
      fullPrompt = this.buildPromptWithContext(userPrompt, context);
    }

    messages.push({ role: 'user', content: fullPrompt });

    logger.debug('Sending request to Claude', {
      model: this.config.model,
      maxTokens: this.config.maxTokens,
    });

    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: systemPrompt,
        messages,
      });

      const answer = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('\n');

      const tokensUsed = {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      };

      logger.debug('Claude response received', { tokensUsed });

      return {
        answer,
        citations: extractCitations(answer, 20),
        tokensUsed,
      };
    } catch (error) {
      logger.error('Claude API error', error);
      throw error;
    }
  }

  private buildPromptWithContext(question: string, context: CodeContext): string {
    const parts: string[] = [question, '\n\n## Relevant Code Context\n'];

    for (const file of context.files) {
      parts.push(`### ${file.path}:${file.startLine}-${file.endLine}`);
      parts.push('```');
      parts.push(file.content);
      parts.push('```\n');
    }

    if (context.graphSummary) {
      parts.push('## Graph Summary\n');
      parts.push(context.graphSummary);
    }

    return parts.join('\n');
  }

}
