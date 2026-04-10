import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatSize, formatDate, timeAgo } from "../format";

describe("formatSize", () => {
  it("formats 0 bytes", () => {
    expect(formatSize(0)).toBe("0 B");
  });

  it("formats bytes", () => {
    expect(formatSize(500)).toBe("500 B");
  });

  it("formats kilobytes", () => {
    expect(formatSize(1024)).toBe("1 KB");
    expect(formatSize(1536)).toBe("1.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatSize(1048576)).toBe("1 MB");
    expect(formatSize(5242880)).toBe("5 MB");
  });

  it("formats gigabytes", () => {
    expect(formatSize(1073741824)).toBe("1 GB");
  });
});

describe("formatDate", () => {
  it("formats ISO string to locale string", () => {
    const iso = "2026-01-15T10:30:00.000Z";
    const result = formatDate(iso);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });
});

describe("timeAgo", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for very recent dates", () => {
    const now = new Date("2026-04-10T12:00:00.000Z").toISOString();
    expect(timeAgo(now)).toBe("just now");
  });

  it("returns minutes ago", () => {
    const fiveMinutesAgo = new Date("2026-04-10T11:55:00.000Z").toISOString();
    expect(timeAgo(fiveMinutesAgo)).toBe("5m ago");
  });

  it("returns hours ago", () => {
    const twoHoursAgo = new Date("2026-04-10T10:00:00.000Z").toISOString();
    expect(timeAgo(twoHoursAgo)).toBe("2h ago");
  });

  it("returns days ago", () => {
    const threeDaysAgo = new Date("2026-04-07T12:00:00.000Z").toISOString();
    expect(timeAgo(threeDaysAgo)).toBe("3d ago");
  });
});
