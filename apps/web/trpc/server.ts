import { cache } from "react";
import { serverRouter, createContext, createCallerFactory } from "@formcraft/trpc/server";
import { auth } from "~/auth";

const createCaller = createCallerFactory(serverRouter);

export const getApi = cache(async () => {
  const session = await auth();
  const ctx = await createContext({
    req: {
      user: session?.user?.id
        ? {
            id: session.user.id,
            email: session.user.email ?? "",
            name: session.user.name ?? "",
          }
        : null,
    },
  });
  return createCaller(ctx);
});
