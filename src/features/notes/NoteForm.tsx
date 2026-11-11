import { useEffect, useId, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError } from "../../lib/api";
import { noteFormSchema, type NoteFormValues } from "./notes.schema";

type Props = {
  mode: "create" | "edit";
  initialValues?: NoteFormValues;
  onSubmitNote: (values: NoteFormValues) => Promise<void>;
  onCancel?: () => void;
  autoFocusTitle?: boolean;
};

export function NoteForm({
  mode,
  initialValues,
  onSubmitNote,
  onCancel,
  autoFocusTitle = false,
}: Props) {
  const formId = useId();
  const titleId = `${formId}-title`;
  const titleErrorId = `${formId}-title-error`;
  const contentId = `${formId}-content`;
  const contentErrorId = `${formId}-content-error`;

  // Prevents a fast double-click from starting two requests before disabled state commits.
  const submittingRef = useRef(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(noteFormSchema),
    defaultValues: initialValues ?? {
      title: "",
      content: "",
    },
  });

  useEffect(() => {
    if (autoFocusTitle) {
      titleInputRef.current?.focus();
    }
  }, [autoFocusTitle]);

  function applyServerError(error: unknown) {
    if (error instanceof ApiError && error.details.length > 0) {
      let mappedCount = 0;

      for (const detail of error.details) {
        if (detail.field === "title" || detail.field === "content") {
          setError(detail.field, {
            type: "server",
            message: detail.message,
          });
          mappedCount += 1;
        }
      }

      if (mappedCount === error.details.length) {
        return;
      }
    }

    setError("root", {
      type: "server",
      message: error instanceof Error ? error.message : "Request failed.",
    });
  }

  const submit = handleSubmit(async (values) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    clearErrors();

    try {
      await onSubmitNote(values);
      if (mode === "create") {
        reset({ title: "", content: "" });
      }
    } catch (error: unknown) {
      applyServerError(error);
    } finally {
      submittingRef.current = false;
    }
  });

  const titleRegistration = register("title");
  const isEdit = mode === "edit";

  return (
    <form onSubmit={submit} noValidate>
      <fieldset disabled={isSubmitting} className="space-y-4">
        <div className="grid gap-1.5">
          <label
            htmlFor={titleId}
            className="text-sm font-medium text-slate-800"
          >
            Title
          </label>
          <input
            {...titleRegistration}
            ref={(element) => {
              titleRegistration.ref(element);
              titleInputRef.current = element;
            }}
            id={titleId}
            type="text"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? titleErrorId : undefined}
            className="w-full rounded border border-slate-400 bg-white px-3 py-2 text-sm text-slate-900"
          />
          {errors.title && (
            <p id={titleErrorId} role="alert" className="text-sm text-red-700">
              {errors.title.message}
            </p>
          )}
        </div>

        <div className="grid gap-1.5">
          <label
            htmlFor={contentId}
            className="text-sm font-medium text-slate-800"
          >
            Content
          </label>
          <textarea
            {...register("content")}
            id={contentId}
            rows={5}
            aria-invalid={Boolean(errors.content)}
            aria-describedby={errors.content ? contentErrorId : undefined}
            className="w-full rounded border border-slate-400 bg-white px-3 py-2 text-sm text-slate-900"
          />
          {errors.content && (
            <p
              id={contentErrorId}
              role="alert"
              className="text-sm text-red-700"
            >
              {errors.content.message}
            </p>
          )}
        </div>

        {errors.root && (
          <p role="alert" className="text-sm text-red-700">
            {errors.root.message}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {isSubmitting
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
                ? "Save"
                : "Create note"}
          </button>

          {isEdit && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded border border-slate-400 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-60"
            >
              Cancel
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}
