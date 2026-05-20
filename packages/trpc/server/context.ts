export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

export interface ContextRequest {
  user?: SessionUser | null;
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
}

export interface CreateContextOptions {
  req: ContextRequest;
  res?: unknown;
}

export async function createContext({ req }: CreateContextOptions) {
  const user = req.user ?? null;
  return { user, req };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
