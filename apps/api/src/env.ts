import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().optional().default("3001"),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  BASE_URL: z.string().default("http://localhost:3001"),
  DATABASE_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const result = envSchema.safeParse(env);
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}

export const env = createEnv(process.env);
