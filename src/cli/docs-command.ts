import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { loadConfig } from '../core/config.js';
import { IndexPipeline } from '../index/index-pipeline.js';
import { DocGeneration } from '../analysis/doc-generation.js';
import type { DocType } from '../llm/types.js';
import { logger } from '../utils/logger.js';
import { spinner, heading, filePath, success } from '../utils/ux.js';

export async function docsCommand(docType: string, repoPath?: string): Promise<void> {
  const validTypes: DocType[] = ['readme', 'architecture', 'api'];
  if (!validTypes.includes(docType as DocType)) {
    throw new Error(`Invalid doc type: ${docType}. Valid types: ${validTypes.join(', ')}`);
  }

  const rootPath = repoPath ? resolve(repoPath) : process.cwd();
  const config = loadConfig(rootPath);

  const sp = spinner('Loading index...');
  const pipeline = new IndexPipeline();
  const hasIndex = await pipeline.hasIndex(rootPath, config);
  if (!hasIndex) {
    sp.fail('No index found');
    throw new Error('No index found. Run "codeinsight index <repo>" first.');
  }

  const { graph } = await pipeline.loadIndex(rootPath, config);
  sp.succeed('Index loaded');

  const docGen = new DocGeneration(graph, {
    model: config.model,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
  });

  if (docType === 'architecture') {
    const sp2 = spinner('Generating architecture diagram...');
    const diagram = docGen.generateArchitectureDiagram();
    sp2.succeed('Diagram generated');

    console.log('\n' + heading('Architecture Diagram (Mermaid)') + '\n');
    console.log('```mermaid');
    console.log(diagram);
    console.log('```');

    const outputPath = resolve(rootPath, 'docs', 'architecture.md');
    await writeFile(outputPath, `# Architecture\n\n\`\`\`mermaid\n${diagram}\n\`\`\`\n`, 'utf-8');
    console.log('\n' + success(`Saved to ${filePath(outputPath)}`));
  } else {
    const sp2 = spinner(`Generating ${docType} documentation...`);
    const content = await docGen.generate(docType as DocType, rootPath);
    sp2.succeed('Documentation generated');

    console.log(content);

    const fileName = docType === 'readme' ? 'README.md' : 'API.md';
    const outputPath = resolve(rootPath, 'docs', fileName);
    await writeFile(outputPath, content, 'utf-8');
    console.log('\n' + success(`Saved to ${filePath(outputPath)}`));
  }
}
