import { z } from "zod";
import { registrationSchema, localeSchema } from "@/lib/auth/validation";
const optionalText = z.string().trim().max(120).default("");
export const academicSchema = z
  .object({
    phone: z
      .string()
      .trim()
      .max(20)
      .regex(/^$|^\+?[0-9 ()-]{7,20}$/)
      .default(""),
    gender: z
      .enum(["", "female", "male", "nonbinary", "prefer_not", "self_describe"])
      .default(""),
    gender_description: optionalText,
    qualification: optionalText,
    specialization: optionalText,
    academic_status: optionalText,
    academic_year: optionalText,
  })
  .strict()
  .refine(
    (d) => d.gender !== "self_describe" || d.gender_description.length > 0,
    { path: ["gender_description"], message: "Required" },
  );
export const goalsSchema = z.object({
  exam_ids: z
  .array(z.string().uuid())
  .min(1)
  .max(20)
    .refine((ids) => new Set(ids).size === ids.length),
  target_year: z
    .union([
      z.literal(""),
      z.coerce
        .number()
        .int()
        .min(new Date().getFullYear())
        .max(new Date().getFullYear() + 15),
    ])
    .transform((v) => (v === "" ? null : v)),
  marketing: z.boolean(),
});
export const wizardSchema = registrationSchema
  .extend({
    confirm_password: z.string(),
    details: academicSchema,
    goals: goalsSchema,
    terms: z.literal("on"),
    privacy: z.literal("on"),
    terms_version: z.string().uuid(),
    privacy_version: z.string().uuid(),
  })
  .refine((v) => v.password === v.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords must match",
  });
export const academicKeys = [
  "phone",
  "gender",
  "gender_description",
  "qualification",
  "specialization",
  "academic_status",
  "academic_year",
] as const;
export function studentInput(form: FormData) {
  return {
    details: Object.fromEntries(
      academicKeys.map((k) => [k, form.get(k) ?? ""]),
    ),
    goals: {
      exam_ids: form.getAll("exam_ids"),
      target_year: form.get("target_year") ?? "",
      marketing: form.get("marketing") === "on",
    },
  };
}
export const studentProfileSchema = z.object({
  locale: localeSchema,
  details: academicSchema,
  goals: goalsSchema,
});
