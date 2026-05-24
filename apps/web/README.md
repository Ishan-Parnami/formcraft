# FormForge — Web

Next.js 16 frontend for FormForge. See the [root README](../../README.md) for full setup and deployment instructions.

## Local dev

```bash
# From monorepo root
pnpm dev
```

Opens at [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy from the root example:

```bash
cp ../../.env.example .env.local
```

Required:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | 32-char random secret |
| `NEXTAUTH_URL` | App URL (`http://localhost:3000` in dev) |
| `NEXT_PUBLIC_APP_URL` | Same as `NEXTAUTH_URL` |
