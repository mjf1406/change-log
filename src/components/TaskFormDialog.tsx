import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { id } from "@instantdb/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/db";
import type { Task } from "@/lib/sites";
import {
  getDefaultTaskFormValues,
  normalizeTaskDescription,
  taskFormSchema,
  taskToFormValues,
  type TaskFormValues,
} from "@/lib/task-form";

type TaskFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  siteId?: string;
  nextOrder?: number;
  task?: Task;
};

export function TaskFormDialog({
  open,
  onOpenChange,
  mode,
  siteId,
  nextOrder = 0,
  task,
}: TaskFormDialogProps) {
  const formKey =
    mode === "edit" && task ? task.id : `create-${siteId ?? "task"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <TaskFormDialogContent
          key={formKey}
          mode={mode}
          siteId={siteId}
          nextOrder={nextOrder}
          task={task}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Dialog>
  );
}

function TaskFormDialogContent({
  mode,
  siteId,
  nextOrder,
  task,
  onClose,
}: {
  mode: "create" | "edit";
  siteId?: string;
  nextOrder: number;
  task?: Task;
  onClose: () => void;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues:
      mode === "edit" && task
        ? taskToFormValues(task)
        : getDefaultTaskFormValues(),
    validators: {
      onSubmit: taskFormSchema,
    },
    onSubmit: ({ value }: { value: TaskFormValues }) => {
      setSubmitError(null);

      const description = normalizeTaskDescription(value.description);

      if (mode === "create") {
        if (!siteId) {
          setSubmitError("Site is required to create a task.");
          return;
        }

        const taskId = id();
        void db.transact(
          db.tx.tasks[taskId]
            .update({
              text: value.text.trim(),
              ...(description ? { description } : {}),
              status: "todo",
              order: nextOrder,
              createdAt: Date.now(),
            })
            .link({ site: siteId }),
        );
      } else if (task) {
        void db.transact(
          db.tx.tasks[task.id].update({
            text: value.text.trim(),
            description,
          }),
        );
      }

      onClose();
    },
  });

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {mode === "create" ? "Add task" : "Edit task"}
        </DialogTitle>
        <DialogDescription>
          {mode === "create"
            ? "Create a new task for the todo column."
            : "Update the task name and description."}
        </DialogDescription>
      </DialogHeader>

      <form
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            void form.handleSubmit();
          }
        }}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="text">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                <FieldContent>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Task name"
                    autoFocus
                  />
                  <FieldError errors={field.state.meta.errors} />
                </FieldContent>
              </Field>
            )}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>
                  Description{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="Add more details about this task"
                    rows={4}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </FieldContent>
              </Field>
            )}
          </form.Field>

          {submitError ? (
            <p className="text-sm text-destructive">{submitError}</p>
          ) : null}
        </FieldGroup>

        <DialogFooter className="mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            {mode === "create" ? "Add task" : "Save changes"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
