import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "../../lib/api";
import {
  createAuthFormSchema,
  loginResponseSchema,
  userResponseSchema,
  parseInterests,
  type LoginResponse,
} from "./auth.schema";

type Props = {
  mode: "login" | "register";
  onLogin: (session: LoginResponse) => void;
  onRegistered: () => void;
};

export function AuthForm({ mode, onLogin, onRegistered }: Props) {
  const schema = createAuthFormSchema(mode);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      interests: "",
    },
  });

  const submit = handleSubmit(async (values) => {
    try {
      if (mode === "register") {
        await apiRequest("/api/auth/register", userResponseSchema, {
          method: "POST",
          body: {
            name: values.name,
            email: values.email,
            password: values.password,
            interests: parseInterests(values.interests),
          },
        });

        reset();
        onRegistered();
        return;
      }

      const session = await apiRequest(
        "/api/auth/login",
        loginResponseSchema,
        {
          method: "POST",
          body: {
            email: values.email,
            password: values.password,
          },
        },
      );

      reset();
      onLogin(session);
    } catch (error: unknown) {
      setError("root", {
        message:
          error instanceof Error ? error.message : "Request failed.",
      });
    }
  });

  return (
    <form
      onSubmit={submit}
      noValidate
      className="mt-6 max-w-md rounded border border-slate-300 bg-white p-5"
    >
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        {mode === "login" ? "Log in" : "Create account"}
      </h2>

      <fieldset disabled={isSubmitting} className="space-y-4">
        {mode === "register" && (
          <label className="grid gap-1.5 text-sm font-medium text-slate-800">
            Name
            <input
              {...register("name")}
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              className="w-full rounded border border-slate-400 bg-white px-3 py-2 text-sm font-normal text-slate-900"
            />
            {errors.name && (
              <span
                id="name-error"
                role="alert"
                className="text-sm font-normal text-red-700"
              >
                {errors.name.message}
              </span>
            )}
          </label>
        )}

        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
          Email
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="w-full rounded border border-slate-400 bg-white px-3 py-2 text-sm font-normal text-slate-900"
          />
          {errors.email && (
            <span
              id="email-error"
              role="alert"
              className="text-sm font-normal text-red-700"
            >
              {errors.email.message}
            </span>
          )}
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-slate-800">
          Password
          <input
            {...register("password")}
            type="password"
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            className="w-full rounded border border-slate-400 bg-white px-3 py-2 text-sm font-normal text-slate-900"
          />
          {errors.password && (
            <span
              id="password-error"
              role="alert"
              className="text-sm font-normal text-red-700"
            >
              {errors.password.message}
            </span>
          )}
        </label>

        {mode === "register" && (
          <label className="grid gap-1.5 text-sm font-medium text-slate-800">
            Interests, separated by commas
            <input
              {...register("interests")}
              placeholder="chess, reading"
              aria-invalid={Boolean(errors.interests)}
              aria-describedby={
                errors.interests ? "interests-error" : undefined
              }
              className="w-full rounded border border-slate-400 bg-white px-3 py-2 text-sm font-normal text-slate-900"
            />
            {errors.interests && (
              <span
                id="interests-error"
                role="alert"
                className="text-sm font-normal text-red-700"
              >
                {errors.interests.message}
              </span>
            )}
          </label>
        )}

        {errors.root && (
          <p role="alert" className="text-sm text-red-700">
            {errors.root.message}
          </p>
        )}

        <button
          type="submit"
          className="rounded border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {isSubmitting
            ? "Please wait..."
            : mode === "login"
              ? "Log in"
              : "Create account"}
        </button>
      </fieldset>
    </form>
  );
}