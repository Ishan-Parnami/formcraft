import { router, tRPCContext } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { formsRouter } from "./routes/forms/route";
import { fieldsRouter } from "./routes/fields/route";
import { responsesRouter } from "./routes/responses/route";
import { analyticsRouter } from "./routes/analytics/route";
import { exploreRouter } from "./routes/explore/route";
import { themesRouter } from "./routes/themes/route";
import { usersRouter } from "./routes/users/route";

export const serverRouter = router({
  health: healthRouter,
  forms: formsRouter,
  fields: fieldsRouter,
  responses: responsesRouter,
  analytics: analyticsRouter,
  explore: exploreRouter,
  themes: themesRouter,
  users: usersRouter,
});

export const createCallerFactory = tRPCContext.createCallerFactory;
export { createContext } from "./context";
export type { SessionUser, CreateContextOptions } from "./context";
export type ServerRouter = typeof serverRouter;
