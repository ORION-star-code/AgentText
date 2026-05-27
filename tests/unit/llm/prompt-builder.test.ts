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
});
