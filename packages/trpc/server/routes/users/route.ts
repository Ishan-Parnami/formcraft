import { z } from "zod";
import { eq } from "@formcraft/db";
import db, { users } from "@formcraft/db";
import { UpdateProfileSchema } from "@formcraft/schemas/user";
import { protectedProcedure, router } from "../../trpc";

export const usersRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id));
    if (!user) throw new Error("User not found");
    const { password: _p, ...safe } = user;
    return safe;
  }),

  updateProfile: protectedProcedure
    .input(UpdateProfileSchema)
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
