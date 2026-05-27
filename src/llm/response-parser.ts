import type { Citation } from './types.js';

export class ResponseParser {
  extractCitations(text: string): Citation[] {
    const citations: Citation[] = [];
    const regex = /([\w./\-]+\.\w+)(?::(\d+)|\s*\(line\s*(\d+)\))/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const filePath = match[1];
      const line = parseInt(match[2] ?? match[3], 10);

      const start = Math.max(0, match.index - 30);
      const end = Math.min(text.length, match.index + match[0].length + 30);
      const snippet = text.slice(start, end).trim();

      citations.push({ filePath, line, snippet });
    }

    return citations;
  }

  extractSections(text: string): Map<string, string> {
    const sections = new Map<string, string>();
    const lines = text.split('\n');
    let currentSection = 'intro';
    let currentContent: string[] = [];

    for (const line of lines) {
      const headerMatch = line.match(/^#{1,3}\s+(.+)/);
      if (headerMatch) {
        if (currentContent.length > 0) {
          sections.set(currentSection, currentContent.join('\n').trim());
        }
        currentSection = headerMatch[1].toLowerCase().replace(/\s+/g, '-');
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    if (currentContent.length > 0) {
      sections.set(currentSection, currentContent.join('\n').trim());
    }

    return sections;
  }

  extractCodeBlocks(text: string): { language: string; code: string }[] {
    const blocks: { language: string; code: string }[] = [];
    const regex = /```(\w*)\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || 'text',
        code: match[2].trim(),
      });
    }

    return blocks;
  }
}
