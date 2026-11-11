import { useId, type RefObject } from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";

export type TitleContentValues = {
  title: string;
  content: string;
};

type Props = {
  register: UseFormRegister<TitleContentValues>;
  errors: FieldErrors<TitleContentValues>;
  titleRef?: RefObject<HTMLInputElement | null>;
};

export function TitleContentFields({ register, errors, titleRef }: Props) {
  const formId = useId();
  const titleId = `${formId}-title`;
  const titleErrorId = `${formId}-title-error`;
  const contentId = `${formId}-content`;
  const contentErrorId = `${formId}-content-error`;

  const titleRegistration = register("title");

  return (
    <>
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
            if (titleRef) {
              titleRef.current = element;
            }
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
          <p id={contentErrorId} role="alert" className="text-sm text-red-700">
            {errors.content.message}
          </p>
        )}
      </div>
    </>
  );
}
