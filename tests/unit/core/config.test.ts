import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// We need to test loadConfig and validateConfig
// They use process.cwd() so we'll test with explicit paths

const testDir = join(tmpdir(), 'codeinsight-config-test-' + Date.now());

describe('Config', () => {
  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
    vi.resetModules();
  });

  describe('loadConfig', () => {
    it('should return defaults when no config file exists', async () => {
      const { loadConfig } = await import('../../../src/core/config.js');
      const config = loadConfig(testDir);
      expect(config.model).toBe('claude-sonnet-4-20250514');
      expect(config.maxTokens).toBe(4096);
      expect(config.temperature).toBe(0.0);
      expect(config.maxFiles).toBe(10000);
      expect(config.maxFileSizeBytes).toBe(500 * 1024);
      expect(config.languages).toEqual(['typescript', 'javascript', 'python', 'java', 'go']);
      expect(config.indexPath).toBe('.codeinsight/index.json');
      expect(config.logLevel).toBe('info');
    });

    it('should merge user config with defaults', async () => {
      writeFileSync(join(testDir, '.codeinsight.json'), JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        maxTokens: 2048,
      }));
      const { loadConfig } = await import('../../../src/core/config.js');
      const config = loadConfig(testDir);
      expect(config.model).toBe('claude-haiku-4-5-20251001');
      expect(config.maxTokens).toBe(2048);
      expect(config.temperature).toBe(0.0); // default preserved
    });

    it('should fall back to defaults on invalid JSON', async () => {
      writeFileSync(join(testDir, '.codeinsight.json'), '{invalid json');
      const { loadConfig } = await import('../../../src/core/config.js');
      const config = loadConfig(testDir);
      expect(config.model).toBe('claude-sonnet-4-20250514');
    });
  });

  describe('validateConfig', () => {
    it('should reject empty model', async () => {
      const { validateConfig, loadConfig } = await import('../../../src/core/config.js');
      const config = loadConfig(testDir);
      expect(() => validateConfig({ ...config, model: '' })).toThrow('model must be a non-empty string');
    });

    it('should reject invalid maxTokens', async () => {
      const { validateConfig, loadConfig } = await import('../../../src/core/config.js');
      const config = loadConfig(testDir);
      expect(() => validateConfig({ ...config, maxTokens: 0 })).toThrow('maxTokens must be a positive number');
      expect(() => validateConfig({ ...config, maxTokens: -1 })).toThrow('maxTokens must be a positive number');
    });

    it('should reject invalid temperature', async () => {
      const { validateConfig, loadConfig } = await import('../../../src/core/config.js');
      const config = loadConfig(testDir);
      expect(() => validateConfig({ ...config, temperature: -0.1 })).toThrow('temperature must be between 0 and 1');
      expect(() => validateConfig({ ...config, temperature: 1.1 })).toThrow('temperature must be between 0 and 1');
    });

    it('should reject invalid maxFiles', async () => {
      const { validateConfig, loadConfig } = await import('../../../src/core/config.js');
      const config = loadConfig(testDir);
      expect(() => validateConfig({ ...config, maxFiles: 0 })).toThrow('maxFiles must be a positive number');
    });

    it('should reject invalid maxFileSizeBytes', async () => {
      const { validateConfig, loadConfig } = await import('../../../src/core/config.js');
      const config = loadConfig(testDir);
      expect(() => validateConfig({ ...config, maxFileSizeBytes: 0 })).toThrow('maxFileSizeBytes must be a positive number');
    });

    it('should reject non-array languages', async () => {
      const { validateConfig, loadConfig } = await import('../../../src/core/config.js');
      const config = loadConfig(testDir);
      expect(() => validateConfig({ ...config, languages: 'typescript' as any })).toThrow('languages must be an array');
    });

    it('should reject invalid logLevel', async () => {
      const { validateConfig, loadConfig } = await import('../../../src/core/config.js');
      const config = loadConfig(testDir);
      expect(() => validateConfig({ ...config, logLevel: 'verbose' as any })).toThrow('logLevel must be one of');
    });

    it('should accept valid config', async () => {
      const { validateConfig, loadConfig } = await import('../../../src/core/config.js');
      const config = loadConfig(testDir);
      const validated = validateConfig(config);
      expect(validated).toEqual(config);
    });
  });
});
