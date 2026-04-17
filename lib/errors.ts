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
  AUTH_FORBIDDEN: "AUTH_006",
  AUTH_PENDING_APPROVAL: "AUTH_007",
  AUTH_REJECTED: "AUTH_008",

  // Rate limiting (RATE_XXX)
  RATE_LIMIT_EXCEEDED: "RATE_001",

  // Validation errors (VAL_XXX)
  VALIDATION_FAILED: "VAL_001",
  INVALID_INPUT: "VAL_002",

  // Database errors (DB_XXX)
  DATABASE_ERROR: "DB_001",
  NOT_FOUND: "DB_002",
  CONFLICT: "DB_003",

  // AI/External service errors (AI_XXX)
  AI_SERVICE_ERROR: "AI_001",
  AI_QUOTA_EXCEEDED: "AI_002",
  AI_INVALID_OUTPUT: "AI_003",
  AI_TIMEOUT: "AI_004",

  // Interview-specific (IV_XXX)
  IV_NO_ANSWERS: "IV_001",
  IV_ALREADY_COMPLETED: "IV_002",
  IV_QUESTION_OUT_OF_RANGE: "IV_003",
  IV_PDF_PARSE_FAILED: "IV_004",
  IV_NO_VALID_QUESTIONS: "IV_005",

  // File upload (FILE_XXX)
  FILE_TOO_LARGE: "FILE_001",
  FILE_INVALID_TYPE: "FILE_002",
  FILE_CORRUPT: "FILE_003",

  // Admin operations (ADMIN_XXX)
  ADMIN_SELF_MODIFY: "ADMIN_001",
  ADMIN_ALREADY_APPROVED: "ADMIN_002",

  // General errors
  INTERNAL_ERROR: "ERR_001",
  BAD_REQUEST: "ERR_002",
  NOT_IMPLEMENTED: "ERR_003",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * v0 error response shape — flat `error` string for backwards compat with
 * 50+ live users already reading `data.error` as string. Adds optional
 * `errorCode` for clients that want stable switchable codes.
 *
 * When v1 ships (Phase B11), v1 routes will emit the nested OpenAPI-spec
 * shape `{ error: { code, message, details } }`. Both shapes co-exist
 * during the 60-day deprecation window.
 */
interface ApiErrorResponse {
  success: false;
  /** Human-readable message. v0 clients read this as a string. */
  error: string;
  /** Stable machine-readable code. New clients switch on this. */
  errorCode: ErrorCode;
  /** Validation field details or diagnostic payload. Hidden in prod. */
  details?: unknown;
}

interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// Create standardized error response (v0 flat shape).
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
      error: message,
      errorCode: code,
      details: isProduction ? undefined : details,
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
    // Use the first issue's message for the human-readable summary so
    // the UI shows something actionable ("Invalid email format") rather
    // than the generic "Validation failed".
    issues[0]?.message || "Validation failed",
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

  const prefix = context ? `Unexpected error in ${context}` : "Unexpected error";
  logger.error(prefix, err);

  return createErrorResponse(
    ErrorCodes.INTERNAL_ERROR,
    "An unexpected error occurred",
    500
  );
}

// Common error responses. All emit the v0 flat shape with additive errorCode.
export const Errors = {
  unauthorized: () =>
    createErrorResponse(ErrorCodes.AUTH_UNAUTHORIZED, "Unauthorized", 401),

  forbidden: (message: string = "Forbidden") =>
    createErrorResponse(ErrorCodes.AUTH_FORBIDDEN, message, 403),

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

  pendingApproval: () =>
    createErrorResponse(
      ErrorCodes.AUTH_PENDING_APPROVAL,
      "Your account is pending admin approval",
      403
    ),

  accountRejected: () =>
    createErrorResponse(
      ErrorCodes.AUTH_REJECTED,
      "Your account has been rejected",
      403
    ),

  rateLimitExceeded: () =>
    createErrorResponse(
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      "Too many requests. Please try again later.",
      429
    ),

  notFound: (resource: string = "Resource") =>
    createErrorResponse(ErrorCodes.NOT_FOUND, `${resource} not found`, 404),

  conflict: (message: string = "Resource conflict") =>
    createErrorResponse(ErrorCodes.CONFLICT, message, 409),

  badRequest: (message: string = "Bad request") =>
    createErrorResponse(ErrorCodes.BAD_REQUEST, message, 400),

  invalidJson: () =>
    createErrorResponse(
      ErrorCodes.BAD_REQUEST,
      "Invalid JSON body",
      400
    ),

  fileTooLarge: (limit: string) =>
    createErrorResponse(
      ErrorCodes.FILE_TOO_LARGE,
      `File too large. Maximum size is ${limit}.`,
      413
    ),

  fileInvalidType: (allowed: string) =>
    createErrorResponse(
      ErrorCodes.FILE_INVALID_TYPE,
      `Invalid file type. Only ${allowed} allowed.`,
      400
    ),

  aiServiceError: () =>
    createErrorResponse(
      ErrorCodes.AI_SERVICE_ERROR,
      "AI service is temporarily unavailable",
      503
    ),

  aiInvalidOutput: () =>
    createErrorResponse(
      ErrorCodes.AI_INVALID_OUTPUT,
      "AI produced an invalid response. Please try again.",
      502
    ),

  databaseError: () =>
    createErrorResponse(
      ErrorCodes.DATABASE_ERROR,
      "Database error occurred",
      500
    ),

  notImplemented: () =>
    createErrorResponse(
      ErrorCodes.NOT_IMPLEMENTED,
      "Feature not implemented",
      501
    ),
};

export default Errors;
