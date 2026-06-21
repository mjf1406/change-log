import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Task } from "@/lib/sites";

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
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task.text}</DialogTitle>
          <DialogDescription asChild>
            <div className="whitespace-pre-wrap pt-2 text-sm text-foreground">
              {task.description}
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
