/**
 * Structured Logger
 * Consistent logging with context, levels, and request tracing
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  service?: string;
  [key: string]: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const MIN_LEVEL = process.env.LOG_LEVEL as LogLevel || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function formatLog(level: LogLevel, message: string, context?: LogContext, data?: unknown): string {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (context) {
    Object.assign(entry, context);
  }

  if (data !== undefined) {
    entry.data = data;
  }

  return JSON.stringify(entry);
}

export class Logger {
  private context: LogContext;

  constructor(service: string, context?: LogContext) {
    this.context = { service, ...context };
  }

  child(additionalContext: LogContext): Logger {
    const logger = new Logger(this.context.service as string);
    logger.context = { ...this.context, ...additionalContext };
    return logger;
  }

  debug(message: string, data?: unknown): void {
    if (shouldLog('debug')) {
      console.debug(formatLog('debug', message, this.context, data));
    }
  }

  info(message: string, data?: unknown): void {
    if (shouldLog('info')) {
      console.log(formatLog('info', message, this.context, data));
    }
  }

  warn(message: string, data?: unknown): void {
    if (shouldLog('warn')) {
      console.warn(formatLog('warn', message, this.context, data));
    }
  }

  error(message: string, error?: unknown): void {
    if (shouldLog('error')) {
      const data = error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error;
      console.error(formatLog('error', message, this.context, data));
    }
  }
}

export function createLogger(service: string, context?: LogContext): Logger {
  return new Logger(service, context);
}
