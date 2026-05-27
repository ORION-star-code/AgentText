import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { loadConfig } from '../core/config.js';
import { IndexPipeline } from '../index/index-pipeline.js';
import { DocGeneration } from '../analysis/doc-generation.js';
import type { DocType } from '../llm/types.js';
import { logger } from '../utils/logger.js';

export async function docsCommand(docType: string, repoPath?: string): Promise<void> {
  const validTypes: DocType[] = ['readme', 'architecture', 'api'];
  if (!validTypes.includes(docType as DocType)) {
    console.error(`Invalid doc type: ${docType}. Valid types: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  const rootPath = repoPath ? resolve(repoPath) : process.cwd();
  const config = loadConfig(rootPath);

  logger.info('Loading index...');
  const pipeline = new IndexPipeline();
  const hasIndex = await pipeline.hasIndex(rootPath, config);
  if (!hasIndex) {
    console.error('No index found. Run "codeinsight index <repo>" first.');
    process.exit(1);
  }

  const { graph } = await pipeline.loadIndex(rootPath, config);

  const docGen = new DocGeneration(graph, {
    model: config.model,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
  });

  if (docType === 'architecture') {
    const diagram = docGen.generateArchitectureDiagram();
    console.log('\n## Architecture Diagram (Mermaid)\n');
    console.log('```mermaid');
    console.log(diagram);
    console.log('```');

    // Also save to file
    const outputPath = resolve(rootPath, 'docs', 'architecture.md');
    await writeFile(outputPath, `# Architecture\n\n\`\`\`mermaid\n${diagram}\n\`\`\`\n`, 'utf-8');
    console.log(`\nSaved to ${outputPath}`);
  } else {
    const content = await docGen.generate(docType as DocType, rootPath);
    console.log(content);

    // Save to file
    const fileName = docType === 'readme' ? 'README.md' : 'API.md';
    const outputPath = resolve(rootPath, 'docs', fileName);
    await writeFile(outputPath, content, 'utf-8');
    console.log(`\nSaved to ${outputPath}`);
  }
}
