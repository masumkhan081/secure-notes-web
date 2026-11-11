import { useEffect, useId, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError } from "../../lib/api";
import { parseInterests, type User } from "../auth/auth.schema";
import {
  createAdminUserFormSchema,
  type CreateAdminUserPayload,
  type UpdateAdminUserPayload,
} from "./admin.schema";

type Props =
  | {
      mode: "create";
      onSubmitCreate: (values: CreateAdminUserPayload) => Promise<void>;
    }
  | {
      mode: "edit";
      user: User;
      onSubmitEdit: (values: UpdateAdminUserPayload) => Promise<void>;
      onCancel: () => void;
      autoFocusName?: boolean;
    };

export function AdminUserForm(props: Props) {
  const formId = useId();
  const nameId = `${formId}-name`;
  const nameErrorId = `${formId}-name-error`;
  const emailId = `${formId}-email`;
  const emailErrorId = `${formId}-email-error`;
  const passwordId = `${formId}-password`;
  const passwordErrorId = `${formId}-password-error`;
  const interestsId = `${formId}-interests`;
  const interestsErrorId = `${formId}-interests-error`;

  // Prevents a fast double-click from starting two requests before disabled state commits.
  const submittingRef = useRef(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const schema = createAdminUserFormSchema(props.mode);
  const isEdit = props.mode === "edit";
  const autoFocusName = props.mode === "edit" && Boolean(props.autoFocusName);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues:
      props.mode === "edit"
        ? {
            name: props.user.name,
            email: props.user.email,
            password: "",
            interests: props.user.interests.join(", "),
          }
        : {
            name: "",
            email: "",
            password: "",
            interests: "",
          },
  });

  useEffect(() => {
    if (autoFocusName) {
      nameInputRef.current?.focus();
    }
  }, [autoFocusName]);

  function applyServerError(error: unknown) {
    if (error instanceof ApiError && error.details.length > 0) {
      let mappedCount = 0;

      for (const detail of error.details) {
        if (
          detail.field === "name" ||
          detail.field === "email" ||
          detail.field === "interests" ||
          (props.mode === "create" && detail.field === "password")
        ) {
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
      const interests = parseInterests(values.interests);

      if (props.mode === "create") {
        await props.onSubmitCreate({
          name: values.name,
          email: values.email,
          password: values.password,
          interests,
        });
        reset({ name: "", email: "", password: "", interests: "" });
      } else {
        await props.onSubmitEdit({
          name: values.name,
          email: values.email,
          interests,
        });
      }
    } catch (error: unknown) {
      applyServerError(error);
    } finally {
      submittingRef.current = false;
    }
  });

  const nameRegistration = register("name");

  return (
    <form onSubmit={submit} noValidate>
      <fieldset disabled={isSubmitting} className="space-y-4">
        <div className="grid gap-1.5">
          <label
            htmlFor={nameId}
            className="text-sm font-medium text-slate-800"
          >
            Name
          </label>
          <input
            {...nameRegistration}
            ref={(element) => {
              nameRegistration.ref(element);
              nameInputRef.current = element;
            }}
            id={nameId}
            type="text"
            autoComplete="off"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? nameErrorId : undefined}
            className="w-full rounded border border-slate-400 bg-white px-3 py-2 text-sm text-slate-900"
          />
          {errors.name && (
            <p id={nameErrorId} role="alert" className="text-sm text-red-700">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="grid gap-1.5">
          <label
            htmlFor={emailId}
            className="text-sm font-medium text-slate-800"
          >
            Email
          </label>
          <input
            {...register("email")}
            id={emailId}
            type="email"
            autoComplete="off"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? emailErrorId : undefined}
            className="w-full rounded border border-slate-400 bg-white px-3 py-2 text-sm text-slate-900"
          />
          {errors.email && (
            <p id={emailErrorId} role="alert" className="text-sm text-red-700">
              {errors.email.message}
            </p>
          )}
        </div>

        {props.mode === "create" ? (
          <div className="grid gap-1.5">
            <label
              htmlFor={passwordId}
              className="text-sm font-medium text-slate-800"
            >
              Password
            </label>
            <input
              {...register("password")}
              id={passwordId}
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? passwordErrorId : undefined}
              className="w-full rounded border border-slate-400 bg-white px-3 py-2 text-sm text-slate-900"
            />
            {errors.password && (
              <p
                id={passwordErrorId}
                role="alert"
                className="text-sm text-red-700"
              >
                {errors.password.message}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-700">
            <span className="font-medium text-slate-800">Role:</span>{" "}
            {props.user.role}
          </p>
        )}

        <div className="grid gap-1.5">
          <label
            htmlFor={interestsId}
            className="text-sm font-medium text-slate-800"
          >
            Interests, separated by commas
          </label>
          <input
            {...register("interests")}
            id={interestsId}
            type="text"
            placeholder="chess, reading"
            aria-invalid={Boolean(errors.interests)}
            aria-describedby={errors.interests ? interestsErrorId : undefined}
            className="w-full rounded border border-slate-400 bg-white px-3 py-2 text-sm text-slate-900"
          />
          {errors.interests && (
            <p
              id={interestsErrorId}
              role="alert"
              className="text-sm text-red-700"
            >
              {errors.interests.message}
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
                : "Create user"}
          </button>

          {props.mode === "edit" && (
            <button
              type="button"
              onClick={props.onCancel}
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
