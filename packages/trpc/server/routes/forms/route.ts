import { z } from "zod";
import { eq, and } from "@formcraft/db";
import db, { forms, fields } from "@formcraft/db";
import { CreateFormSchema, UpdateFormSchema } from "@formcraft/schemas/form";
import { generateUniqueSlug, slugify } from "@formcraft/utils";
import { publicProcedure, protectedProcedure, router } from "../../trpc";

export const formsRouter = router({
  create: protectedProcedure
    .input(CreateFormSchema)
    .mutation(async ({ ctx, input }) => {
      const slug = generateUniqueSlug(input.title);
      const [form] = await db
        .insert(forms)
        .values({
          slug,
          title: input.title,
          description: input.description,
          visibility: input.visibility,
          userId: ctx.user.id,
        })
        .returning();
      return form;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(forms).where(eq(forms.userId, ctx.user.id));
  }),

  getById: publicProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const [form] = await db.select().from(forms).where(eq(forms.id, input.formId));
      if (!form) return null;

      // Unpublished forms are only visible to owners
      if (!form.isPublished && (!ctx.user || ctx.user.id !== form.userId)) return null;

      const formFields = await db
        .select()
        .from(fields)
        .where(eq(fields.formId, form.id));

      return { ...form, fields: formFields };
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const [form] = await db.select().from(forms).where(eq(forms.slug, input.slug));
      if (!form || !form.isPublished) return null;

      const formFields = await db
        .select()
        .from(fields)
        .where(eq(fields.formId, form.id));

      return { ...form, fields: formFields };
    }),

  update: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }).merge(UpdateFormSchema))
    .mutation(async ({ ctx, input }) => {
      const { formId, ...data } = input;
      const [form] = await db
        .update(forms)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(forms.id, formId), eq(forms.userId, ctx.user.id)))
        .returning();
      return form;
    }),

  publish: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [form] = await db
        .update(forms)
        .set({ isPublished: true, updatedAt: new Date() })
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)))
        .returning();
      return form;
    }),

  unpublish: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [form] = await db
        .update(forms)
        .set({ isPublished: false, updatedAt: new Date() })
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)))
        .returning();
      return form;
    }),

  delete: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(forms)
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)));
      return { success: true };
    }),

  clone: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [original] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)));
      if (!original) throw new Error("Form not found");

      const originalFields = await db
        .select()
        .from(fields)
        .where(eq(fields.formId, original.id));

      const newSlug = generateUniqueSlug(`${original.title} copy`);
      const cloneResult = await db
        .insert(forms)
        .values({
          slug: newSlug,
          title: `${original.title} (Copy)`,
          description: original.description ?? undefined,
          visibility: original.visibility ?? "unlisted",
          userId: ctx.user.id,
          theme: original.theme ?? undefined,
          settings: original.settings ?? undefined,
        })
        .returning();
      const newForm = cloneResult[0];
      if (!newForm) throw new Error("Failed to clone form");

      if (originalFields.length > 0) {
        await db.insert(fields).values(
          originalFields.map((f) => ({
            formId: newForm.id,
            type: f.type,
            label: f.label,
            placeholder: f.placeholder ?? undefined,
            description: f.description ?? undefined,
            required: f.required ?? false,
            order: f.order,
            options: f.options ?? undefined,
            validations: f.validations ?? undefined,
            conditionalLogic: f.conditionalLogic ?? undefined,
          }))
        );
      }

      return newForm;
    }),

  generateSlug: publicProcedure
    .input(z.object({ title: z.string() }))
    .query(({ input }) => {
      return { slug: generateUniqueSlug(input.title) };
    }),
});
