import { z } from "zod";
import { eq, and, count, avg, sql } from "@formcraft/db";
import db, { forms, responses, fields, formViews } from "@formcraft/db";
import { protectedProcedure, router } from "../../trpc";

export const analyticsRouter = router({
  getFormStats: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [form] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)));
      if (!form) throw new Error("Form not found");

      const totalResponsesResult = await db
        .select({ totalResponses: count() })
        .from(responses)
        .where(eq(responses.formId, input.formId));
      const totalResponses = totalResponsesResult[0]?.totalResponses ?? 0;

      const totalViewsResult = await db
        .select({ totalViews: count() })
        .from(formViews)
        .where(eq(formViews.formId, input.formId));
      const totalViews = totalViewsResult[0]?.totalViews ?? 0;

      const completionRate =
        totalViews > 0 ? Math.round((totalResponses / totalViews) * 100) : 0;

      const avgTimeResult = await db
        .select({ avg: avg(responses.completionTime) })
        .from(responses)
        .where(eq(responses.formId, input.formId));

      const avgCompletionTime = avgTimeResult[0]?.avg
        ? Math.round(Number(avgTimeResult[0].avg))
        : 0;

      const responsesByDay = await db
        .select({
          day: sql<string>`date_trunc('day', ${responses.createdAt})::date::text`,
          count: count(),
        })
        .from(responses)
        .where(eq(responses.formId, input.formId))
        .groupBy(sql`date_trunc('day', ${responses.createdAt})`);

      return {
        totalViews,
        totalResponses,
        completionRate,
        avgCompletionTime,
        responsesByDay,
      };
    }),

  getFieldStats: protectedProcedure
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

      return formFields.map((field) => {
        const answers = data
          .map((r) => {
            const a = (r.answers ?? {}) as Record<string, unknown>;
            return a[field.id];
          })
          .filter((v) => v !== undefined && v !== null && v !== "");

        return {
          fieldId: field.id,
          label: field.label,
          type: field.type,
          responseCount: answers.length,
          answers,
        };
      });
    }),
});
