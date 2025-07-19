import { config } from './config';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

const LogLevelMap: Record<string, LogLevel> = {
  error: LogLevel.ERROR,
  warn: LogLevel.WARN,
  info: LogLevel.INFO,
  debug: LogLevel.DEBUG
};

class Logger {
  private readonly level: LogLevel;

  constructor() {
    this.level = LogLevelMap[config.logLevel] ?? LogLevel.INFO;
  }

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (level <= this.level) {
      const timestamp = new Date().toISOString();
      const levelName = LogLevel[level];
      const prefix = `[${timestamp}] [${levelName}]`;
      
      switch (level) {
        case LogLevel.ERROR:
          console.error(prefix, message, ...args);
          break;
        case LogLevel.WARN:
          console.warn(prefix, message, ...args);
          break;
        case LogLevel.INFO:
          console.info(prefix, message, ...args);
          break;
        case LogLevel.DEBUG:
          console.debug(prefix, message, ...args);
          break;
      }
    }
  }

  error(message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }
}

export const logger = new Logger();
