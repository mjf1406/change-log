import { describe, expect, it } from "vitest";
import {
  applyDescriptionShortcut,
  indentSelectedLines,
  insertTextAtSelection,
  outdentSelectedLines,
} from "@/lib/description-editor";

describe("insertTextAtSelection", () => {
  it("inserts text at the cursor", () => {
    const result = insertTextAtSelection("hello world", 5, 5, " there");
    expect(result.value).toBe("hello there world");
    expect(result.selectionStart).toBe(11);
    expect(result.selectionEnd).toBe(11);
  });

  it("replaces the current selection", () => {
    const result = insertTextAtSelection("hello world", 0, 5, "hi");
    expect(result.value).toBe("hi world");
  });
});

describe("indentSelectedLines", () => {
  it("indents all lines touched by the selection", () => {
    const value = "one\ntwo\nthree";
    const result = indentSelectedLines(value, 4, 7);
    expect(result.value).toBe("one\n  two\nthree");
  });
});

describe("outdentSelectedLines", () => {
  it("removes one indent level from selected lines", () => {
    const value = "one\n  two\n    three";
    const result = outdentSelectedLines(value, 6, 13);
    expect(result.value).toBe("one\ntwo\n  three");
  });

  it("removes a leading tab", () => {
    const value = "\tone";
    const result = outdentSelectedLines(value, 1, 1);
    expect(result.value).toBe("one");
  });
});

describe("applyDescriptionShortcut", () => {
  it("inserts a checklist prefix", () => {
    const result = applyDescriptionShortcut("", 0, 0, "checklist");
    expect(result.value).toBe("- [ ] ");
  });

  it("inserts a plain bullet prefix", () => {
    const result = applyDescriptionShortcut("", 0, 0, "bullet");
    expect(result.value).toBe("- ");
  });
});
