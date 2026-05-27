import { resolve } from 'node:path';
import { loadConfig } from '../core/config.js';
import { IndexPipeline } from '../index/index-pipeline.js';
import { ClaudeClient } from '../llm/claude-client.js';
import { PromptBuilder } from '../llm/prompt-builder.js';
import { logger } from '../utils/logger.js';
import { extractKeywords } from '../utils/keyword-extractor.js';
import type { CodeContext } from '../llm/types.js';
import type { CodeGraph } from '../graph/code-graph.js';

export async function askCommand(question: string, repoPath?: string): Promise<void> {
  const rootPath = repoPath ? resolve(repoPath) : process.cwd();
  const config = loadConfig(rootPath);
  const pipeline = new IndexPipeline();

  logger.info('Loading index...');
  const hasIndex = await pipeline.hasIndex(rootPath, config);
  if (!hasIndex) {
    console.error('No index found. Run "codeinsight index <repo>" first.');
    process.exit(1);
  }

  const { graph, metadata } = await pipeline.loadIndex(rootPath, config);
  logger.info(`Index loaded: ${metadata.nodeCount} nodes from ${metadata.fileCount} files`);

  // Retrieve relevant context
  logger.info('Retrieving relevant context...');
  const context = await buildContext(question, graph, rootPath, config.maxTokens);

  // Build prompts
  const promptBuilder = new PromptBuilder();
  const systemPrompt = promptBuilder.getSystemPrompt();
  const userPrompt = promptBuilder.buildAnalysisPrompt(question, context);

  // Call Claude
  logger.info('Analyzing with Claude...');
  const claudeClient = new ClaudeClient({
    model: config.model,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
  });

  const response = await claudeClient.analyze(systemPrompt, userPrompt, context);

  // Output
  console.log('\n' + response.answer + '\n');

  if (response.citations.length > 0) {
    console.log('---');
    console.log('Citations:');
    for (const cite of response.citations) {
      console.log(`  ${cite.filePath}:${cite.line}`);
    }
  }

  console.log(`\n(${response.tokensUsed.input} input tokens, ${response.tokensUsed.output} output tokens)`);
}

async function buildContext(
  question: string,
  graph: CodeGraph,
  rootPath: string,
  maxTokens: number,
): Promise<CodeContext> {
  const keywords = extractKeywords(question);
  const relevantPaths = new Set<string>();

  for (const keyword of keywords) {
    const nodes = graph.searchByName(keyword);
    for (const node of nodes) {
      relevantPaths.add(node.filePath);
    }
  }

  const filePaths = [...relevantPaths].slice(0, 20);

  const promptBuilder = new PromptBuilder();
  return promptBuilder.buildContextFromFiles(filePaths, rootPath, maxTokens);
}

