import { describe, it, expect } from 'vitest';
import { PromptBuilder } from '../../../src/llm/prompt-builder.js';

describe('PromptBuilder', () => {
  const builder = new PromptBuilder();

  it('should return system prompt', () => {
    const prompt = builder.getSystemPrompt();
    expect(prompt).toContain('CodeInsight Agent');
    expect(prompt).toContain('file paths with line numbers');
  });

  it('should build analysis prompt', () => {
    const prompt = builder.buildAnalysisPrompt('How does auth work?', {
      files: [],
      maxContextTokens: 1000,
    });
    expect(prompt).toBe('How does auth work?');
  });

  it('should build PR impact prompt', () => {
    const prompt = builder.buildPrImpactPrompt('diff content', {
      changedSymbols: ['UserService.getUser'],
      directImpact: [{ symbolId: 'a.ts::foo', filePath: 'a.ts', line: 5, relationship: 'calls', depth: 1 }],
      transitiveImpact: [],
      affectedFiles: ['a.ts', 'b.ts'],
    });
    expect(prompt).toContain('UserService.getUser');
    expect(prompt).toContain('a.ts::foo');
    expect(prompt).toContain('Risk assessment');
  });

  it('should build bug localization prompt', () => {
    const prompt = builder.buildBugLocalizationPrompt('TypeError: Cannot read property', {
      files: [],
      maxContextTokens: 1000,
    });
    expect(prompt).toContain('TypeError');
    expect(prompt).toContain('file:line references');
  });

  it('should build doc generation prompts', () => {
    const readmePrompt = builder.buildDocGenerationPrompt('readme', { files: [], maxContextTokens: 1000 });
    expect(readmePrompt).toContain('README');

    const archPrompt = builder.buildDocGenerationPrompt('architecture', { files: [], maxContextTokens: 1000 });
    expect(archPrompt).toContain('Mermaid');

    const apiPrompt = builder.buildDocGenerationPrompt('api', { files: [], maxContextTokens: 1000 });
    expect(apiPrompt).toContain('API');
  });

  it('should include file list in analysis prompt when context has files', () => {
    const prompt = builder.buildAnalysisPrompt('How does auth work?', {
      files: [
        { path: 'src/auth.ts', startLine: 1, endLine: 20, content: 'code', relevanceScore: 0.9 },
        { path: 'src/user.ts', startLine: 10, endLine: 30, content: 'code', relevanceScore: 0.7 },
      ],
      maxContextTokens: 4000,
    });
    expect(prompt).toContain('How does auth work?');
    expect(prompt).toContain('src/auth.ts');
    expect(prompt).toContain('src/user.ts');
  });

  it('should include code context in bug localization prompt', () => {
    const prompt = builder.buildBugLocalizationPrompt('Error in auth', {
      files: [{ path: 'src/auth.ts', startLine: 1, endLine: 20, content: 'code', relevanceScore: 0.9 }],
      maxContextTokens: 1000,
    });
    expect(prompt).toContain('src/auth.ts');
    expect(prompt).toContain('Available Code Context');
  });

  it('should include project files in doc generation prompt', () => {
    const prompt = builder.buildDocGenerationPrompt('readme', {
      files: [{ path: 'src/index.ts', startLine: 1, endLine: 10, content: 'code', relevanceScore: 1 }],
      maxContextTokens: 1000,
    });
    expect(prompt).toContain('src/index.ts');
    expect(prompt).toContain('Project Files');
  });

  it('should build call chain prompt', () => {
    const chain = {
      start: { symbolId: 'a::foo', symbolName: 'foo', filePath: 'src/a.ts', line: 1, depth: 0 },
      chain: [
        [
          { symbolId: 'a::foo', symbolName: 'foo', filePath: 'src/a.ts', line: 1, depth: 0 },
          { symbolId: 'a::bar', symbolName: 'bar', filePath: 'src/a.ts', line: 5, depth: 1 },
        ],
      ],
      truncated: false,
    };
    const prompt = builder.buildCallChainPrompt('foo', chain);
    expect(prompt).toContain('foo');
    expect(prompt).toContain('src/a.ts:1');
    expect(prompt).toContain('bar');
  });

  it('should indicate truncation in call chain prompt', () => {
    const chain = {
      start: { symbolId: 'a::foo', symbolName: 'foo', filePath: 'src/a.ts', line: 1, depth: 0 },
      chain: [],
      truncated: true,
    };
    const prompt = builder.buildCallChainPrompt('foo', chain);
    expect(prompt).toContain('truncated');
  });

  it('should build context from files', async () => {
    const context = await builder.buildContextFromFiles([], '/repo', 1000);
    expect(context.files).toHaveLength(0);
    expect(context.maxContextTokens).toBe(1000);
  });
});
