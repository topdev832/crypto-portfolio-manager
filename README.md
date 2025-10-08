This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Migrations & Supabase

This project uses Supabase for the backend database. A SQL migration to create the `transactions` table is included at `supabase/migrations/001_create_transactions.sql`.

How to apply the migration

- Option A — Supabase SQL editor (quick):
	1. Open your project in the Supabase dashboard → SQL Editor.
 2. Paste the contents of `supabase/migrations/001_create_transactions.sql` and run it.

- Option B — Supabase CLI (recommended for CI / local workflow):
	1. Install the Supabase CLI: `npm install -g supabase`.
	2. Login: `supabase login` and follow the prompt.
	3. Push the local migrations: `supabase db push` (ensure your `supabase` config is set to point at your project).

Row Level Security (RLS)

The migration enables RLS and adds a basic policy so authenticated users can only manage their own transactions. When running policies from the CLI or local scripts, use the `service_role` key only on the server side.

Fixing SQL linting errors in VS Code

Your SQL migration is Postgres-specific. If your editor shows lint errors (about `CREATE EXTENSION`, `gen_random_uuid()`, or `CREATE INDEX IF NOT EXISTS`), the reason is your editor is validating with the wrong SQL dialect (for example, T-SQL / MSSQL).

To fix this in VS Code:
1. Install the `SQLTools` extension and the `SQLTools PostgreSQL/Redshift` driver from the Extensions pane.
2. Open `SQLTools` → Connections → New Connection and enter your Supabase DB credentials (host, port, database, user, password). Save the connection.
3. Open `supabase/migrations/001_create_transactions.sql`, click the connection selector in the SQLTools pane and set the language/dialect to PostgreSQL — the false-positive errors should disappear.

If you prefer a quicker workaround, set the language mode of the open SQL file to `SQL` or `PostgreSQL` using the language selector in the bottom-right of VS Code.

## Local setup (quick)


• Create a `.env.local` in the project root and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

• Install and run:

```powershell
npm install
npm run dev
```

• Visit `http://localhost:3000` and sign up or sign in.

## Deployment

- Deploy to Vercel, set the three environment variables above in the Vercel project settings.
- Confirm RLS policies in Supabase to restrict access to each user's rows (see policies above).


