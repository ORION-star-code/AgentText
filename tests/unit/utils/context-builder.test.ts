import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildContextFromFiles } from '../../../src/utils/context-builder.js';

describe('buildContextFromFiles', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `context-builder-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should read and return file contents', async () => {
    await writeFile(join(testDir, 'a.ts'), 'const x = 1;');
    await writeFile(join(testDir, 'b.ts'), 'const y = 2;');

    const context = await buildContextFromFiles(['a.ts', 'b.ts'], testDir);

    expect(context.files).toHaveLength(2);
    expect(context.files[0].path).toBe('a.ts');
    expect(context.files[0].content).toBe('const x = 1;');
    expect(context.files[1].path).toBe('b.ts');
  });

  it('should truncate to maxLines', async () => {
    const lines = Array.from({ length: 200 }, (_, i) => `line ${i}`);
    await writeFile(join(testDir, 'long.ts'), lines.join('\n'));

    const context = await buildContextFromFiles(['long.ts'], testDir, { maxLines: 10 });

    expect(context.files).toHaveLength(1);
    expect(context.files[0].endLine).toBe(10);
    expect(context.files[0].content.split('\n')).toHaveLength(10);
  });

  it('should skip unreadable files', async () => {
    await writeFile(join(testDir, 'exists.ts'), 'ok');

    const context = await buildContextFromFiles(['exists.ts', 'missing.ts'], testDir);

    expect(context.files).toHaveLength(1);
    expect(context.files[0].path).toBe('exists.ts');
  });

  it('should handle empty file list', async () => {
    const context = await buildContextFromFiles([], testDir);

    expect(context.files).toHaveLength(0);
  });

  it('should respect maxChars limit', async () => {
    await writeFile(join(testDir, 'a.ts'), 'x'.repeat(100));
    await writeFile(join(testDir, 'b.ts'), 'y'.repeat(100));

    const context = await buildContextFromFiles(['a.ts', 'b.ts'], testDir, { maxChars: 150 });

    expect(context.files).toHaveLength(2);
    expect(context.files[0].content.length).toBeLessThanOrEqual(150);
  });
});
