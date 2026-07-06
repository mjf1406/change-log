export type ChecklistItem = {
  lineIndex: number;
  depth: number;
  label: string;
  hasCheckbox: boolean;
  checked: boolean;
  children: ChecklistItem[];
};

export type ChecklistProgress = {
  total: number;
  checked: number;
  percent: number;
};

export type DescriptionSegment =
  | { type: "prose"; text: string }
  | { type: "bullets"; items: ChecklistItem[] };

const BULLET_MARKER_RE = /^(\s*)([-*])(.*)$/;

function getIndentDepth(whitespace: string): number {
  const normalized = whitespace.replace(/\t/g, "  ");
  return Math.floor(normalized.length / 2);
}

function parseBulletLine(line: string) {
  const match = line.match(BULLET_MARKER_RE);
  if (!match) return null;

  const [, whitespace, , rest] = match;
  const depth = getIndentDepth(whitespace);

  const checkboxMatch = rest.match(/^ \[([ xX])\] ?(.*)$/);
  if (checkboxMatch) {
    const [, checkState, label] = checkboxMatch;
    return {
      depth,
      label: label.trim(),
      hasCheckbox: true,
      checked: checkState.toLowerCase() === "x",
    };
  }

  if (rest === "") {
    return {
      depth,
      label: "",
      hasCheckbox: false,
      checked: false,
    };
  }

  if (rest.startsWith(" ")) {
    return {
      depth,
      label: rest.slice(1).trim(),
      hasCheckbox: false,
      checked: false,
    };
  }

  return null;
}

function parseFlatLines(description: string) {
  const lines = description.split("\n");
  const flat: Omit<ChecklistItem, "children">[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const parsed = parseBulletLine(line);
    if (!parsed) continue;

    flat.push({
      lineIndex,
      ...parsed,
    });
  }

  return flat;
}

function buildTree(
  flat: Omit<ChecklistItem, "children">[],
): ChecklistItem[] {
  const root: ChecklistItem[] = [];
  const stack: ChecklistItem[] = [];

  for (const line of flat) {
    const item: ChecklistItem = { ...line, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].depth >= line.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(item);
    } else {
      stack[stack.length - 1].children.push(item);
    }

    stack.push(item);
  }

  return root;
}

export function parseChecklist(description: string | undefined | null): ChecklistItem[] {
  if (!description?.trim()) return [];
  return buildTree(parseFlatLines(description));
}

export function getChecklistProgress(
  description: string | undefined | null,
): ChecklistProgress {
  const flat = parseFlatLines(description ?? "");
  const checkboxItems = flat.filter((item) => item.hasCheckbox);
  const total = checkboxItems.length;
  const checked = checkboxItems.filter((item) => item.checked).length;
  const percent = total === 0 ? 0 : Math.round((checked / total) * 100);

  return { total, checked, percent };
}

export function hasChecklist(description: string | undefined | null): boolean {
  return getChecklistProgress(description).total > 0;
}

export function hasBulletList(description: string | undefined | null): boolean {
  if (!description?.trim()) return false;
  return parseFlatLines(description).length > 0;
}

export function parseDescriptionSegments(
  description: string | undefined | null,
): DescriptionSegment[] {
  if (!description) return [];

  const lines = description.split("\n");
  const flatByIndex = new Map(
    parseFlatLines(description).map((item) => [item.lineIndex, item]),
  );
  const segments: DescriptionSegment[] = [];
  let proseLines: string[] = [];
  let bulletLineIndices: number[] = [];

  function flushProse() {
    if (proseLines.length === 0) return;
    segments.push({ type: "prose", text: proseLines.join("\n") });
    proseLines = [];
  }

  function flushBullets() {
    if (bulletLineIndices.length === 0) return;
    const flat = bulletLineIndices
      .map((lineIndex) => flatByIndex.get(lineIndex))
      .filter((item): item is Omit<ChecklistItem, "children"> => item !== undefined);
    segments.push({ type: "bullets", items: buildTree(flat) });
    bulletLineIndices = [];
  }

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    if (flatByIndex.has(lineIndex)) {
      flushProse();
      bulletLineIndices.push(lineIndex);
    } else {
      flushBullets();
      proseLines.push(lines[lineIndex]);
    }
  }

  flushProse();
  flushBullets();

  return segments;
}

export function toggleChecklistItem(
  description: string,
  lineIndex: number,
): string {
  const lines = description.split("\n");
  const line = lines[lineIndex];
  if (line === undefined) return description;

  const toggled = line.replace(
    /^(\s*[-*] )\[([ xX])\](.*)$/,
    (_match, prefix: string, state: string, rest: string) => {
      const nextState = state.toLowerCase() === "x" ? " " : "x";
      return `${prefix}[${nextState}]${rest}`;
    },
  );

  if (toggled === line) return description;

  lines[lineIndex] = toggled;
  return lines.join("\n");
}
