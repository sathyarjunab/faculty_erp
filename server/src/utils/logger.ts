/**
 * Tiny dependency-free logger with levels and timestamps.
 * Kept intentionally simple; swap for pino/winston later without touching callers.
 */

type Level = 'error' | 'warn' | 'info' | 'debug';

const levels: Record<Level, number> = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = (process.env.LOG_LEVEL as Level) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const shouldLog = (level: Level): boolean => levels[level] <= (levels[currentLevel] ?? levels.info);

const format = (level: Level, args: unknown[]): unknown[] => {
  const ts = new Date().toISOString();
  return [`[${ts}] [${level.toUpperCase()}]`, ...args];
};

const logger = {
  error: (...args: unknown[]): void => {
    if (shouldLog('error')) console.error(...format('error', args));
  },
  warn: (...args: unknown[]): void => {
    if (shouldLog('warn')) console.warn(...format('warn', args));
  },
  info: (...args: unknown[]): void => {
    if (shouldLog('info')) console.log(...format('info', args));
  },
  debug: (...args: unknown[]): void => {
    if (shouldLog('debug')) console.log(...format('debug', args));
  },
};

export type Logger = typeof logger;

export default logger;
