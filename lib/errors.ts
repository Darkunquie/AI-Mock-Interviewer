import { NextResponse } from "next/server";
import { ZodError } from "zod";
import logger from "./logger";

// Error codes for consistent error handling
export const ErrorCodes = {
  // Auth errors (AUTH_XXX)
  AUTH_INVALID_CREDENTIALS: "AUTH_001",
  AUTH_USER_NOT_FOUND: "AUTH_002",
  AUTH_EMAIL_EXISTS: "AUTH_003",
  AUTH_UNAUTHORIZED: "AUTH_004",
  AUTH_TOKEN_EXPIRED: "AUTH_005",

  // Rate limiting (RATE_XXX)
  RATE_LIMIT_EXCEEDED: "RATE_001",

  // Validation errors (VAL_XXX)
  VALIDATION_FAILED: "VAL_001",
  INVALID_INPUT: "VAL_002",

  // Database errors (DB_XXX)
  DATABASE_ERROR: "DB_001",
  NOT_FOUND: "DB_002",

  // AI/External service errors (AI_XXX)
  AI_SERVICE_ERROR: "AI_001",
  AI_QUOTA_EXCEEDED: "AI_002",

  // General errors
  INTERNAL_ERROR: "ERR_001",
  BAD_REQUEST: "ERR_002",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Create standardized error response
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const isProduction = process.env.NODE_ENV === "production";

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details: isProduction ? undefined : details,
      },
    },
    { status }
  );
}

// Create standardized success response
export function createSuccessResponse<T>(
  data?: T,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

// Handle Zod validation errors
export function handleZodError(error: ZodError): NextResponse<ApiErrorResponse> {
  const issues = error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

  logger.warn("Validation failed", { issues });

  return createErrorResponse(
    ErrorCodes.VALIDATION_FAILED,
    "Validation failed",
    400,
    { issues }
  );
}

// Handle unexpected errors
export function handleUnexpectedError(
  error: unknown,
  context?: string
): NextResponse<ApiErrorResponse> {
  const err = error instanceof Error ? error : new Error(String(error));

  logger.error(`Unexpected error${context ? ` in ${context}` : ""}`, err);

  return createErrorResponse(
    ErrorCodes.INTERNAL_ERROR,
    "An unexpected error occurred",
    500
  );
}

// Common error responses
export const Errors = {
  unauthorized: () =>
    createErrorResponse(ErrorCodes.AUTH_UNAUTHORIZED, "Unauthorized", 401),

  invalidCredentials: () =>
    createErrorResponse(
      ErrorCodes.AUTH_INVALID_CREDENTIALS,
      "Invalid email or password",
      401
    ),

  userNotFound: () =>
    createErrorResponse(ErrorCodes.AUTH_USER_NOT_FOUND, "User not found", 404),

  emailExists: () =>
    createErrorResponse(
      ErrorCodes.AUTH_EMAIL_EXISTS,
      "Email already registered",
      409
    ),

  rateLimitExceeded: () =>
    createErrorResponse(
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      "Too many requests. Please try again later.",
      429
    ),

  notFound: (resource: string = "Resource") =>
    createErrorResponse(ErrorCodes.NOT_FOUND, `${resource} not found`, 404),

  badRequest: (message: string = "Bad request") =>
    createErrorResponse(ErrorCodes.BAD_REQUEST, message, 400),

  aiServiceError: () =>
    createErrorResponse(
      ErrorCodes.AI_SERVICE_ERROR,
      "AI service is temporarily unavailable",
      503
    ),

  databaseError: () =>
    createErrorResponse(
      ErrorCodes.DATABASE_ERROR,
      "Database error occurred",
      500
    ),
};

export default Errors;
