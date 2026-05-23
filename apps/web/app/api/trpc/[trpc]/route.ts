import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { serverRouter } from "@formforge/trpc/server";
import { auth } from "~/auth";

const handler = async (req: Request) => {
  const session = await auth();

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: serverRouter,
    createContext: () => ({
      user: session?.user?.id
        ? {
            id: session.user.id,
            email: session.user.email ?? "",
            name: session.user.name ?? "",
          }
        : null,
      req: { headers: Object.fromEntries(new Headers(req.headers)) },
    }),
  });
};

export { handler as GET, handler as POST };
