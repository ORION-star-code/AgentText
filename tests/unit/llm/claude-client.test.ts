import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

describe('ClaudeClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function createClient(config?: Record<string, unknown>) {
    const { ClaudeClient } = await import('../../../src/llm/claude-client.js');
    return new ClaudeClient(config);
  }

  describe('analyze', () => {
    it('should send request and return response', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'The answer is src/auth.ts:42' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const client = await createClient();
      const response = await client.analyze('system', 'question');

      expect(response.answer).toContain('src/auth.ts:42');
      expect(response.tokensUsed.input).toBe(100);
      expect(response.tokensUsed.output).toBe(50);
      expect(response.citations).toBeDefined();
    });

    it('should include context in prompt when provided', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Answer' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const client = await createClient();
      await client.analyze('system', 'question', {
        files: [{ path: 'src/a.ts', startLine: 1, endLine: 10, content: 'code', relevanceScore: 0.9 }],
        maxContextTokens: 1000,
      });

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('src/a.ts');
    });

    it('should handle API errors', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      const client = await createClient();
      await expect(client.analyze('system', 'question')).rejects.toThrow('API Error');
    });

    it('should use custom config', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Answer' }],
        usage: { input_tokens: 10, output_tokens: 5 },
      });

      const client = await createClient({ model: 'claude-haiku-4-5-20251001', maxTokens: 1024, temperature: 0.5 });
      await client.analyze('system', 'question');

      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.model).toBe('claude-haiku-4-5-20251001');
      expect(callArgs.max_tokens).toBe(1024);
      expect(callArgs.temperature).toBe(0.5);
    });

    it('should handle multiple text blocks', async () => {
      mockCreate.mockResolvedValue({
        content: [
          { type: 'text', text: 'Part 1' },
          { type: 'text', text: 'Part 2' },
        ],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      const client = await createClient();
      const response = await client.analyze('system', 'question');
      expect(response.answer).toBe('Part 1\nPart 2');
    });
  });
});
