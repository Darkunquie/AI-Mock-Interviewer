import { describe, it, expect, vi, beforeEach } from "vitest";
import { logger, withRequestId } from "@/lib/logger";

describe("logger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("has info method", () => {
    expect(typeof logger.info).toBe("function");
  });

  it("has error method", () => {
    expect(typeof logger.error).toBe("function");
  });

  it("has warn method", () => {
    expect(typeof logger.warn).toBe("function");
  });

  it("has debug method", () => {
    expect(typeof logger.debug).toBe("function");
  });

  it("does not throw when logging", () => {
    expect(() => logger.info("test message")).not.toThrow();
    expect(() => logger.error("test error", new Error("test"))).not.toThrow();
    expect(() => logger.warn("test warning")).not.toThrow();
    expect(() => logger.debug("test debug")).not.toThrow();
  });

  it("accepts metadata", () => {
    expect(() => logger.info("test", { key: "value" })).not.toThrow();
  });
});

describe("withRequestId", () => {
  it("returns a scoped logger object", () => {
    const scoped = withRequestId("req-123");
    expect(typeof scoped.info).toBe("function");
    expect(typeof scoped.error).toBe("function");
    expect(typeof scoped.warn).toBe("function");
    expect(typeof scoped.debug).toBe("function");
  });

  it("does not throw when logging with request ID", () => {
    const scoped = withRequestId("req-456");
    expect(() => scoped.info("test")).not.toThrow();
    expect(() => scoped.error("err", new Error("test"))).not.toThrow();
    expect(() => scoped.warn("warn")).not.toThrow();
    expect(() => scoped.debug("debug")).not.toThrow();
  });
});
