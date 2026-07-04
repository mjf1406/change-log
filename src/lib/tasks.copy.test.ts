import { describe, expect, it } from "vitest";
import { formatTaskForCopy, formatTasksForColumnCopy } from "@/lib/tasks";

describe("formatTaskForCopy", () => {
  it("returns title only when there is no description", () => {
    expect(formatTaskForCopy({ text: "Task", description: undefined })).toBe(
      "- Task",
    );
  });

  it("prefixes a single-line plain description", () => {
    expect(formatTaskForCopy({ text: "Task", description: "notes" })).toBe(
      "- Task\n-- notes",
    );
  });

  it("prefixes every checklist line under the title", () => {
    const result = formatTaskForCopy({
      text: "Arrived classes",
      description:
        "- [ ] add archive to action menu\n- [ ] shows up in new section below grid/list",
    });

    expect(result).toBe(
      "- Arrived classes\n-- - [ ] add archive to action menu\n-- - [ ] shows up in new section below grid/list",
    );
  });

  it("preserves nested checklist indentation", () => {
    const result = formatTaskForCopy({
      text: "Task title",
      description: "- [ ] top level\n\t- [ ] nested item",
    });

    expect(result).toBe(
      "- Task title\n-- - [ ] top level\n-- \t- [ ] nested item",
    );
  });

  it("preserves blank lines in the description", () => {
    const result = formatTaskForCopy({
      text: "Task",
      description: "- [ ] first\n\n- [ ] second",
    });

    expect(result).toBe("- Task\n-- - [ ] first\n\n-- - [ ] second");
  });
});

describe("formatTasksForColumnCopy", () => {
  it("joins multiple tasks with each checklist nested correctly", () => {
    const result = formatTasksForColumnCopy([
      {
        text: "Task one",
        description: "- [ ] item a",
      },
      {
        text: "Task two",
        description: "- [ ] item b\n- [ ] item c",
      },
    ]);

    expect(result).toBe(
      "- Task one\n-- - [ ] item a\n- Task two\n-- - [ ] item b\n-- - [ ] item c",
    );
  });
});
