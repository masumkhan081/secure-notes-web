import { z } from "zod";
import { pageInfoSchema } from "../../lib/pagination";
import { parseInterests, userSchema } from "../auth/auth.schema";
import { noteSchema } from "../notes/notes.schema";

export const adminUsersPageSchema = z.object({
  items: z.array(userSchema),
  pageInfo: pageInfoSchema,
});

export const adminNoteSchema = noteSchema.extend({
  ownerId: z.string(),
});

export const adminNoteResponseSchema = z.object({
  note: adminNoteSchema,
});

export const adminNotesPageSchema = z.object({
  items: z.array(adminNoteSchema),
  pageInfo: pageInfoSchema,
});

export const adminInterestGroupSchema = z.object({
  interest: z.string(),
  userCount: z.number().int().nonnegative(),
});

export const adminInterestsPageSchema = z.object({
  items: z.array(adminInterestGroupSchema),
  pageInfo: pageInfoSchema,
});

export const adminInterestUsersPageSchema = z.object({
  interest: z.string(),
  items: z.array(userSchema),
  pageInfo: pageInfoSchema,
});

export type AdminUsersPage = z.infer<typeof adminUsersPageSchema>;
export type AdminNote = z.infer<typeof adminNoteSchema>;
export type AdminNotesPage = z.infer<typeof adminNotesPageSchema>;
export type AdminInterestGroup = z.infer<typeof adminInterestGroupSchema>;
export type AdminInterestsPage = z.infer<typeof adminInterestsPageSchema>;
export type AdminInterestUsersPage = z.infer<
  typeof adminInterestUsersPageSchema
>;

export type CreateAdminUserPayload = {
  name: string;
  email: string;
  password: string;
  interests: string[];
};

export type UpdateAdminUserPayload = {
  name: string;
  email: string;
  interests: string[];
};

export function createAdminUserFormSchema(mode: "create" | "edit") {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, "Enter a name.")
        .max(100, "Name must be at most 100 characters."),
      email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Enter a valid email address.")
        .max(254, "Email must be at most 254 characters."),
      password: z.string(),
      interests: z.string(),
    })
    .superRefine((values, context) => {
      if (mode === "create") {
        if (values.password.length < 12) {
          context.addIssue({
            code: "custom",
            path: ["password"],
            message: "Use at least 12 characters.",
          });
        } else if (values.password.length > 128) {
          context.addIssue({
            code: "custom",
            path: ["password"],
            message: "Use at most 128 characters.",
          });
        }
      }

      const interests = parseInterests(values.interests);
      if (
        interests.length > 10 ||
        interests.some((interest) => interest.length > 40)
      ) {
        context.addIssue({
          code: "custom",
          path: ["interests"],
          message: "Use up to 10 interests, each 1 to 40 characters.",
        });
      }
    });
}
