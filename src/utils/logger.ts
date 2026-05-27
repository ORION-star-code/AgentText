export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

let currentLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[currentLevel];
}

export const logger = {
  debug(message: string, data?: unknown): void {
    if (shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, data ?? '');
    }
  },

  info(message: string, data?: unknown): void {
    if (shouldLog('info')) {
      console.info(`[INFO] ${message}`, data ?? '');
    }
  },

  warn(message: string, data?: unknown): void {
    if (shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, data ?? '');
    }
  },

  error(message: string, error?: unknown): void {
    if (shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error ?? '');
    }
  },
};
