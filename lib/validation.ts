import { z } from "zod";

export const paymentSchema = z.object({
  memberId: z.string().min(1),
  month: z.string().min(1),
  week: z.number().int().min(1).max(5),
  date: z.coerce.date(),
  amount: z.number().positive(),
  method: z.enum(["CASH", "TRANSFER", "OTHER"]),
  note: z.string().max(500).optional().nullable()
});

export const memberSchema = z.object({
  name: z.string().trim().min(1).max(100),
  classInfo: z.string().max(100).optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE")
});

export const expenseSchema = z.object({
  date: z.coerce.date(),
  subcategoryId: z.string().min(1),
  description: z.string().trim().min(1).max(500),
  recipient: z.string().max(200).optional().nullable(),
  amount: z.number().positive(),
  method: z.enum(["CASH", "TRANSFER", "OTHER"]),
  receipt: z.string().max(500).optional().nullable(),
  receiptRef: z.string().max(100).optional().nullable(),
  approvedBy: z.string().max(100).optional().nullable(),
  note: z.string().max(500).optional().nullable()
});
