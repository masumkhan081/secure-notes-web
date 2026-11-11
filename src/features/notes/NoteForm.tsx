import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TitleContentFields } from "../../components/TitleContentFields";
import { applyApiFormErrors } from "../../lib/formErrors";
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
      applyApiFormErrors(error, ["title", "content"], setError);
    } finally {
      submittingRef.current = false;
    }
  });

  const isEdit = mode === "edit";

  return (
    <form onSubmit={submit} noValidate>
      <fieldset disabled={isSubmitting} className="space-y-4">
        <TitleContentFields
          register={register}
          errors={errors}
          titleRef={titleInputRef}
        />

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
