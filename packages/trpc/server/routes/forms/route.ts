import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, ne } from "@formforge/db";
import db, { forms, fields } from "@formforge/db";
import { CreateFormSchema, UpdateFormSchema } from "@formforge/schemas/form";
import { generateUniqueSlug } from "@formforge/utils";
import bcrypt from "bcryptjs";
import { publicProcedure, protectedProcedure, router } from "../../trpc";

export const formsRouter = router({
  create: protectedProcedure.input(CreateFormSchema).mutation(async ({ ctx, input }) => {
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

      const formFields = await db.select().from(fields).where(eq(fields.formId, form.id));

      return { ...form, fields: formFields };
    }),

  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const [form] = await db.select().from(forms).where(eq(forms.slug, input.slug));
    if (!form || !form.isPublished) return null;

    const formFields = await db.select().from(fields).where(eq(fields.formId, form.id));

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
      const formFields = await db
        .select({ id: fields.id })
        .from(fields)
        .where(eq(fields.formId, input.formId));

      if (formFields.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Add at least one field before publishing",
        });
      }

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
      await db.delete(forms).where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)));
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

      const originalFields = await db.select().from(fields).where(eq(fields.formId, original.id));

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
          })),
        );
      }

      return newForm;
    }),

  updateSlug: protectedProcedure
    .input(
      z.object({
        formId: z.string().uuid(),
        slug: z
          .string()
          .min(3)
          .max(100)
          .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await db
        .select({ id: forms.id })
        .from(forms)
        .where(and(eq(forms.slug, input.slug), ne(forms.id, input.formId)));
      if (existing) throw new Error("This slug is already taken");

      const [form] = await db
        .update(forms)
        .set({ slug: input.slug, updatedAt: new Date() })
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)))
        .returning();
      return form;
    }),

  updatePassword: protectedProcedure
    .input(z.object({ formId: z.string().uuid(), password: z.string().min(4).nullable() }))
    .mutation(async ({ ctx, input }) => {
      let settingsPatch: Record<string, unknown>;
      if (input.password === null) {
        settingsPatch = { requirePassword: false, passwordHash: undefined };
      } else {
        const hash = await bcrypt.hash(input.password, 10);
        settingsPatch = { requirePassword: true, passwordHash: hash };
      }

      const [current] = await db
        .select({ settings: forms.settings })
        .from(forms)
        .where(eq(forms.id, input.formId));
      const merged = {
        ...((current?.settings as Record<string, unknown>) ?? {}),
        ...settingsPatch,
      };

      const [form] = await db
        .update(forms)
        .set({ settings: merged, updatedAt: new Date() })
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)))
        .returning();
      return form;
    }),

  verifyFormPassword: publicProcedure
    .input(z.object({ formId: z.string().uuid(), password: z.string() }))
    .mutation(async ({ input }) => {
      const [form] = await db
        .select({ settings: forms.settings })
        .from(forms)
        .where(eq(forms.id, input.formId));
      const settings = (form?.settings ?? {}) as Record<string, unknown>;
      if (!settings.requirePassword) return { valid: true };
      const hash = settings.passwordHash as string | undefined;
      if (!hash) return { valid: false };
      const valid = await bcrypt.compare(input.password, hash);
      return { valid };
    }),

  generateSlug: publicProcedure.input(z.object({ title: z.string() })).query(({ input }) => {
    return { slug: generateUniqueSlug(input.title) };
  }),
});
