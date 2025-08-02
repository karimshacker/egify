import { Request, Response, NextFunction } from 'express';
import xss from 'xss';
import sanitizeHtml from 'sanitize-html';
import { logger } from '@/utils/logger';

export const securityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // XSS Protection
  if (req.body) {
    req.body = sanitizeRequestBody(req.body);
  }

  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Log suspicious requests
  if (isSuspiciousRequest(req)) {
    logger.warn('Suspicious request detected', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      headers: req.headers,
    });
  }

  next();
};

const sanitizeRequestBody = (body: any): any => {
  if (typeof body === 'string') {
    return sanitizeHtml(body, {
      allowedTags: [],
      allowedAttributes: {},
    });
  }

  if (Array.isArray(body)) {
    return body.map(sanitizeRequestBody);
  }

  if (typeof body === 'object' && body !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(body)) {
      sanitized[key] = sanitizeRequestBody(value);
    }
    return sanitized;
  }

  return body;
};

const isSuspiciousRequest = (req: Request): boolean => {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /document\./i,
    /window\./i,
    /alert\s*\(/i,
    /confirm\s*\(/i,
    /prompt\s*\(/i,
  ];

  const userAgent = req.get('User-Agent') || '';
  const url = req.originalUrl;
  const body = JSON.stringify(req.body || {});

  // Check for suspicious patterns
  const allContent = `${userAgent} ${url} ${body}`.toLowerCase();
  
  return suspiciousPatterns.some(pattern => pattern.test(allContent));
}; 