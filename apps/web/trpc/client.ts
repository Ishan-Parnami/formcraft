import { createTRPCReact } from "@trpc/react-query";
import { ServerRouter } from "@formforge/trpc/client";

export const trpc = createTRPCReact<ServerRouter>();
