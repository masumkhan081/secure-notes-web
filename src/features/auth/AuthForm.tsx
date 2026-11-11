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
    <form onSubmit={submit} noValidate>
      <h2>{mode === "login" ? "Log in" : "Create account"}</h2>

      <fieldset disabled={isSubmitting}>
        {mode === "register" && (
          <label>
            Name
            <input
              {...register("name")}
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <span id="name-error" role="alert">
                {errors.name.message}
              </span>
            )}
          </label>
        )}

        <label>
          Email
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <span id="email-error" role="alert">
              {errors.email.message}
            </span>
          )}
        </label>

        <label>
          Password
          <input
            {...register("password")}
            type="password"
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? "password-error" : undefined
            }
          />
          {errors.password && (
            <span id="password-error" role="alert">
              {errors.password.message}
            </span>
          )}
        </label>

        {mode === "register" && (
          <label>
            Interests, separated by commas
            <input
              {...register("interests")}
              placeholder="chess, reading"
              aria-invalid={Boolean(errors.interests)}
              aria-describedby={
                errors.interests ? "interests-error" : undefined
              }
            />
            {errors.interests && (
              <span id="interests-error" role="alert">
                {errors.interests.message}
              </span>
            )}
          </label>
        )}

        {errors.root && <p role="alert">{errors.root.message}</p>}

        <button type="submit">
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