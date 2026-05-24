import { z } from "zod";
import { eq, and, desc, count } from "@formforge/db";
import db, { forms, themes } from "@formforge/db";
import { publicProcedure, router } from "../../trpc";

const FormSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  userId: z.string(),
  isPublished: z.boolean().nullable(),
  visibility: z.string().nullable(),
  theme: z.unknown(),
  settings: z.unknown(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

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

export const exploreRouter = router({
  listPublicForms: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/explore/forms',
        tags: ['Explore'],
        summary: 'Browse public forms',
        protect: false,
      },
    })
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(50).default(12),
        category: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .output(z.object({ forms: z.array(FormSchema), total: z.number(), page: z.number() }))
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

  getFeaturedForms: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/explore/featured',
        tags: ['Explore'],
        summary: 'Get featured public forms',
        protect: false,
      },
    })
    .input(z.object({}))
    .output(z.array(FormSchema))
    .query(async () => {
    return db
      .select()
      .from(forms)
      .where(and(eq(forms.isPublished, true), eq(forms.visibility, "public")))
      .orderBy(desc(forms.createdAt))
      .limit(6);
  }),

  listThemes: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/explore/themes',
        tags: ['Explore'],
        summary: 'List all themes (public)',
        protect: false,
      },
    })
    .input(z.object({}))
    .output(z.array(ThemeSchema))
    .query(async () => {
    return db.select().from(themes);
  }),
});
