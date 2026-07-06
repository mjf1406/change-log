import { describe, expect, it } from "vitest";
import {
  autoformatBareUrls,
  isSafeUrl,
  parseRichTextParts,
} from "@/lib/rich-text";

describe("isSafeUrl", () => {
  it("allows http and https URLs", () => {
    expect(isSafeUrl("https://example.com")).toBe(true);
    expect(isSafeUrl("http://example.com/path")).toBe(true);
  });

  it("rejects unsafe schemes", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("not-a-url")).toBe(false);
  });
});

describe("parseRichTextParts", () => {
  it("parses markdown links", () => {
    const parts = parseRichTextParts("See [docs](https://example.com) here");
    expect(parts).toEqual([
      { type: "text", value: "See " },
      { type: "link", label: "docs", href: "https://example.com" },
      { type: "text", value: " here" },
    ]);
  });

  it("autolinks bare URLs", () => {
    const parts = parseRichTextParts("Visit https://example.com today");
    expect(parts).toEqual([
      { type: "text", value: "Visit " },
      { type: "link", label: "https://example.com", href: "https://example.com" },
      { type: "text", value: " today" },
    ]);
  });

  it("renders unsafe markdown link targets as plain text", () => {
    const parts = parseRichTextParts("[x](javascript:alert(1))");
    expect(parts).toEqual([{ type: "text", value: "[x](javascript:alert(1))" }]);
  });

  it("prefers markdown links over bare URL parsing", () => {
    const parts = parseRichTextParts("[site](https://example.com)");
    expect(parts).toEqual([
      { type: "link", label: "site", href: "https://example.com" },
    ]);
  });
});

describe("autoformatBareUrls", () => {
  it("wraps bare URLs in markdown link syntax", () => {
    expect(autoformatBareUrls("Visit https://example.com today")).toBe(
      "Visit [https://example.com](https://example.com) today",
    );
  });

  it("does not double-wrap existing markdown links", () => {
    const input = "See [docs](https://example.com) and https://other.com";
    expect(autoformatBareUrls(input)).toBe(
      "See [docs](https://example.com) and [https://other.com](https://other.com)",
    );
  });

  it("leaves text unchanged when there are no bare URLs", () => {
    expect(autoformatBareUrls("plain text")).toBe("plain text");
  });
});
