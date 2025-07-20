/**
 * API Middleware
 * Error handling, logging, and request processing middleware
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, url, ip } = req;
  
  // Log request start
  logger.info(`${method} ${url} - ${ip}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    logger.info(`${method} ${url} - ${statusCode} - ${duration}ms`);
  });
  
  next();
}

/**
 * Error handling middleware
 */
export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error(`Unhandled error in ${req.method} ${req.url}: ${error.message}`);
  logger.error(`Stack trace: ${error.stack}`);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(isDevelopment && { details: error.message })
  });
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn(`404 - Not Found: ${req.method} ${req.url}`);
  
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
}

/**
 * Security headers middleware
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server info
  res.removeHeader('X-Powered-By');
  
  next();
}

/**
 * CORS headers for API access
 */
export function corsHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
}

/**
 * Request size limit middleware
 */
export function requestSizeLimit(req: Request, res: Response, next: NextFunction): void {
  const contentLength = req.get('content-length');
  
  if (contentLength && parseInt(contentLength) > 10 * 1024) { // 10KB limit
    res.status(413).json({
      success: false,
      error: 'Request entity too large. Maximum size is 10KB.'
    });
    return;
  }
  
  next();
}

/**
 * Rate limiting (simple in-memory implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 100; // 100 requests per minute
  
  // Clean up old entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
  
  // Get or create client record
  let clientRecord = rateLimitMap.get(clientId);
  if (!clientRecord || now > clientRecord.resetTime) {
    clientRecord = { count: 0, resetTime: now + windowMs };
    rateLimitMap.set(clientId, clientRecord);
  }
  
  // Check rate limit
  if (clientRecord.count >= maxRequests) {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((clientRecord.resetTime - now) / 1000)
    });
    return;
  }
  
  // Increment counter
  clientRecord.count++;
  
  next();
}
