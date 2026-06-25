export type TextEditResult = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

export function insertTextAtSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  text: string,
): TextEditResult {
  const nextValue =
    value.slice(0, selectionStart) + text + value.slice(selectionEnd);
  const cursor = selectionStart + text.length;

  return {
    value: nextValue,
    selectionStart: cursor,
    selectionEnd: cursor,
  };
}

function getLineRange(value: string, index: number) {
  const lineStart = value.lastIndexOf("\n", index - 1) + 1;
  const lineEndIndex = value.indexOf("\n", index);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;

  return { lineStart, lineEnd };
}

function getAffectedLineRanges(
  value: string,
  selectionStart: number,
  selectionEnd: number,
) {
  const start = getLineRange(value, selectionStart);
  const end = getLineRange(value, Math.max(selectionStart, selectionEnd - 1));

  return { startLine: start.lineStart, endLine: end.lineEnd };
}

export function indentSelectedLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  indent = "  ",
): TextEditResult {
  const { startLine, endLine } = getAffectedLineRanges(
    value,
    selectionStart,
    selectionEnd,
  );
  const before = value.slice(0, startLine);
  const selected = value.slice(startLine, endLine);
  const after = value.slice(endLine);

  const lines = selected.split("\n");
  const indented = lines.map((line) => (line.length > 0 ? `${indent}${line}` : line)).join("\n");

  const nextValue = before + indented + after;
  const addedChars = lines.filter((line) => line.length > 0).length * indent.length;

  return {
    value: nextValue,
    selectionStart: selectionStart + (selectionStart > startLine ? indent.length : 0),
    selectionEnd: selectionEnd + addedChars,
  };
}

export function outdentSelectedLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  indent = "  ",
): TextEditResult {
  const { startLine, endLine } = getAffectedLineRanges(
    value,
    selectionStart,
    selectionEnd,
  );
  const before = value.slice(0, startLine);
  const selected = value.slice(startLine, endLine);
  const after = value.slice(endLine);

  let removedBeforeStart = 0;
  let removedTotal = 0;

  const lines = selected.split("\n");
  const outdented = lines
    .map((line, index) => {
      if (line.startsWith(indent)) {
        const removed = indent.length;
        if (index === 0 && selectionStart > startLine) {
          removedBeforeStart = removed;
        }
        removedTotal += removed;
        return line.slice(indent.length);
      }

      if (line.startsWith("\t")) {
        if (index === 0 && selectionStart > startLine) {
          removedBeforeStart = 1;
        }
        removedTotal += 1;
        return line.slice(1);
      }

      return line;
    })
    .join("\n");

  const nextValue = before + outdented + after;

  return {
    value: nextValue,
    selectionStart: Math.max(startLine, selectionStart - removedBeforeStart),
    selectionEnd: Math.max(startLine, selectionEnd - removedTotal),
  };
}

export function isModKey(event: Pick<KeyboardEvent, "ctrlKey" | "metaKey">) {
  return event.ctrlKey || event.metaKey;
}

export type DescriptionShortcut =
  | "checklist"
  | "bullet"
  | "indent"
  | "outdent";

export function getDescriptionShortcut(
  event: Pick<
    KeyboardEvent,
    "key" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey"
  >,
): DescriptionShortcut | null {
  if (!isModKey(event) || event.altKey) return null;

  if (event.shiftKey && event.key.toLowerCase() === "c") {
    return "checklist";
  }

  if (event.shiftKey && event.key.toLowerCase() === "b") {
    return "bullet";
  }

  if (!event.shiftKey && event.key === "]") {
    return "indent";
  }

  if (!event.shiftKey && event.key === "[") {
    return "outdent";
  }

  return null;
}

export function applyDescriptionShortcut(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  shortcut: DescriptionShortcut,
): TextEditResult {
  switch (shortcut) {
    case "checklist":
      return insertTextAtSelection(value, selectionStart, selectionEnd, "- [ ] ");
    case "bullet":
      return insertTextAtSelection(value, selectionStart, selectionEnd, "- ");
    case "indent":
      return indentSelectedLines(value, selectionStart, selectionEnd);
    case "outdent":
      return outdentSelectedLines(value, selectionStart, selectionEnd);
  }
}
