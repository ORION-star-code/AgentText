import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { FileDiscovery } from '../../../src/core/file-discovery.js';

describe('FileDiscovery', () => {
  let testDir: string;

  beforeAll(async () => {
    testDir = join(tmpdir(), `codeinsight-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });

    // Create test files
    await mkdir(join(testDir, 'src'), { recursive: true });
    await writeFile(join(testDir, 'src', 'index.ts'), 'export const x = 1;');
    await writeFile(join(testDir, 'src', 'app.js'), 'const x = 1;');
    await writeFile(join(testDir, 'src', 'main.py'), 'x = 1');

    // Create excluded dirs
    await mkdir(join(testDir, 'node_modules'), { recursive: true });
    await writeFile(join(testDir, 'node_modules', 'dep.ts'), 'export const y = 2;');

    await mkdir(join(testDir, 'dist'), { recursive: true });
    await writeFile(join(testDir, 'dist', 'built.js'), 'const z = 3;');

    // Create .gitignore
    await writeFile(join(testDir, '.gitignore'), '*.log\nsecret/\n');

    // Create ignored file
    await writeFile(join(testDir, 'debug.log'), 'log content');

    // Create a file in ignored dir
    await mkdir(join(testDir, 'secret'), { recursive: true });
    await writeFile(join(testDir, 'secret', 'key.ts'), 'export const key = "abc";');
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('should discover source files', async () => {
    const discovery = new FileDiscovery();
    const files = await discovery.discover(testDir);

    const paths = files.map((f) => f.relativePath).sort();
    expect(paths).toContain('src/index.ts');
    expect(paths).toContain('src/app.js');
    expect(paths).toContain('src/main.py');
  });

  it('should exclude node_modules and dist', async () => {
    const discovery = new FileDiscovery();
    const files = await discovery.discover(testDir);

    const paths = files.map((f) => f.relativePath);
    expect(paths).not.toContain('node_modules/dep.ts');
    expect(paths).not.toContain('dist/built.js');
  });

  it('should respect .gitignore patterns', async () => {
    const discovery = new FileDiscovery();
    const files = await discovery.discover(testDir);

    const paths = files.map((f) => f.relativePath);
    expect(paths).not.toContain('debug.log');
    expect(paths).not.toContain('secret/key.ts');
  });

  it('should filter by language', async () => {
    const discovery = new FileDiscovery();
    const files = await discovery.discover(testDir, {
      includeLanguages: ['typescript'],
    });

    const paths = files.map((f) => f.relativePath).sort();
    expect(paths).toEqual(['src/index.ts']);
  });

  it('should respect maxFiles limit', async () => {
    const discovery = new FileDiscovery();
    const files = await discovery.discover(testDir, { maxFiles: 1 });

    expect(files).toHaveLength(1);
  });

  it('should detect correct language for each file', async () => {
    const discovery = new FileDiscovery();
    const files = await discovery.discover(testDir);

    const tsFile = files.find((f) => f.relativePath === 'src/index.ts');
    const jsFile = files.find((f) => f.relativePath === 'src/app.js');
    const pyFile = files.find((f) => f.relativePath === 'src/main.py');

    expect(tsFile?.language).toBe('typescript');
    expect(jsFile?.language).toBe('javascript');
    expect(pyFile?.language).toBe('python');
  });
});
