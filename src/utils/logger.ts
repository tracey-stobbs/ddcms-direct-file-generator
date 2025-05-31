/**
 * Logger utility
 * 
 * Provides a unified logging interface for the application
 */
import winston from 'winston';

/**
 * Configures and exports a Winston logger instance
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ddcms-file-builder' },
  transports: [
    // Write logs to console with color
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...rest }) => {
          return `${timestamp} ${level}: ${message} ${Object.keys(rest).length ? JSON.stringify(rest) : ''}`;
        })
      )
    }),
    // Write error logs to file
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write combined logs to file
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

/**
 * Add a stream for Morgan middleware to use our Winston logger
 */
export const morganStream = {
  write: (message: string): void => {
    logger.info(message.trim());
  }
};
