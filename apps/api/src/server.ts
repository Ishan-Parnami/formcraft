import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@formforge/trpc/server";
import type { SessionUser, CreateContextOptions } from "@formforge/trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

import { env } from "./env";

export const app = express();

app.use(
  cors({
    origin: env.NODE_ENV === "production" ? false : "*",
  })
);

app.use(express.json());

// Attach user from JWT/session token if present
app.use((req, _res, next) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ") && env.NEXTAUTH_SECRET) {
    try {
      const token = auth.slice(7);
      const decoded = jwt.verify(token, env.NEXTAUTH_SECRET) as { sub?: string; email?: string; name?: string };
      (req as typeof req & { user?: SessionUser }).user = {
        id: decoded.sub ?? "",
        email: decoded.email ?? "",
        name: decoded.name ?? "",
      };
    } catch {
      // Invalid token — proceed as unauthenticated
    }
  }
  next();
});

const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "FormForge API",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

app.get("/", (_req, res) => {
  res.json({ message: "FormForge API is running", version: "1.0.0" });
});

app.get("/health", (_req, res) => {
  res.json({ healthy: true });
});

app.get("/openapi.json", (_req, res) => {
  res.json(openApiDocument);
});

app.use("/docs", apiReference({ url: "/openapi.json" }));

async function adaptContext({ req, res }: CreateExpressContextOptions) {
  return createContext({
    req: {
      user: (req as typeof req & { user?: SessionUser }).user,
      ip: req.ip,
      headers: req.headers as Record<string, string>,
    },
    res,
  });
}

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext: adaptContext,
  })
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext: adaptContext,
  })
);

export default app;
