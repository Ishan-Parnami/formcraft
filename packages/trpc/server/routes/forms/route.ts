import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq, and, ne, asc } from "@formforge/db";
import db, { forms, fields } from "@formforge/db";
import { CreateFormSchema, UpdateFormSchema } from "@formforge/schemas/form";
import { generateUniqueSlug } from "@formforge/utils";
import bcrypt from "bcryptjs";
import { publicProcedure, protectedProcedure, router } from "../../trpc";

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
  publishedSnapshot: z.unknown(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

const FieldSchema = z.object({
  id: z.string(),
  formId: z.string(),
  type: z.string(),
  label: z.string(),
  placeholder: z.string().nullable(),
  description: z.string().nullable(),
  required: z.boolean().nullable(),
  order: z.number(),
  options: z.unknown(),
  validations: z.unknown(),
  conditionalLogic: z.unknown(),
  createdAt: z.date().nullable(),
});

const FormWithFieldsSchema = FormSchema.extend({ fields: z.array(FieldSchema) });

export const formsRouter = router({
  create: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/forms',
        tags: ['Forms'],
        summary: 'Create a new form',
        protect: true,
      },
    })
    .input(CreateFormSchema)
    .output(FormSchema)
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
    if (!form) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create form' });
    return form;
  }),

  list: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/forms',
        tags: ['Forms'],
        summary: 'List all forms for the authenticated user',
        protect: true,
      },
    })
    .input(z.object({}))
    .output(z.array(FormSchema))
    .query(async ({ ctx }) => {
    return db.select().from(forms).where(eq(forms.userId, ctx.user.id));
  }),

  getById: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/forms/{formId}',
        tags: ['Forms'],
        summary: 'Get form by ID',
        protect: true,
      },
    })
    .input(z.object({ formId: z.string().uuid() }))
    .output(FormWithFieldsSchema.nullable())
    .query(async ({ input, ctx }) => {
      const [form] = await db.select().from(forms).where(eq(forms.id, input.formId));
      if (!form) return null;

      // Unpublished forms are only visible to owners
      if (!form.isPublished && (!ctx.user || ctx.user.id !== form.userId)) return null;

      const formFields = await db.select().from(fields).where(eq(fields.formId, form.id));

      return { ...form, fields: formFields };
    }),

  getBySlug: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/public/forms/{slug}',
        tags: ['Forms'],
        summary: 'Get published form by slug (public)',
        protect: false,
      },
    })
    .input(z.object({ slug: z.string() }))
    .output(FormWithFieldsSchema.nullable())
    .query(async ({ input }) => {
    const [form] = await db.select().from(forms).where(eq(forms.slug, input.slug));
    if (!form || !form.isPublished) return null;

    const formFields = await db.select().from(fields).where(eq(fields.formId, form.id));

    return { ...form, fields: formFields };
  }),

  update: protectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/forms/{formId}',
        tags: ['Forms'],
        summary: 'Update a form',
        protect: true,
      },
    })
    .input(z.object({ formId: z.string().uuid() }).merge(UpdateFormSchema))
    .output(FormSchema)
    .mutation(async ({ ctx, input }) => {
      const { formId, ...data } = input;
      const [form] = await db
        .update(forms)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(forms.id, formId), eq(forms.userId, ctx.user.id)))
        .returning();
      if (!form) throw new TRPCError({ code: 'NOT_FOUND', message: 'Form not found' });
      return form;
    }),

  publish: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/forms/{formId}/publish',
        tags: ['Forms'],
        summary: 'Publish a form',
        protect: true,
      },
    })
    .input(z.object({ formId: z.string().uuid() }))
    .output(FormSchema)
    .mutation(async ({ ctx, input }) => {
      const [currentForm] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)));
      if (!currentForm) throw new TRPCError({ code: 'NOT_FOUND', message: 'Form not found' });

      const formFields = await db
        .select()
        .from(fields)
        .where(eq(fields.formId, input.formId))
        .orderBy(asc(fields.order));

      if (formFields.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Add at least one field before publishing",
        });
      }

      const OPTION_TYPES = ["dropdown", "single_select", "multi_select"];
      const hasEmptyOptions = formFields.some(
        (f) =>
          OPTION_TYPES.includes(f.type) &&
          (!(f.options as unknown[]) || (f.options as unknown[]).length === 0),
      );
      if (hasEmptyOptions) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "All dropdown, select, and checkbox fields must have at least one option before publishing.",
        });
      }

      const snapshot = { fields: formFields, theme: currentForm.theme ?? null };

      const [form] = await db
        .update(forms)
        .set({ isPublished: true, publishedSnapshot: snapshot, updatedAt: new Date() })
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)))
        .returning();
      if (!form) throw new TRPCError({ code: 'NOT_FOUND', message: 'Form not found' });
      return form;
    }),

  unpublish: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/forms/{formId}/unpublish',
        tags: ['Forms'],
        summary: 'Unpublish a form',
        protect: true,
      },
    })
    .input(z.object({ formId: z.string().uuid() }))
    .output(FormSchema)
    .mutation(async ({ ctx, input }) => {
      const [form] = await db
        .update(forms)
        .set({ isPublished: false, updatedAt: new Date() })
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)))
        .returning();
      if (!form) throw new TRPCError({ code: 'NOT_FOUND', message: 'Form not found' });
      return form;
    }),

  delete: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/forms/{formId}',
        tags: ['Forms'],
        summary: 'Delete a form',
        protect: true,
      },
    })
    .input(z.object({ formId: z.string().uuid() }))
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(forms).where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)));
      return { success: true };
    }),

  clone: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/forms/{formId}/clone',
        tags: ['Forms'],
        summary: 'Clone a form',
        protect: true,
      },
    })
    .input(z.object({ formId: z.string().uuid() }))
    .output(FormSchema)
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
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/forms/{formId}/slug',
        tags: ['Forms'],
        summary: 'Update form slug',
        protect: true,
      },
    })
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
    .output(FormSchema)
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
      if (!form) throw new TRPCError({ code: 'NOT_FOUND', message: 'Form not found' });
      return form;
    }),

  updatePassword: protectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/forms/{formId}/password',
        tags: ['Forms'],
        summary: 'Set or remove form password',
        protect: true,
      },
    })
    .input(z.object({ formId: z.string().uuid(), password: z.string().min(4).nullable() }))
    .output(FormSchema)
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
      if (!form) throw new TRPCError({ code: 'NOT_FOUND', message: 'Form not found' });
      return form;
    }),

  verifyFormPassword: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/public/forms/{formId}/verify-password',
        tags: ['Forms'],
        summary: 'Verify form password (public)',
        protect: false,
      },
    })
    .input(z.object({ formId: z.string().uuid(), password: z.string() }))
    .output(z.object({ valid: z.boolean() }))
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

  generateSlug: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/forms/generate-slug',
        tags: ['Forms'],
        summary: 'Generate a unique slug from a title',
        protect: false,
      },
    })
    .input(z.object({ title: z.string() }))
    .output(z.object({ slug: z.string() }))
    .query(({ input }) => {
    return { slug: generateUniqueSlug(input.title) };
  }),
});
