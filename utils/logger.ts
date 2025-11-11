type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const IS_DEV = __DEV__;
const ENABLED_LEVELS: LogLevel[] = IS_DEV ? ['debug', 'info', 'warn', 'error'] : ['warn', 'error'];

class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private shouldLog(level: LogLevel): boolean {
    return ENABLED_LEVELS.includes(level);
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${this.context}] ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message));
      if (error) {
        if (error instanceof Error) {
          console.error('Error:', error.message);
          if (error.stack) {
            console.error('Stack:', error.stack);
          }
        } else {
          console.error('Error data:', error);
        }
      }
    }
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}
