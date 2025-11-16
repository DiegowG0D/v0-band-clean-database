// Centralized error handling
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden: Insufficient permissions') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

// Safe error response for client
export function sanitizeError(error: unknown): {
  message: string;
  statusCode: number;
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  // Don't expose internal errors to client
  console.error('[Server Error]', error);
  
  return {
    message: 'An unexpected error occurred',
    statusCode: 500,
  };
}

// Log security events
export function logSecurityEvent(
  event: 'unauthorized_access' | 'invalid_input' | 'rate_limit_exceeded' | 'suspicious_activity',
  details: Record<string, unknown>
) {
  console.warn('[Security Event]', {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
}
