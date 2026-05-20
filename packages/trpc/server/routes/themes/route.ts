import { z } from "zod";
import { eq } from "@formcraft/db";
import db, { themes } from "@formcraft/db";
import { publicProcedure, router } from "../../trpc";

export const themesRouter = router({
  list: publicProcedure.query(async () => {
    return db.select().from(themes);
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const [theme] = await db.select().from(themes).where(eq(themes.slug, input.slug));
      return theme ?? null;
    }),
});
