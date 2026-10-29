// ====================================================================
// LearnMate AI - AI Endpoint Rate Limiter
// ====================================================================
import { Request, Response, NextFunction } from 'express';

interface ClientUsage {
  count: number;
  resetAt: number;
}

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 mins
const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
const clients = new Map<string, ClientUsage>();

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const identifier = req.user?.id || req.ip || 'anonymous';
  const now = Date.now();

  const record = clients.get(identifier);

  if (!record || now > record.resetAt) {
    clients.set(identifier, { count: 1, resetAt: now + windowMs });
    next();
    return;
  }

  if (record.count >= maxRequests) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'You have reached the rate limit for AI operations. Please wait a few minutes before trying again.',
      retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000),
    });
    return;
  }

  record.count += 1;
  next();
}
