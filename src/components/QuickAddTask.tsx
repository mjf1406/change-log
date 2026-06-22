import { useRef, useState } from "react";
import { id } from "@instantdb/react";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";

type QuickAddTaskProps = {
  siteId: string;
  nextOrder: number;
};

export function QuickAddTask({ siteId, nextOrder }: QuickAddTaskProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const text = value.trim();
    if (!text || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const taskId = id();
      await db.transact(
        db.tx.tasks[taskId]
          .update({
            text,
            status: "todo",
            order: nextOrder,
            createdAt: Date.now(),
          })
          .link({ site: siteId }),
      );
      setValue("");
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          void submit();
        } else if (e.key === "Escape") {
          setValue("");
        }
      }}
      placeholder="Add a task…"
      disabled={isSubmitting}
      className="border-border bg-card shadow-xs"
      aria-label="Quick add task"
    />
  );
}
