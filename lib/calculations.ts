import { ACTIVE_WEEKS, DEFAULT_WEEKLY_FEE, MONTHS } from "./constants";

export type PaymentLike = { memberId: string; month: string; amount: unknown };

export function requiredForMonth(month: string) {
  return (ACTIVE_WEEKS[month] ?? 0) * DEFAULT_WEEKLY_FEE;
}

export function paymentStatus(required: number, paid: number) {
  if (paid === 0) return "BELUM BAYAR" as const;
  if (paid < required) return "CICILAN" as const;
  if (paid === required) return "LUNAS" as const;
  return "LUNAS, LEBIH" as const;
}

export function monthSummary(month: string, members: { id: string }[], payments: PaymentLike[]) {
  const required = requiredForMonth(month);
  const rows = members.map((member) => {
    const paid = payments
      .filter((p) => p.memberId === member.id && p.month === month)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const shortfall = Math.max(required - paid, 0);
    return { memberId: member.id, required, paid, shortfall, status: paymentStatus(required, paid) };
  });
  return {
    month,
    totalRequired: rows.reduce((s, r) => s + r.required, 0),
    totalPaid: rows.reduce((s, r) => s + r.paid, 0),
    totalOutstanding: rows.reduce((s, r) => s + r.shortfall, 0),
    paid: rows.filter((r) => r.status === "LUNAS" || r.status === "LUNAS, LEBIH").length,
    installment: rows.filter((r) => r.status === "CICILAN").length,
    unpaid: rows.filter((r) => r.status === "BELUM BAYAR").length
  };
}

export function academicMonths() {
  return [...MONTHS];
}
