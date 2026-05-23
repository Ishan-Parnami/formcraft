import { z } from "zod";
import { eq, and } from "@formforge/db";
import db, { fields, forms } from "@formforge/db";
import { CreateFieldSchema, UpdateFieldSchema, ReorderFieldsSchema } from "@formforge/schemas/form";
import { protectedProcedure, router } from "../../trpc";

export const fieldsRouter = router({
  create: protectedProcedure
    .input(z.object({ formId: z.string().uuid() }).merge(CreateFieldSchema))
    .mutation(async ({ ctx, input }) => {
      // Verify form ownership
      const [form] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)));
      if (!form) throw new Error("Form not found");

      // Get next order
      const existingFields = await db
        .select()
        .from(fields)
        .where(eq(fields.formId, input.formId));
      const maxOrder = existingFields.reduce((m, f) => Math.max(m, f.order), -1);

      const [field] = await db
        .insert(fields)
        .values({
          formId: input.formId,
          type: input.type,
          label: input.label,
          placeholder: input.placeholder,
          description: input.description,
          required: input.required ?? false,
          order: input.order ?? maxOrder + 1,
          options: input.options,
          validations: input.validations,
          conditionalLogic: input.conditionalLogic,
        })
        .returning();
      return field;
    }),

  update: protectedProcedure
    .input(z.object({ fieldId: z.string().uuid() }).merge(UpdateFieldSchema))
    .mutation(async ({ ctx, input }) => {
      const { fieldId, ...data } = input;
      // Verify ownership via form
      const [field] = await db.select().from(fields).where(eq(fields.id, fieldId));
      if (!field) throw new Error("Field not found");
      const [form] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, field.formId), eq(forms.userId, ctx.user.id)));
      if (!form) throw new Error("Unauthorized");

      const [updated] = await db
        .update(fields)
        .set(data)
        .where(eq(fields.id, fieldId))
        .returning();
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ fieldId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [field] = await db.select().from(fields).where(eq(fields.id, input.fieldId));
      if (!field) throw new Error("Field not found");
      const [form] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, field.formId), eq(forms.userId, ctx.user.id)));
      if (!form) throw new Error("Unauthorized");

      await db.delete(fields).where(eq(fields.id, input.fieldId));
      return { success: true };
    }),

  reorder: protectedProcedure
    .input(ReorderFieldsSchema)
    .mutation(async ({ ctx, input }) => {
      const [form] = await db
        .select()
        .from(forms)
        .where(and(eq(forms.id, input.formId), eq(forms.userId, ctx.user.id)));
      if (!form) throw new Error("Form not found");

      await Promise.all(
        input.fieldIds.map((id, index) =>
          db.update(fields).set({ order: index }).where(eq(fields.id, id))
        )
      );
      return { success: true };
    }),
});
