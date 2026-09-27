import { z } from "zod";
export const localeSchema = z.enum(["en", "hi"]);
export const emailSchema = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((value) => value.toLowerCase());
export const passwordSchema = z.string().min(12).max(128);
export const nameSchema = z.string().trim().min(1).max(80);
export const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
export const registrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  display_name: nameSchema,
  locale: localeSchema,
});
export const confirmationSchema = z.object({
  token_hash: z.string().regex(/^[A-Za-z0-9_-]{20,256}$/),
  type: z.enum(["signup", "recovery"]),
});
export type AuthState = {
  status: "idle" | "error" | "success";
  message: string;
};
export const initialAuthState: AuthState = { status: "idle", message: "" };
