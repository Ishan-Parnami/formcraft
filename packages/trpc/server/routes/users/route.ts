import { z } from "zod";
import { eq } from "@formforge/db";
import db, { users } from "@formforge/db";
import { UpdateProfileSchema } from "@formforge/schemas/user";
import { protectedProcedure, router } from "../../trpc";

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.date().nullable(),
  image: z.string().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

export const usersRouter = router({
  me: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/users/me',
        tags: ['Users'],
        summary: 'Get current user profile',
        protect: true,
      },
    })
    .input(z.object({}))
    .output(UserSchema)
    .query(async ({ ctx }) => {
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id));
    if (!user) throw new Error("User not found");
    const { password: _p, ...safe } = user;
    return safe;
  }),

  updateProfile: protectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/users/me',
        tags: ['Users'],
        summary: 'Update current user profile',
        protect: true,
      },
    })
    .input(UpdateProfileSchema)
    .output(UserSchema)
    .mutation(async ({ ctx, input }) => {
    const updateResult = await db
      .update(users)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(users.id, ctx.user.id))
      .returning();
    const updated = updateResult[0];
    if (!updated) throw new Error("User not found");
    const { password: _p, ...safe } = updated;
    return safe;
  }),
});
