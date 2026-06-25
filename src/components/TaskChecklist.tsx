import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import {
  getChecklistProgress,
  parseChecklist,
  toggleChecklistItem,
  type ChecklistItem,
} from "@/lib/checklist";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

type TaskChecklistProps = {
  taskId: string;
  description: string;
  isAdmin: boolean;
  showProgressHeader?: boolean;
};

export function TaskChecklist({
  taskId,
  description,
  isAdmin,
  showProgressHeader = true,
}: TaskChecklistProps) {
  const [localDescription, setLocalDescription] = useState(description);

  useEffect(() => {
    setLocalDescription(description);
  }, [description]);

  const items = parseChecklist(localDescription);
  const progress = getChecklistProgress(localDescription);

  function handleToggle(lineIndex: number) {
    if (!isAdmin) return;
    const nextDescription = toggleChecklistItem(localDescription, lineIndex);
    setLocalDescription(nextDescription);
    void db.transact(
      db.tx.tasks[taskId].update({ description: nextDescription }),
    );
  }

  return (
    <div className="space-y-3">
      {showProgressHeader ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="font-medium text-foreground">
              {progress.checked}/{progress.total} · {progress.percent}%
            </span>
          </div>
          <Progress value={progress.percent} />
        </div>
      ) : null}

      <ul className="space-y-1">
        {items.map((item) => (
          <ChecklistTreeItem
            key={item.lineIndex}
            item={item}
            isAdmin={isAdmin}
            onToggle={handleToggle}
          />
        ))}
      </ul>
    </div>
  );
}

type ChecklistTreeItemProps = {
  item: ChecklistItem;
  isAdmin: boolean;
  onToggle: (lineIndex: number) => void;
};

function ChecklistTreeItem({
  item,
  isAdmin,
  onToggle,
}: ChecklistTreeItemProps) {
  const hasChildren = item.children.length > 0;

  if (hasChildren) {
    return (
      <li>
        <Collapsible defaultOpen className="group/collapsible">
          <div className="flex items-start gap-1">
            {item.hasCheckbox ? (
              <ChecklistCheckbox
                checked={item.checked}
                disabled={!isAdmin}
                onChange={() => onToggle(item.lineIndex)}
              />
            ) : null}
            <CollapsibleTrigger
              className={cn(
                "flex min-h-6 flex-1 items-center gap-1 rounded-sm text-left text-sm",
                "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                item.hasCheckbox ? "font-normal" : "font-medium",
              )}
            >
              {!item.hasCheckbox ? <BulletMarker /> : null}
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-90" />
              <span className={cn(item.checked && item.hasCheckbox && "line-through text-muted-foreground")}>
                {item.label || "\u00a0"}
              </span>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <ul className="mt-1 space-y-1 border-l border-border pl-3 ml-1.5">
              {item.children.map((child) => (
                <ChecklistTreeItem
                  key={child.lineIndex}
                  item={child}
                  isAdmin={isAdmin}
                  onToggle={onToggle}
                />
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </li>
    );
  }

  if (!item.hasCheckbox) {
    return (
      <li className="flex min-h-6 items-start gap-2 text-sm font-medium text-foreground">
        <BulletMarker />
        <span className="pt-0.5">{item.label || "\u00a0"}</span>
      </li>
    );
  }

  return (
    <li>
      <label className="flex min-h-6 cursor-pointer items-start gap-2 text-sm">
        <ChecklistCheckbox
          checked={item.checked}
          disabled={!isAdmin}
          onChange={() => onToggle(item.lineIndex)}
        />
        <span
          className={cn(
            "pt-0.5",
            item.checked && "line-through text-muted-foreground",
          )}
        >
          {item.label}
        </span>
      </label>
    </li>
  );
}

type ChecklistCheckboxProps = {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
};

function ChecklistCheckbox({
  checked,
  disabled = false,
  onChange,
}: ChecklistCheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      className="mt-1 size-3.5 shrink-0 rounded border border-input accent-primary disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}

function BulletMarker() {
  return (
    <span
      aria-hidden
      className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground"
    />
  );
}
