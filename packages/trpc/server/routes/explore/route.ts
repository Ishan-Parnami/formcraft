import { z } from "zod";
import { eq, and, ilike, desc, count } from "@formforge/db";
import db, { forms, themes } from "@formforge/db";
import { publicProcedure, router } from "../../trpc";

export const exploreRouter = router({
  listPublicForms: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(50).default(12),
        category: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;
      const query = db
        .select()
        .from(forms)
        .where(and(eq(forms.isPublished, true), eq(forms.visibility, "public")))
        .orderBy(desc(forms.createdAt))
        .limit(input.limit)
        .offset(offset);

      const data = await query;
      const countResult = await db
        .select({ total: count() })
        .from(forms)
        .where(and(eq(forms.isPublished, true), eq(forms.visibility, "public")));
      const total = countResult[0]?.total ?? 0;

      return { forms: data, total, page: input.page };
    }),

  getFeaturedForms: publicProcedure.query(async () => {
    return db
      .select()
      .from(forms)
      .where(and(eq(forms.isPublished, true), eq(forms.visibility, "public")))
      .orderBy(desc(forms.createdAt))
      .limit(6);
  }),

  listThemes: publicProcedure.query(async () => {
    return db.select().from(themes);
  }),
});
