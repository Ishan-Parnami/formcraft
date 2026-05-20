import { z } from "zod";
import { eq, and, desc, count, sql } from "@formcraft/db";
import db, { responses, forms, fields } from "@formcraft/db";
import { SubmitResponseSchema, ListResponsesSchema } from "@formcraft/schemas/response";
import { hashIp } from "@formcraft/utils";
import { publicProcedure, protectedProcedure, router } from "../../trpc";
import type { Context } from "../../context";

// In-memory rate limit store: key = `${formId}:${ipHash}`, value = { count, resetAt }
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(formId: string, ipHash: string): boolean {
  const key = `${formId}:${ipHash}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export const responsesRouter = router({
  submit: publicProcedure
    .input(SubmitResponseSchema)
    .mutation(async ({ input, ctx }) => {
      const typedCtx = ctx as Context & { req: { ip?: string; headers: Record<string, string> } };
      const ip = typedCtx.req?.ip ?? "unknown";
      const ipHash = hashIp(ip);

      if (!checkRateLimit(input.formId, ipHash)) {
        throw new Error("Too many submissions. Try again later.");
      }

      const [form] = await db.select().from(forms).where(eq(forms.id, input.formId));
      if (!form || !form.isPublished) throw new Error("Form not available");

      const settings = form.settings as { maxResponses?: number; expiresAt?: string } | null;
      if (settings?.expiresAt && new Date(settings.expiresAt) < new Date()) {
        throw new Error("This form has expired");
      }
      if (settings?.maxResponses) {
        const countResult = await db
          .select({ value: count() })
          .from(responses)
          .where(eq(responses.formId, input.formId));
        const currentCount = countResult[0]?.value ?? 0;
        if (currentCount >= settings.maxResponses) throw new Error("This form has reached its response limit");
      }

      const insertResult = await db
        .insert(responses)
        .values({
          formId: input.formId,
          respondentEmail: input.respondentEmail,
          ipHash,
          userAgent: (typedCtx.req?.headers?.["user-agent"] as string | undefined) ?? undefined,
          answers: input.answers,
          completionTime: input.completionTime,
        })
        .returning();
      const response = insertResult[0];
      if (!response) throw new Error("Failed to save response");

      return { success: true, responseId: response.id };
    }),

  list: protectedProcedure
    .input(ListResponsesSchema)
    .query(async ({ ctx, input }) => {
      const [form] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)));
      if (!form) throw new Error("Form not found");

      const offset = (input.page - 1) * input.limit;
      const data = await db
        .select()
        .from(responses)
        .where(eq(responses.formId, input.formId))
        .orderBy(desc(responses.createdAt))
        .limit(input.limit)
        .offset(offset);

      const totalResult = await db
        .select({ value: count() })
        .from(responses)
        .where(eq(responses.formId, input.formId));
      const total = totalResult[0]?.value ?? 0;

      return { responses: data, total, page: input.page };
    }),

  getById: protectedProcedure
    .input(z.object({ responseId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [response] = await db
        .select()
        .from(responses)
        .where(eq(responses.id, input.responseId));
      if (!response) throw new Error("Response not found");

      const [form] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, response.formId), eq(forms.userId, ctx.user.id)));
      if (!form) throw new Error("Unauthorized");

      return response;
    }),

  delete: protectedProcedure
    .input(z.object({ responseId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [response] = await db
        .select()
        .from(responses)
        .where(eq(responses.id, input.responseId));
      if (!response) throw new Error("Response not found");

      const [form] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, response.formId), eq(forms.userId, ctx.user.id)));
      if (!form) throw new Error("Unauthorized");

      await db.delete(responses).where(eq(responses.id, input.responseId));
      return { success: true };
    }),

  exportCsv: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [form] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)));
      if (!form) throw new Error("Form not found");

      const formFields = await db
        .select()
        .from(fields)
        .where(eq(fields.formId, input.formId));
      const data = await db
        .select()
        .from(responses)
        .where(eq(responses.formId, input.formId));

      const headers = ["id", "submitted_at", "email", ...formFields.map((f) => f.label)];
      const rows = data.map((r) => {
        const answers = (r.answers ?? {}) as Record<string, unknown>;
        return [
          r.id,
          r.createdAt?.toISOString() ?? "",
          r.respondentEmail ?? "",
          ...formFields.map((f) => String(answers[f.id] ?? "")),
        ].join(",");
      });

      return [headers.join(","), ...rows].join("\n");
    }),
});
