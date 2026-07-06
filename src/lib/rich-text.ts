export type RichTextPart =
  | { type: "text"; value: string }
  | { type: "link"; label: string; href: string };

const MARKDOWN_LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
const BARE_URL_RE = /https?:\/\/[^\s<]+[^\s<.,;:!?'")\]}>]/g;

export function isSafeUrl(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseRichTextParts(text: string): RichTextPart[] {
  if (!text) return [];

  const parts: RichTextPart[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(MARKDOWN_LINK_RE)) {
    const matchIndex = match.index ?? 0;
    const label = match[1] ?? "";
    const href = match[2] ?? "";

    if (matchIndex > lastIndex) {
      parts.push(...parseBareUrlsInText(text.slice(lastIndex, matchIndex)));
    }

    if (isSafeUrl(href)) {
      parts.push({ type: "link", label, href });
    } else {
      parts.push({ type: "text", value: match[0] });
    }

    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(...parseBareUrlsInText(text.slice(lastIndex)));
  }

  return parts;
}

function parseBareUrlsInText(text: string): RichTextPart[] {
  if (!text) return [];

  const parts: RichTextPart[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(BARE_URL_RE)) {
    const matchIndex = match.index ?? 0;
    const href = match[0];

    if (matchIndex > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, matchIndex) });
    }

    if (isSafeUrl(href)) {
      parts.push({ type: "link", label: href, href });
    } else {
      parts.push({ type: "text", value: href });
    }

    lastIndex = matchIndex + href.length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", value: text }];
}

export function autoformatBareUrls(text: string): string {
  if (!text) return text;

  const markdownRanges = getMarkdownLinkRanges(text);
  let result = "";
  let lastIndex = 0;

  for (const match of text.matchAll(BARE_URL_RE)) {
    const matchIndex = match.index ?? 0;
    const href = match[0];

    if (isInsideRanges(matchIndex, matchIndex + href.length, markdownRanges)) {
      continue;
    }

    if (!isSafeUrl(href)) {
      continue;
    }

    result += text.slice(lastIndex, matchIndex);
    result += `[${href}](${href})`;
    lastIndex = matchIndex + href.length;
  }

  if (lastIndex === 0) {
    return text;
  }

  result += text.slice(lastIndex);
  return result;
}

function getMarkdownLinkRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];

  for (const match of text.matchAll(MARKDOWN_LINK_RE)) {
    const start = match.index ?? 0;
    ranges.push([start, start + match[0].length]);
  }

  return ranges;
}

function isInsideRanges(
  start: number,
  end: number,
  ranges: Array<[number, number]>,
): boolean {
  return ranges.some(([rangeStart, rangeEnd]) => start >= rangeStart && end <= rangeEnd);
}
