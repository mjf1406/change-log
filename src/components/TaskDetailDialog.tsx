import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskChecklist } from "@/components/TaskChecklist";
import { useIsAdmin } from "@/lib/admin";
import { hasBulletList, hasChecklist } from "@/lib/checklist";
import type { Task } from "@/lib/sites";
import { getTaskDetailTiming } from "@/lib/tasks";

type TaskDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
};

export function TaskDetailDialog({
  open,
  onOpenChange,
  task,
}: TaskDetailDialogProps) {
  const { isAdmin } = useIsAdmin();

  if (!task) return null;

  const timingRows = getTaskDetailTiming(task);
  const showBulletList = hasBulletList(task.description);
  const showChecklistProgress = hasChecklist(task.description);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={showBulletList ? "sm:max-w-2xl" : "sm:max-w-md"}
      >
        <DialogHeader>
          <DialogTitle>{task.text}</DialogTitle>
          {showBulletList ? (
            <DialogDescription className="sr-only">
              Task details and checklist progress
            </DialogDescription>
          ) : (
            <DialogDescription asChild>
              <div className="space-y-4 pt-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Description
                  </p>
                  {task.description ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                      {task.description}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">
                      No description.
                    </p>
                  )}
                </div>

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
            </DialogDescription>
          )}
        </DialogHeader>

        {showBulletList ? (
          <div className="max-h-[min(70vh,32rem)] space-y-4 overflow-y-auto pr-1">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Checklist
              </p>
              <div className="mt-2">
                <TaskChecklist
                  taskId={task.id}
                  description={task.description ?? ""}
                  isAdmin={isAdmin}
                  showProgressHeader={showChecklistProgress}
                />
              </div>
            </div>

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
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
