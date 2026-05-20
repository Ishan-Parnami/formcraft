import { z } from "zod";

export const SubmitResponseSchema = z.object({
  formId: z.string().uuid(),
  answers: z.record(z.string(), z.unknown()),
  respondentEmail: z.string().email().optional(),
  completionTime: z.number().int().positive().optional(),
});

export const ListResponsesSchema = z.object({
  formId: z.string().uuid(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  filter: z.string().optional(),
});

export type SubmitResponseInput = z.infer<typeof SubmitResponseSchema>;
export type ListResponsesInput = z.infer<typeof ListResponsesSchema>;
