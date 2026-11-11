import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["USER", "ADMIN"]),
  interests: z.array(z.string()),
});

export const userResponseSchema = z.object({
  user: userSchema,
});

export const loginResponseSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal("Bearer"),
  expiresIn: z.number().positive(),
  user: userSchema,
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type User = z.infer<typeof userSchema>;

export function createAuthFormSchema(mode: "login" | "register") {
  return z
    .object({
      name: z.string().trim().max(100),
      email: z.string().trim().toLowerCase().email().max(254),
      password: z.string().min(1).max(128),
      interests: z.string().max(500),
    })
    .superRefine((values, context) => {
      if (mode !== "register") return;

      if (!values.name) {
        context.addIssue({
          code: "custom",
          path: ["name"],
          message: "Enter your name.",
        });
      }

      if (values.password.length < 12) {
        context.addIssue({
          code: "custom",
          path: ["password"],
          message: "Use at least 12 characters.",
        });
      }

      const interests = parseInterests(values.interests);

      if (
        interests.length > 10 ||
        interests.some((interest) => interest.length > 40)
      ) {
        context.addIssue({
          code: "custom",
          path: ["interests"],
          message: "Use up to 10 interests, each at most 40 characters.",
        });
      }
    });
}

export function parseInterests(value: string): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((interest) => interest.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}