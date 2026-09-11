# Kas Kelas V2

V2 adds authenticated treasurer access, full payment and expense CRUD, receipt uploads, and Supabase Realtime refreshes.

## 1. Install

```bash
npm install
```

## 2. Environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL`: PostgreSQL connection string. For realtime, use the same Supabase Postgres database used by Supabase Realtime.
- `AUTH_SECRET`: long random secret.
- `ADMIN_USERNAME`: initial treasurer username.
- `ADMIN_PASSWORD`: initial treasurer password, minimum 8 characters.
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_RECEIPT_BUCKET=receipts`

## 3. Database

```bash
npx prisma db push
npx prisma generate
npm run db:seed
```

The seed imports the supplied workbook and creates the initial treasurer account. It also resets the transactional tables, so only run it when a reset is intended.

## 4. Supabase Storage

Create a **private** Storage bucket named `receipts`. The service role handles uploads; the app generates short-lived signed URLs for authenticated users.

## 5. Supabase Realtime

Run `supabase-realtime.sql` in Supabase SQL Editor. It adds `Payment` and `Expense` to `supabase_realtime`. The dashboard subscribes to Postgres changes and refetches real data when a mutation occurs.

## 6. Start

```bash
npm run dev
```

Open `http://localhost:3000/login` and use the configured admin credentials.

## 7. Production

Before launch, use a managed PostgreSQL/Supabase project, HTTPS, a real `AUTH_SECRET`, a strong admin password, a private receipts bucket, and a custom domain. Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
