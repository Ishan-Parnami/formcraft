import { z } from "zod";
import { eq } from "@formforge/db";
import db, { themes } from "@formforge/db";
import { publicProcedure, router } from "../../trpc";

const ThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  category: z.string().nullable(),
  config: z.unknown(),
  previewImage: z.string().nullable(),
  isDefault: z.boolean().nullable(),
  createdAt: z.date().nullable(),
});

export const themesRouter = router({
  list: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/themes',
        tags: ['Themes'],
        summary: 'List all available themes',
        protect: false,
      },
    })
    .input(z.object({}))
    .output(z.array(ThemeSchema))
    .query(async () => {
    return db.select().from(themes);
  }),

  getBySlug: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/themes/{slug}',
        tags: ['Themes'],
        summary: 'Get a theme by slug',
        protect: false,
      },
    })
    .input(z.object({ slug: z.string() }))
    .output(ThemeSchema.nullable())
    .query(async ({ input }) => {
    const [theme] = await db.select().from(themes).where(eq(themes.slug, input.slug));
    return theme ?? null;
  }),
});
