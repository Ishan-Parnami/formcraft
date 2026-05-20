import { createTRPCReact } from "@trpc/react-query";
import { ServerRouter } from "@formcraft/trpc/client";

export const trpc = createTRPCReact<ServerRouter>();
