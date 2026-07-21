import { describe, expect, it } from "vite-plus/test";
import {
  applyDescriptionShortcut,
  continueBulletOnEnter,
  continueChecklistOnEnter,
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

describe("continueChecklistOnEnter", () => {
  it("continues a top-level checklist item", () => {
    const value = "- [ ] buy milk";
    const cursor = value.length;
    const result = continueChecklistOnEnter(value, cursor, cursor);
    expect(result).toEqual({
      value: "- [ ] buy milk\n- [ ] ",
      selectionStart: "- [ ] buy milk\n- [ ] ".length,
      selectionEnd: "- [ ] buy milk\n- [ ] ".length,
    });
  });

  it("preserves space indentation", () => {
    const value = "  - [ ] nested";
    const cursor = value.length;
    const result = continueChecklistOnEnter(value, cursor, cursor);
    expect(result?.value).toBe("  - [ ] nested\n  - [ ] ");
    expect(result?.selectionStart).toBe("  - [ ] nested\n  - [ ] ".length);
  });

  it("preserves tab indentation", () => {
    const value = "\t- [ ] nested";
    const cursor = value.length;
    const result = continueChecklistOnEnter(value, cursor, cursor);
    expect(result?.value).toBe("\t- [ ] nested\n\t- [ ] ");
  });

  it("splits content at the cursor", () => {
    const value = "- [ ] foobar";
    const cursor = "- [ ] foo".length;
    const result = continueChecklistOnEnter(value, cursor, cursor);
    expect(result?.value).toBe("- [ ] foo\n- [ ] bar");
    expect(result?.selectionStart).toBe("- [ ] foo\n- [ ] ".length);
  });

  it("exits an empty checklist item", () => {
    const value = "- [ ] item\n- [ ] ";
    const cursor = value.length;
    const result = continueChecklistOnEnter(value, cursor, cursor);
    expect(result?.value).toBe("- [ ] item\n");
    expect(result?.selectionStart).toBe("- [ ] item\n".length);
  });

  it("exits an empty checklist item without trailing space", () => {
    const value = "- [ ]";
    const result = continueChecklistOnEnter(value, value.length, value.length);
    expect(result?.value).toBe("");
    expect(result?.selectionStart).toBe(0);
  });

  it("returns null for non-checklist lines", () => {
    const value = "plain text";
    expect(continueChecklistOnEnter(value, value.length, value.length)).toBe(null);
  });

  it("continues a checked item as unchecked", () => {
    const value = "- [x] done";
    const cursor = value.length;
    const result = continueChecklistOnEnter(value, cursor, cursor);
    expect(result?.value).toBe("- [x] done\n- [ ] ");
  });
});

describe("continueBulletOnEnter", () => {
  it("continues a top-level bullet item", () => {
    const value = "- buy milk";
    const cursor = value.length;
    const result = continueBulletOnEnter(value, cursor, cursor);
    expect(result).toEqual({
      value: "- buy milk\n- ",
      selectionStart: "- buy milk\n- ".length,
      selectionEnd: "- buy milk\n- ".length,
    });
  });

  it("preserves space indentation", () => {
    const value = "  - nested";
    const cursor = value.length;
    const result = continueBulletOnEnter(value, cursor, cursor);
    expect(result?.value).toBe("  - nested\n  - ");
    expect(result?.selectionStart).toBe("  - nested\n  - ".length);
  });

  it("preserves tab indentation", () => {
    const value = "\t- nested";
    const cursor = value.length;
    const result = continueBulletOnEnter(value, cursor, cursor);
    expect(result?.value).toBe("\t- nested\n\t- ");
  });

  it("splits content at the cursor", () => {
    const value = "- foobar";
    const cursor = "- foo".length;
    const result = continueBulletOnEnter(value, cursor, cursor);
    expect(result?.value).toBe("- foo\n- bar");
    expect(result?.selectionStart).toBe("- foo\n- ".length);
  });

  it("exits an empty bullet item", () => {
    const value = "- item\n- ";
    const cursor = value.length;
    const result = continueBulletOnEnter(value, cursor, cursor);
    expect(result?.value).toBe("- item\n");
    expect(result?.selectionStart).toBe("- item\n".length);
  });

  it("exits a lone dash bullet line", () => {
    const value = "-";
    const result = continueBulletOnEnter(value, value.length, value.length);
    expect(result?.value).toBe("");
    expect(result?.selectionStart).toBe(0);
  });

  it("returns null for non-bullet lines", () => {
    const value = "plain text";
    expect(continueBulletOnEnter(value, value.length, value.length)).toBe(null);
  });

  it("returns null for checklist lines", () => {
    const value = "- [ ] item";
    expect(continueBulletOnEnter(value, value.length, value.length)).toBe(null);
  });
});
