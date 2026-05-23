import { z } from "zod";
import { eq, and, count, avg, sql, desc } from "@formforge/db";
import db, { forms, responses, fields, formViews } from "@formforge/db";
import { protectedProcedure, router } from "../../trpc";

export const analyticsRouter = router({
  getFormStats: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const formResult = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)));
      if (!formResult[0]) throw new Error("Form not found");

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

      const completionRate = totalViews > 0 ? Math.round((totalResponses / totalViews) * 100) : 0;

      const avgTimeResult = await db
        .select({ avg: avg(responses.completionTime) })
        .from(responses)
        .where(eq(responses.formId, input.formId));
      const avgCompletionTime = avgTimeResult[0]?.avg
        ? Math.round(Number(avgTimeResult[0].avg))
        : 0;

      // Responses by day (last 30 days)
      const responsesByDay = await db
        .select({
          day: sql<string>`date_trunc('day', ${responses.createdAt})::date::text`,
          count: count(),
        })
        .from(responses)
        .where(
          and(
            eq(responses.formId, input.formId),
            sql`${responses.createdAt} >= now() - interval '30 days'`,
          ),
        )
        .groupBy(sql`date_trunc('day', ${responses.createdAt})`)
        .orderBy(sql`date_trunc('day', ${responses.createdAt})`);

      // Top referrers
      const topReferrersResult = await db
        .select({ referrer: formViews.referrer, count: count() })
        .from(formViews)
        .where(and(eq(formViews.formId, input.formId), sql`${formViews.referrer} is not null`))
        .groupBy(formViews.referrer)
        .orderBy(desc(count()))
        .limit(3);
      const topReferrers = topReferrersResult.map((r) => ({
        referrer: r.referrer ?? "direct",
        count: r.count,
      }));

      return {
        totalViews,
        totalResponses,
        completionRate,
        avgCompletionTime,
        responsesByDay,
        topReferrers,
      };
    }),

  getFieldStats: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const formResult = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)));
      if (!formResult[0]) throw new Error("Form not found");

      const formFields = await db
        .select()
        .from(fields)
        .where(eq(fields.formId, input.formId))
        .orderBy(fields.order);

      const data = await db.select().from(responses).where(eq(responses.formId, input.formId));

      return formFields.map((field) => {
        const rawAnswers = data
          .map((r) => {
            const a = (r.answers ?? {}) as Record<string, unknown>;
            return a[field.id];
          })
          .filter((v) => v !== undefined && v !== null && v !== "");

        // Per-type stats
        let distribution: Record<string, number> | undefined;
        let avgRating: number | undefined;
        let avgLength: number | undefined;
        let trueCount: number | undefined;
        let falseCount: number | undefined;

        if (field.type === "rating") {
          const nums = rawAnswers.map(Number).filter((n) => !isNaN(n));
          avgRating =
            nums.length > 0
              ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
              : 0;
          const opts = (field.validations as { max?: number } | null)?.max ?? 5;
          distribution = {};
          for (let i = 1; i <= opts; i++) distribution[String(i)] = 0;
          for (const n of nums) distribution[String(n)] = (distribution[String(n)] ?? 0) + 1;
        } else if (field.type === "single_select" || field.type === "dropdown") {
          distribution = {};
          for (const v of rawAnswers) {
            const key = String(v);
            distribution[key] = (distribution[key] ?? 0) + 1;
          }
        } else if (field.type === "multi_select") {
          distribution = {};
          for (const v of rawAnswers) {
            const arr = Array.isArray(v) ? v : [v];
            for (const item of arr) {
              const key = String(item);
              distribution[key] = (distribution[key] ?? 0) + 1;
            }
          }
        } else if (field.type === "short_text" || field.type === "long_text") {
          const lengths = rawAnswers.map((v) => String(v).length);
          avgLength =
            lengths.length > 0
              ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
              : 0;
        } else if (field.type === "checkbox") {
          trueCount = rawAnswers.filter(Boolean).length;
          falseCount = rawAnswers.length - trueCount;
        }

        return {
          fieldId: field.id,
          label: field.label,
          type: field.type,
          responseCount: rawAnswers.length,
          distribution,
          avgRating,
          avgLength,
          trueCount,
          falseCount,
        };
      });
    }),
});
