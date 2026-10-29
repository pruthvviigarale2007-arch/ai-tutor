// ====================================================================
// LearnMate AI - Global Error Handler & Sanitizer
// ====================================================================
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'The submitted request data failed schema validation',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // 2. Multer file size / upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      error: 'Payload Too Large',
      message: 'Uploaded file exceeds the maximum permitted size limit (15MB).',
    });
    return;
  }

  // 3. General errors (sanitized to prevent secret leaks)
  console.error('Unhandled Server Error:', err);
  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred while processing your request. Please try again later.'
      : err.message || 'Internal Server Error';

  res.status(status).json({
    error: 'Internal Error',
    message,
  });
}
