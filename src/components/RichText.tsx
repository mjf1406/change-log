import { Fragment } from "react";
import { parseRichTextParts } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

type RichTextProps = {
  text: string;
  className?: string;
};

const linkClassName =
  "text-primary underline-offset-4 hover:underline";

export function RichText({ text, className }: RichTextProps) {
  if (!text) {
    return null;
  }

  const lines = text.split("\n");

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {lines.map((line, lineIndex) => (
        <Fragment key={lineIndex}>
          {lineIndex > 0 ? <br /> : null}
          {parseRichTextParts(line).map((part, partIndex) => {
            if (part.type === "link") {
              return (
                <a
                  key={partIndex}
                  href={part.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClassName}
                >
                  {part.label}
                </a>
              );
            }

            return <Fragment key={partIndex}>{part.value}</Fragment>;
          })}
        </Fragment>
      ))}
    </span>
  );
}
