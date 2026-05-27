import type { SupportedLanguage } from '../core/types.js';
import type { Parser } from './types.js';
import { TypeScriptParser } from './typescript-parser.js';

export class ParserRegistry {
  private parsers: Parser[] = [];

  constructor() {
    // Register built-in parsers
    this.register(new TypeScriptParser());
  }

  register(parser: Parser): void {
    this.parsers.push(parser);
  }

  getParser(language: SupportedLanguage): Parser | undefined {
    return this.parsers.find((p) => p.supports(language));
  }

  getSupportedLanguages(): SupportedLanguage[] {
    const languages = new Set<SupportedLanguage>();
    for (const parser of this.parsers) {
      for (const lang of ['typescript', 'javascript', 'python', 'java', 'go'] as SupportedLanguage[]) {
        if (parser.supports(lang)) {
          languages.add(lang);
        }
      }
    }
    return [...languages];
  }
}
