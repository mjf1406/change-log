import { useEffect, useRef, useState } from "react";
import { id } from "@instantdb/react";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";

type QuickAddTaskProps = {
  siteId: string;
  nextOrder: number;
};

export function QuickAddTask({ siteId, nextOrder }: QuickAddTaskProps) {
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
          status: "todo",
          order,
          createdAt: Date.now(),
        })
        .link({ site: siteId }),
    );
  };

  return (
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
      placeholder="Add a task…"
      className="border-border bg-card shadow-xs"
      aria-label="Quick add task"
    />
  );
}
