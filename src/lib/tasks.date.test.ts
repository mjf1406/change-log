import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDayKey, formatDayLabel } from "@/lib/tasks";

describe("formatDayKey", () => {
  it("derives the key from local calendar date parts", () => {
    const date = new Date(2026, 5, 23, 21, 0, 0);
    expect(formatDayKey(date)).toBe("2026-06-23");
  });

  it("differs from UTC when local evening crosses midnight UTC", () => {
    const offsetMinutes = new Date().getTimezoneOffset();
    if (offsetMinutes <= 0) return;

    const localEvening = new Date(2026, 5, 23, 23, 0, 0);
    const utcKey = localEvening.toISOString().slice(0, 10);
    expect(formatDayKey(localEvening)).not.toBe(utcKey);
  });

  it("zero-pads month and day", () => {
    const date = new Date(2026, 0, 5, 12, 0, 0);
    expect(formatDayKey(date)).toBe("2026-01-05");
  });
});

describe("formatDayLabel", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Today" for a completion on the local today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 24, 10, 0, 0));

    const completedToday = new Date(2026, 5, 24, 21, 0, 0);
    expect(formatDayLabel(completedToday)).toBe("Today");
  });

  it('returns "Yesterday" for a completion on the local yesterday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 24, 10, 0, 0));

    const completedYesterday = new Date(2026, 5, 23, 21, 0, 0);
    expect(formatDayLabel(completedYesterday)).toBe("Yesterday");
  });

  it('does not label local yesterday evening as "Today"', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 5, 24, 9, 0, 0));

    const completedYesterdayEvening = new Date(2026, 5, 23, 21, 0, 0);
    expect(formatDayLabel(completedYesterdayEvening)).toBe("Yesterday");
  });
});
