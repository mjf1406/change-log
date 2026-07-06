import { describe, expect, it } from "vitest";
import {
  getChecklistProgress,
  hasBulletList,
  hasChecklist,
  parseChecklist,
  parseDescriptionSegments,
  toggleChecklistItem,
} from "@/lib/checklist";

const SAMPLE = `- [ ] top level
\t- [ ] nested item
\t- group header
\t\t- [x] nested checked
- [x] done item`;

describe("parseChecklist", () => {
  it("builds a nested tree from indented markdown bullets", () => {
    const tree = parseChecklist(SAMPLE);
    expect(tree).toHaveLength(2);
    expect(tree[0].label).toBe("top level");
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].label).toBe("nested item");
    expect(tree[0].children[1].label).toBe("group header");
    expect(tree[0].children[1].children[0].label).toBe("nested checked");
    expect(tree[0].children[1].children[0].checked).toBe(true);
  });

  it("parses a lone dash as an empty bullet item", () => {
    const tree = parseChecklist("-");
    expect(tree).toHaveLength(1);
    expect(tree[0].hasCheckbox).toBe(false);
    expect(tree[0].label).toBe("");
  });
});

describe("getChecklistProgress", () => {
  it("counts every checkbox at every depth equally", () => {
    const progress = getChecklistProgress(SAMPLE);
    expect(progress.total).toBe(4);
    expect(progress.checked).toBe(2);
    expect(progress.percent).toBe(50);
  });
});

describe("hasBulletList", () => {
  it("returns true for plain bullet lists without checkboxes", () => {
    expect(hasBulletList("- just a bullet\n- another bullet")).toBe(true);
  });

  it("returns true for a lone dash bullet line", () => {
    expect(hasBulletList("-")).toBe(true);
    expect(hasBulletList("-\n- section")).toBe(true);
  });

  it("returns false when there are no bullet lines", () => {
    expect(hasBulletList("plain text")).toBe(false);
    expect(hasBulletList(undefined)).toBe(false);
  });
});

describe("hasChecklist", () => {
  it("returns false when there are no checkboxes", () => {
    expect(hasChecklist("- just a bullet\n- another bullet")).toBe(false);
    expect(hasChecklist(undefined)).toBe(false);
  });

  it("returns true when checkboxes exist", () => {
    expect(hasChecklist("- [ ] item")).toBe(true);
  });
});

describe("parseDescriptionSegments", () => {
  it("splits mixed prose and bullet content in document order", () => {
    const description = `Intro paragraph

- [ ] item one
- item two

Closing notes`;

    const segments = parseDescriptionSegments(description);
    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ type: "prose", text: "Intro paragraph\n" });
    expect(segments[1].type).toBe("bullets");
    if (segments[1].type === "bullets") {
      expect(segments[1].items).toHaveLength(2);
      expect(segments[1].items[0].label).toBe("item one");
      expect(segments[1].items[1].label).toBe("item two");
    }
    expect(segments[2]).toEqual({ type: "prose", text: "\nClosing notes" });
  });

  it("returns a single prose segment for plain text", () => {
    expect(parseDescriptionSegments("plain text")).toEqual([
      { type: "prose", text: "plain text" },
    ]);
  });

  it("returns a single bullets segment for bullet-only content", () => {
    const segments = parseDescriptionSegments("- [ ] only item");
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe("bullets");
  });

  it("returns an empty array for empty descriptions", () => {
    expect(parseDescriptionSegments("")).toEqual([]);
    expect(parseDescriptionSegments(undefined)).toEqual([]);
  });
});

describe("toggleChecklistItem", () => {
  it("flips a checkbox while preserving indentation", () => {
    const description = "\t- [ ] nested item";
    const toggled = toggleChecklistItem(description, 0);
    expect(toggled).toBe("\t- [x] nested item");
    expect(toggleChecklistItem(toggled, 0)).toBe(description);
  });

  it("returns the original description when the line has no checkbox", () => {
    const description = "- group header";
    expect(toggleChecklistItem(description, 0)).toBe(description);
  });
});
