import { z } from "zod";

export const FormThemeConfigSchema = z.object({
  primaryColor: z.string(),
  bgColor: z.string(),
  textColor: z.string(),
  accentColor: z.string(),
  fontFamily: z.string(),
  borderRadius: z.number(),
  buttonStyle: z.enum(["filled", "outline", "ghost"]),
  backgroundPattern: z.enum(["none", "dots", "grid", "waves"]).optional(),
});

export const FormSettingsSchema = z.object({
  submitButtonText: z.string().optional(),
  successMessage: z.string().optional(),
  redirectUrl: z.string().url().optional(),
  expiresAt: z.string().datetime().optional(),
  maxResponses: z.number().int().positive().optional(),
  requirePassword: z.boolean().optional(),
  passwordHash: z.string().optional(),
});

export const FieldOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const FieldValidationsSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  pattern: z.string().optional(),
  customMessage: z.string().optional(),
});

export const ConditionalLogicSchema = z.object({
  dependsOn: z.string(),
  operator: z.enum(["eq", "neq", "contains"]),
  value: z.unknown(),
  action: z.enum(["show", "hide"]),
});

export const FieldTypeSchema = z.enum([
  "short_text",
  "long_text",
  "email",
  "number",
  "single_select",
  "multi_select",
  "checkbox",
  "rating",
  "date",
  "dropdown",
]);

export const FormFieldSchema = z.object({
  id: z.string().uuid(),
  formId: z.string().uuid(),
  type: FieldTypeSchema,
  label: z.string().min(1),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().default(false),
  order: z.number().int(),
  options: z.array(FieldOptionSchema).optional(),
  validations: FieldValidationsSchema.optional(),
  conditionalLogic: ConditionalLogicSchema.optional(),
});

export const CreateFieldSchema = z.object({
  type: FieldTypeSchema,
  label: z.string().min(1),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().default(false),
  order: z.number().int().optional(),
  options: z.array(FieldOptionSchema).optional(),
  validations: FieldValidationsSchema.optional(),
  conditionalLogic: ConditionalLogicSchema.optional(),
});

export const UpdateFieldSchema = CreateFieldSchema.partial();

export const ReorderFieldsSchema = z.object({
  formId: z.string().uuid(),
  fieldIds: z.array(z.string().uuid()),
});

export const CreateFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  visibility: z.enum(["public", "unlisted"]).default("unlisted"),
});

export const UpdateFormSchema = CreateFormSchema.partial().extend({
  theme: FormThemeConfigSchema.optional(),
  settings: FormSettingsSchema.optional(),
});

export const PublishFormSchema = z.object({
  formId: z.string().uuid(),
});

export type FormThemeConfig = z.infer<typeof FormThemeConfigSchema>;
export type FormSettings = z.infer<typeof FormSettingsSchema>;
export type FieldOption = z.infer<typeof FieldOptionSchema>;
export type FieldValidations = z.infer<typeof FieldValidationsSchema>;
export type ConditionalLogic = z.infer<typeof ConditionalLogicSchema>;
export type FormField = z.infer<typeof FormFieldSchema>;
export type CreateFormInput = z.infer<typeof CreateFormSchema>;
export type UpdateFormInput = z.infer<typeof UpdateFormSchema>;
export type CreateFieldInput = z.infer<typeof CreateFieldSchema>;
export type UpdateFieldInput = z.infer<typeof UpdateFieldSchema>;
export type ReorderFieldsInput = z.infer<typeof ReorderFieldsSchema>;
