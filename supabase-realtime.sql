-- Run this in Supabase SQL Editor after connecting your project.
-- Prisma creates quoted table names, so keep the exact names below.
alter publication supabase_realtime add table "Payment";
alter publication supabase_realtime add table "Expense";

-- Create a private Storage bucket named `receipts` in Supabase Storage.
-- The application uploads through the service role and generates short-lived signed URLs.
