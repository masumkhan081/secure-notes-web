import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TitleContentFields } from "../../components/TitleContentFields";
import { applyApiFormErrors } from "../../lib/formErrors";
import { postFormSchema, type PostFormValues } from "./posts.schema";

type Props = {
  onSubmitPost: (values: PostFormValues) => Promise<void>;
};

export function PostForm({ onSubmitPost }: Props) {
  // Prevents a fast double-click from starting two requests before disabled state commits.
  const submittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const submit = handleSubmit(async (values) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    clearErrors();

    try {
      await onSubmitPost(values);
      reset({ title: "", content: "" });
    } catch (error: unknown) {
      applyApiFormErrors(error, ["title", "content"], setError);
    } finally {
      submittingRef.current = false;
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <fieldset disabled={isSubmitting} className="space-y-4">
        <TitleContentFields register={register} errors={errors} />

        {errors.root && (
          <p role="alert" className="text-sm text-red-700">
            {errors.root.message}
          </p>
        )}

        <button
          type="submit"
          className="rounded border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {isSubmitting ? "Publishing..." : "Publish post"}
        </button>
      </fieldset>
    </form>
  );
}
