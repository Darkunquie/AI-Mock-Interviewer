// Production-ready logger with structured output

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: number;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isProduction = process.env.NODE_ENV === "production";
const minLogLevel = isProduction ? LOG_LEVELS.info : LOG_LEVELS.debug;

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= minLogLevel;
}

function formatLog(entry: LogEntry): string {
  if (isProduction) {
    // JSON format for production (easier to parse by log aggregators)
    return JSON.stringify(entry);
  }

  // Pretty format for development
  const { timestamp, level, message, ...rest } = entry;
  const levelColors: Record<LogLevel, string> = {
    debug: "\x1b[36m", // cyan
    info: "\x1b[32m",  // green
    warn: "\x1b[33m",  // yellow
    error: "\x1b[31m", // red
  };
  const reset = "\x1b[0m";
  const color = levelColors[level];

  let output = `${timestamp} ${color}[${level.toUpperCase()}]${reset} ${message}`;

  if (Object.keys(rest).length > 0) {
    output += ` ${JSON.stringify(rest)}`;
  }

  return output;
}

function createLogEntry(
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...metadata,
  };
}

export const logger = {
  debug(message: string, metadata?: Record<string, unknown>) {
    if (shouldLog("debug")) {
      console.log(formatLog(createLogEntry("debug", message, metadata)));
    }
  },

  info(message: string, metadata?: Record<string, unknown>) {
    if (shouldLog("info")) {
      console.log(formatLog(createLogEntry("info", message, metadata)));
    }
  },

  warn(message: string, metadata?: Record<string, unknown>) {
    if (shouldLog("warn")) {
      console.warn(formatLog(createLogEntry("warn", message, metadata)));
    }
  },

  error(message: string, error?: Error, metadata?: Record<string, unknown>) {
    if (shouldLog("error")) {
      const entry = createLogEntry("error", message, {
        ...metadata,
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack: isProduction ? undefined : error.stack,
            }
          : undefined,
      });
      console.error(formatLog(entry));
    }
  },

  // Log API request
  request(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    metadata?: Record<string, unknown>
  ) {
    const level: LogLevel = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";
    if (shouldLog(level)) {
      const entry = createLogEntry(level, `${method} ${path} ${statusCode}`, {
        method,
        path,
        statusCode,
        duration,
        ...metadata,
      });
      console.log(formatLog(entry));
    }
  },
};

// Generate unique request ID
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export default logger;
