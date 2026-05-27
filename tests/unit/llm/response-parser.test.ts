import { describe, it, expect } from 'vitest';
import { ResponseParser } from '../../../src/llm/response-parser.js';

describe('ResponseParser', () => {
  const parser = new ResponseParser();

  it('should extract file:line citations', () => {
    const text = 'The bug is in src/auth/login.ts:42 where the token is not validated.';
    const citations = parser.extractCitations(text);
    expect(citations).toHaveLength(1);
    expect(citations[0].filePath).toBe('src/auth/login.ts');
    expect(citations[0].line).toBe(42);
  });

  it('should extract multiple citations', () => {
    const text = 'See src/a.ts:10 and src/b.ts:20 for details.';
    const citations = parser.extractCitations(text);
    expect(citations).toHaveLength(2);
  });

  it('should extract (line N) format citations', () => {
    const text = 'The function at src/utils.ts (line 15) handles this.';
    const citations = parser.extractCitations(text);
    expect(citations).toHaveLength(1);
    expect(citations[0].filePath).toBe('src/utils.ts');
    expect(citations[0].line).toBe(15);
  });

  it('should extract markdown sections', () => {
    const text = `## Overview
This is the overview.

## Details
These are the details.

### Sub-detail
More details here.`;

    const sections = parser.extractSections(text);
    expect(sections.has('overview')).toBe(true);
    expect(sections.has('details')).toBe(true);
    expect(sections.get('overview')).toContain('overview');
  });

  it('should extract code blocks', () => {
    const text = `Here is some code:

\`\`\`typescript
const x = 1;
console.log(x);
\`\`\`

And another:

\`\`\`python
print("hello")
\`\`\``;

    const blocks = parser.extractCodeBlocks(text);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].language).toBe('typescript');
    expect(blocks[0].code).toContain('const x = 1');
    expect(blocks[1].language).toBe('python');
  });

  it('should return empty for text without citations', () => {
    const citations = parser.extractCitations('No file references here.');
    expect(citations).toHaveLength(0);
  });
});
