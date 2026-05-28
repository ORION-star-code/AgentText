import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { DocGeneration } from '../analysis/doc-generation.js';
import type { DocType } from '../llm/types.js';
import { spinner, heading, filePath, success } from '../utils/ux.js';
import { loadIndexOrThrow } from './shared.js';

export async function docsCommand(docType: string, repoPath?: string): Promise<void> {
  const validTypes: DocType[] = ['readme', 'architecture', 'api'];
  if (!validTypes.includes(docType as DocType)) {
    throw new Error(`Invalid doc type: ${docType}. Valid types: ${validTypes.join(', ')}`);
  }

  const sp = spinner('Loading index...');
  const { graph, config, rootPath } = await loadIndexOrThrow(repoPath);
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
