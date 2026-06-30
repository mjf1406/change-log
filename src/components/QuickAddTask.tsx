import { useEffect, useRef, useState } from "react";
import { id } from "@instantdb/react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import type { TaskStatus } from "@/lib/tasks";

type QuickAddTaskProps = {
  siteId: string;
  nextOrder: number;
  status?: TaskStatus;
};

export function QuickAddTask({
  siteId,
  nextOrder,
  status = "todo",
}: QuickAddTaskProps) {
  const [value, setValue] = useState("");
  const orderRef = useRef(nextOrder);

  useEffect(() => {
    orderRef.current = Math.max(orderRef.current, nextOrder);
  }, [nextOrder]);

  const submit = () => {
    const text = value.trim();
    if (!text) return;

    const taskId = id();
    const order = orderRef.current++;
    setValue("");

    void db.transact(
      db.tx.tasks[taskId]
        .update({
          text,
          status,
          order,
          createdAt: Date.now(),
        })
        .link({ site: siteId }),
    );
  };

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") {
            setValue("");
          }
        }}
        enterKeyHint="done"
        placeholder={status === "dreams" ? "Add a dream…" : "Add a task…"}
        className="min-w-0 flex-1 border-border bg-card shadow-xs"
        aria-label={status === "dreams" ? "Quick add dream" : "Quick add task"}
      />
      <Button
        type="submit"
        size="icon-sm"
        className="shrink-0 md:hidden"
        disabled={!value.trim()}
        aria-label={status === "dreams" ? "Add dream" : "Add task"}
      >
        <Plus />
      </Button>
    </form>
  );
}
