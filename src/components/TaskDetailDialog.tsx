import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { ChecklistTree } from "@/components/TaskChecklist";
import { RichText } from "@/components/RichText";
import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import {
  getChecklistProgress,
  hasChecklist,
  parseDescriptionSegments,
  toggleChecklistItem,
} from "@/lib/checklist";
import { db } from "@/lib/db";
import type { Task } from "@/lib/sites";
import { getTaskDetailTiming } from "@/lib/tasks";
import { cn } from "@/lib/utils";

type TaskDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  isAdmin?: boolean;
  onEdit?: () => void;
};

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  isAdmin = false,
  onEdit,
}: TaskDetailDialogProps) {
  const [localDescription, setLocalDescription] = useState(task?.description ?? "");

  useEffect(() => {
    setLocalDescription(task?.description ?? "");
  }, [task?.description, task?.id]);

  if (!task) return null;

  const timingRows = getTaskDetailTiming(task);
  const description = localDescription;
  const segments = parseDescriptionSegments(description);
  const showChecklistProgress = hasChecklist(description);
  const checklistProgress = getChecklistProgress(description);
  const hasDescription = segments.length > 0;

  function handleToggle(lineIndex: number) {
    if (!isAdmin || !task) return;
    const nextDescription = toggleChecklistItem(description, lineIndex);
    setLocalDescription(nextDescription);
    void db.transact(
      db.tx.tasks[task.id].update({ description: nextDescription }),
    );
  }

  return (
    <Credenza open={open} onOpenChange={onOpenChange}>
      <CredenzaContent
        className={hasDescription ? "sm:max-w-2xl" : "sm:max-w-md"}
      >
        <CredenzaHeader>
          <CredenzaTitle>{task.text}</CredenzaTitle>
          <CredenzaDescription className="sr-only">
            Task details
          </CredenzaDescription>
        </CredenzaHeader>

        <div
          className={
            hasDescription
              ? "max-h-[min(70vh,32rem)] space-y-4 overflow-y-auto pr-1"
              : "space-y-4"
          }
        >
          {hasDescription ? (
            <div className="space-y-4">
              {segments.map((segment, index) => {
                if (segment.type === "prose") {
                  const isFirstProse =
                    segments.findIndex((item) => item.type === "prose") === index;

                  return (
                    <div key={`prose-${index}`}>
                      {isFirstProse ? (
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Description
                        </p>
                      ) : null}
                      <div
                        className={cn(
                          "text-sm text-foreground",
                          isFirstProse ? "mt-1" : undefined,
                        )}
                      >
                        <RichText text={segment.text} />
                      </div>
                    </div>
                  );
                }

                const sectionLabel = showChecklistProgress ? "Checklist" : "List";

                return (
                  <div key={`bullets-${index}`}>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {sectionLabel}
                    </p>
                    <div className="mt-2">
                      <ChecklistTree
                        items={segment.items}
                        isAdmin={isAdmin}
                        onToggle={handleToggle}
                        showProgressHeader={
                          showChecklistProgress && index === segments.findIndex(
                            (item) => item.type === "bullets",
                          )
                        }
                        progress={checklistProgress}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Description
              </p>
              <p className="mt-1 text-sm text-muted-foreground">No description.</p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Timing
            </p>
            <dl className="mt-2 space-y-2">
              {timingRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 text-sm"
                >
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="text-right font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {isAdmin && onEdit ? (
          <CredenzaFooter>
            <Button type="button" variant="outline" onClick={onEdit}>
              <Pencil className="size-3.5" />
              Edit
            </Button>
          </CredenzaFooter>
        ) : null}
      </CredenzaContent>
    </Credenza>
  );
}
