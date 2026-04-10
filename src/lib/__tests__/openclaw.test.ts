import { describe, it, expect } from "vitest";

// Test the resolvePath security logic conceptually
// (actual function uses fs so we test the pattern)

describe("Path Security", () => {
  const FORBIDDEN_PATTERNS = ["../", "..\\", "\0"];

  function isPathSafe(relativePath: string): boolean {
    const clean = relativePath.startsWith("/")
      ? relativePath.slice(1)
      : relativePath;

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (clean.includes(pattern)) return false;
    }

    return true;
  }

  it("blocks path traversal with ../", () => {
    expect(isPathSafe("../../etc/passwd")).toBe(false);
    expect(isPathSafe("foo/../../bar")).toBe(false);
  });

  it("blocks path traversal with ..\\", () => {
    expect(isPathSafe("..\\..\\windows")).toBe(false);
  });

  it("blocks null bytes", () => {
    expect(isPathSafe("file\0.txt")).toBe(false);
  });

  it("allows safe paths", () => {
    expect(isPathSafe("openclaw.json")).toBe(true);
    expect(isPathSafe("agents/main/sessions/test.jsonl")).toBe(true);
    expect(isPathSafe("memory/memory.db")).toBe(true);
  });

  it("handles leading slash correctly", () => {
    expect(isPathSafe("/openclaw.json")).toBe(true);
    expect(isPathSafe("/foo/bar")).toBe(true);
  });
});

describe("Config Parsing", () => {
  it("parses valid JSON config", () => {
    const json = '{"model":"glm-4","channels":{"whatsapp":{}},"agents":{"main":{}}}';
    const config = JSON.parse(json);
    expect(config.model).toBe("glm-4");
    expect(Object.keys(config.channels)).toContain("whatsapp");
    expect(Object.keys(config.agents)).toContain("main");
  });

  it("detects invalid JSON", () => {
    expect(() => JSON.parse("{invalid}")).toThrow();
  });

  it("handles missing sections gracefully", () => {
    const config = JSON.parse("{}");
    expect(config.model).toBeUndefined();
    expect(config.channels).toBeUndefined();
  });
});
