import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const execFileAsync = promisify(execFile);

const CLI_PATH = join(import.meta.dirname, '..', '..', 'dist', 'index.js');
const PKG_VERSION = JSON.parse(
  readFileSync(join(import.meta.dirname, '..', '..', 'package.json'), 'utf-8'),
).version;

async function runCli(
  ...args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await execFileAsync('node', [CLI_PATH, ...args], { timeout: 10000 });
    return { stdout, stderr, exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; exitCode?: number };
    return { stdout: e.stdout ?? '', stderr: e.stderr ?? '', exitCode: e.exitCode ?? 1 };
  }
}

describe('CLI entry point', () => {
  it('should display version from package.json (not hardcoded)', async () => {
    const { stdout } = await runCli('--version');
    expect(stdout.trim()).toBe(PKG_VERSION);
  });

  it('should show help with all commands', async () => {
    const { stdout } = await runCli('--help');
    expect(stdout).toContain('index');
    expect(stdout).toContain('ask');
    expect(stdout).toContain('pr');
    expect(stdout).toContain('bug');
    expect(stdout).toContain('docs');
    expect(stdout).toContain('callchain');
    expect(stdout).toContain('issue');
  });

  it('should reject invalid docs type via commander choices', async () => {
    const { stderr, exitCode } = await runCli('docs', 'invalid');
    expect(exitCode).not.toBe(0);
    expect(stderr).toContain('invalid');
  });
});
